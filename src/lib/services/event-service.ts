import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { QueryClient } from "@tanstack/react-query";
import deployments from "../../../registry/deployments.json";
import { invalidateProtocolQueries, TRANSACTION_HISTORY_QUERY_KEY } from "../../hooks/protocol-query-keys";

const NETWORK = "testnet";
const RPC_URL = "https://soroban-testnet.stellar.org";
// There is no push/subscribe transport for Soroban contract events -- `getEvents` is a
// request/response JSON-RPC call, so "subscribing" means re-querying it on a short timer.
// 4s roughly matches Stellar's ledger close time; polling faster just re-reads the same ledger.
const POLL_MS = 4_000;
const MAX_HISTORY = 50;
// Bounds the seen-event dedup set so a long-running tab doesn't accumulate memory forever.
const MAX_SEEN_IDS = 1_000;
// getEvents' error message for an out-of-range startLedger is a plain string (no structured
// fields), e.g. "startLedger must be within the ledger range: 3759273 - 3880232".
const LEDGER_RANGE_ERROR = /ledger range:\s*(\d+)\s*-\s*(\d+)/i;

export type ProtocolEventType = "Supply" | "Withdraw" | "Borrow" | "Repay" | "Liquidation";

export interface ProtocolEvent {
  type: ProtocolEventType;
  contractId: string;
  ledger: number;
  txHash: string;
  ledgerClosedAt: string;
  topics: unknown[];
  data: unknown;
}

// Maps the first topic (a Soroban Symbol) published by each contract's `env.events().publish(...)`
// call to the protocol-level event name. See contracts/lending_pool/src/lib.rs and
// contracts/liquidation_engine/src/lib.rs for the emitting sites.
const TOPIC_TO_EVENT: Record<string, ProtocolEventType> = {
  deposit: "Supply",
  withdraw: "Withdraw",
  borrow: "Borrow",
  repay: "Repay",
  liquidate: "Liquidation",
  liq_burn: "Liquidation",
  collat_seized: "Liquidation",
};

type Registry = Record<string, string>;

/**
 * Subscribes to real Soroban contract events emitted by the lending_pool and
 * liquidation_engine contracts, and invalidates the affected React Query caches whenever a
 * Supply/Withdraw/Borrow/Repay/Liquidation event lands on-chain -- including ones caused by
 * OTHER users' wallets, which `useProtocolMutationSuccess` (invalidation after the current
 * user's own transaction) can never see.
 *
 * This is the single place in the app that talks to `getEvents`; hooks and components never
 * subscribe directly (see AGENTS.md architecture: React -> Hooks -> Services -> SDK -> Soroban).
 */
export class EventService {
  private server: rpc.Server;
  private contractIds: string[];
  private cursor: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private queryClient: QueryClient | null = null;
  private inFlight = false;
  // Insertion-ordered set of already-processed event ids -- guards against the same event
  // being invalidated twice (overlapping ledger ranges after a cursor reset, duplicate RPC
  // responses, etc). Soroban's own event `id` already encodes ledger+tx+op+event index, so
  // it's a stable, sufficient de-dup key on its own.
  private seenEventIds: Set<string> = new Set();
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  constructor(registry: Registry) {
    this.server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
    this.contractIds = [registry["lending_pool"], registry["liquidation_engine"]].filter(
      (id): id is string => Boolean(id)
    );
  }

  /** Idempotent: calling start() while already running is a no-op. */
  start(queryClient: QueryClient): void {
    if (this.timer || this.contractIds.length === 0) return;
    this.queryClient = queryClient;
    this.timer = setInterval(() => void this.poll(), POLL_MS);
    void this.poll();

    // A laptop lid closing/reopening (or a phone backgrounding the tab) suspends timers for
    // an arbitrary duration; when the page becomes visible/online again we don't want to
    // wait up to POLL_MS for the next tick to notice -- poll immediately, and let poll()'s
    // own cursor-recovery logic handle however stale the cursor now is.
    if (typeof document !== "undefined") {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible") void this.poll();
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
    if (typeof window !== "undefined") {
      this.onlineHandler = () => void this.poll();
      window.addEventListener("online", this.onlineHandler);
    }
  }

  /** Stops the timer and listeners. Safe to call multiple times; must be called on unmount. */
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.queryClient = null;
    this.cursor = null;
    this.seenEventIds.clear();

    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    this.visibilityHandler = null;
    if (this.onlineHandler && typeof window !== "undefined") {
      window.removeEventListener("online", this.onlineHandler);
    }
    this.onlineHandler = null;
  }

  private async poll(): Promise<void> {
    if (this.inFlight || !this.queryClient) return;
    this.inFlight = true;
    try {
      if (this.cursor === null) {
        const latest = await this.server.getLatestLedger();
        this.cursor = latest.sequence;
        return;
      }

      const response = await this.server.getEvents({
        startLedger: this.cursor + 1,
        filters: [{ type: "contract", contractIds: this.contractIds }],
        limit: 100,
      });

      for (const raw of response.events) {
        this.handleEvent(raw);
      }
      this.cursor = response.latestLedger;
    } catch (err) {
      await this.recoverCursor(err);
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * Runs whenever a `getEvents` call fails -- covers the "startLedger must be within the
   * ledger range" error (our cursor drifted outside the RPC node's retention window, e.g.
   * after a browser sleep/resume or a long network outage) as well as any other transient
   * RPC failure (outage, timeout, reconnect).
   *
   * Recovery strategy: that error's message already states the node's current retention
   * window (`ledger range: <oldest> - <latest>`), which tells us both directions a cursor can
   * drift -- parse it and clamp directly:
   *  - cursor behind `oldest` (e.g. after a long sleep/outage past the ~7-day retention
   *    window): jump forward to `oldest` -- we accept losing events older than the window
   *    rather than getting stuck forever retrying a range the node will never serve again.
   *  - cursor ahead of `latest` (clock skew / an optimistic cursor that outran the chain tip):
   *    clamp back to `latest`.
   * For any other failure shape (outage, timeout, CORS, reconnect -- no ledger range in the
   * message), fall back to `getLatestLedger` (a cheap, always-supported call) purely to catch
   * an overshot cursor; if that call itself fails, the RPC endpoint is still down, so the
   * cursor is left untouched and the next tick retries.
   */
  private async recoverCursor(err: unknown): Promise<void> {
    // @stellar/stellar-sdk's rpc.Server rejects with the raw JSON-RPC error object
    // ({ code, message }), not an Error instance -- String(err) on that yields
    // "[object Object]", silently swallowing the exact info we need to recover.
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);

    const match = message.match(LEDGER_RANGE_ERROR);
    if (match) {
      const oldest = Number(match[1]);
      const latest = Number(match[2]);
      if (this.cursor === null || this.cursor + 1 < oldest) {
        this.cursor = oldest - 1;
      } else if (this.cursor + 1 > latest) {
        this.cursor = latest;
      }
      return;
    }

    try {
      const latest = await this.server.getLatestLedger();
      if (this.cursor === null || this.cursor > latest.sequence) {
        this.cursor = latest.sequence;
      }
    } catch {
      // RPC endpoint itself is unreachable -- leave the cursor untouched; next tick retries.
    }
  }

  private handleEvent(raw: rpc.Api.EventResponse): void {
    if (!this.queryClient || raw.topic.length === 0) return;

    // Soroban's event `id` already encodes ledger + transaction + operation + event index,
    // so it's a stable identifier for "have we processed this exact event before" -- protects
    // against the same event being invalidated twice if a cursor reset re-requests a ledger
    // range we already saw.
    if (this.seenEventIds.has(raw.id)) return;
    this.seenEventIds.add(raw.id);
    if (this.seenEventIds.size > MAX_SEEN_IDS) {
      const oldest = this.seenEventIds.values().next().value;
      if (oldest !== undefined) this.seenEventIds.delete(oldest);
    }

    let topicName: string;
    try {
      topicName = String(scValToNative(raw.topic[0]));
    } catch {
      return;
    }

    const type = TOPIC_TO_EVENT[topicName];
    if (!type) return;

    let topics: unknown[] = [];
    let data: unknown;
    try {
      topics = raw.topic.map((t) => scValToNative(t));
      data = scValToNative(raw.value);
    } catch {
      // Decoding failed but we still know the event *type* -- invalidate queries below
      // rather than dropping the notification entirely.
    }

    const event: ProtocolEvent = {
      type,
      contractId: String(raw.contractId ?? ""),
      ledger: raw.ledger,
      txHash: raw.txHash,
      ledgerClosedAt: raw.ledgerClosedAt,
      topics,
      data,
    };

    invalidateProtocolQueries(this.queryClient);

    this.queryClient.setQueryData<ProtocolEvent[]>(TRANSACTION_HISTORY_QUERY_KEY, (prev = []) =>
      [event, ...prev].slice(0, MAX_HISTORY)
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const eventService = new EventService((deployments as Record<string, any>)[NETWORK]);
