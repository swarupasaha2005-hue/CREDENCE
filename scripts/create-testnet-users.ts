/**
 * Deterministic Stellar Testnet onboarding script for Credence.
 *
 * Generates 10+ unique testnet wallets, funds them via Friendbot, and executes real
 * Supply/Withdraw/Borrow/Repay transactions against the already-deployed Credence
 * contracts (see registry/deployments.json). Purely tooling for hackathon verification --
 * it does not touch contracts/, packages/sdk/src, or any protocol logic; it only calls the
 * existing CredenceProtocol SDK the same way the frontend does.
 *
 * Usage:
 *   npx tsx scripts/create-testnet-users.ts
 *
 * Re-running is idempotent: wallets already recorded in scripts/output/testnet-users.json
 * (with a valid secret key) are reused rather than regenerated, and any of their action
 * steps already marked "success" are skipped rather than re-submitted.
 */

import * as fs from "fs";
import * as path from "path";
import { Keypair, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { CredenceProtocol, TransactionSigner } from "../packages/sdk/src";
import deploymentsJson from "../registry/deployments.json";

const NETWORK = "testnet";
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const WALLET_COUNT = 10;

const OUTPUT_PATH = path.join(__dirname, "output", "testnet-users.json");
const REPORT_PATH = path.join(__dirname, "..", "docs", "testnet-users.md");

// Every SAC decimals value used below is read straight out of registry/deployments.json's
// `assets` map at runtime -- this constant only documents the shape, not a hardcoded value.
const XLM_SYMBOL = "XLM";

type FundingStatus = "pending" | "funded" | "already_funded" | "failed";
type ActionStatus = "success" | "failed" | "skipped";
type ActionKind = "supply" | "withdraw" | "borrow" | "repay";

interface ActionPlanStep {
  kind: ActionKind;
  /** The asset the hackathon brief asked for (e.g. "USDC"). */
  assetRequested: string;
  qty: number;
}

interface ActionResult extends ActionPlanStep {
  /** The asset actually used on-chain -- see substitution note below. */
  assetExecuted: string;
  status: ActionStatus;
  txHash?: string;
  error?: string;
  timestampIso: string;
  attempts: number;
}

interface WalletRecord {
  index: number;
  publicKey: string;
  secretKey: string;
  fundingStatus: FundingStatus;
  fundingAttempts: number;
  actions: ActionResult[];
}

interface OutputFile {
  network: string;
  generatedAtIso: string;
  wallets: WalletRecord[];
}

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generic retry with exponential backoff. Logs every attempt so failures are traceable. */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  { attempts = 4, baseDelayMs = 2000 }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      log(`  retry ${attempt}/${attempts} failed for ${label}: ${message}`);
      if (attempt < attempts) {
        await sleep(baseDelayMs * attempt);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ---------------------------------------------------------------------------
// Persistence (idempotent load/save of scripts/output/testnet-users.json)
// ---------------------------------------------------------------------------

function loadExisting(): OutputFile | null {
  if (!fs.existsSync(OUTPUT_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) as OutputFile;
  } catch {
    log(`Existing ${OUTPUT_PATH} could not be parsed -- starting fresh.`);
    return null;
  }
}

function save(output: OutputFile): void {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Step 1 + 2: generate wallets, fund via Friendbot (retry + rate-limit handling)
// ---------------------------------------------------------------------------

function ensureWallets(existing: OutputFile | null): WalletRecord[] {
  const wallets: WalletRecord[] = existing?.wallets ? [...existing.wallets] : [];

  while (wallets.length < WALLET_COUNT) {
    const kp = Keypair.random();
    wallets.push({
      index: wallets.length,
      publicKey: kp.publicKey(),
      secretKey: kp.secret(),
      fundingStatus: "pending",
      fundingAttempts: 0,
      actions: [],
    });
  }

  return wallets;
}

async function fundWallet(wallet: WalletRecord): Promise<void> {
  if (wallet.fundingStatus === "funded" || wallet.fundingStatus === "already_funded") {
    log(`Wallet ${wallet.index + 1} (${wallet.publicKey}) already funded -- skipping Friendbot.`);
    return;
  }

  try {
    await withRetry(
      `Friendbot funding for wallet ${wallet.index + 1}`,
      async () => {
        wallet.fundingAttempts += 1;
        const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(wallet.publicKey)}`);
        const body = await res.text();

        if (res.status === 429) {
          throw new Error("Friendbot rate limit (429) -- backing off");
        }
        if (res.ok) {
          wallet.fundingStatus = "funded";
          return;
        }
        if (/already.*(fund|exist)/i.test(body)) {
          wallet.fundingStatus = "already_funded";
          return;
        }
        throw new Error(`Friendbot returned ${res.status}: ${body.slice(0, 200)}`);
      },
      { attempts: 5, baseDelayMs: 3000 }
    );
    log(`Funded wallet ${wallet.index + 1}: ${wallet.publicKey} (${wallet.fundingStatus})`);
  } catch (err) {
    wallet.fundingStatus = "failed";
    log(`Funding FAILED for wallet ${wallet.index + 1} (${wallet.publicKey}): ${String(err)}`);
  }

  // Be gentle on Friendbot's rate limiter between wallets.
  await sleep(1500);
}

/** Step 4: block until the RPC node actually reports the account existing on-chain. */
async function waitForFundingConfirmation(server: rpc.Server, wallet: WalletRecord): Promise<boolean> {
  if (wallet.fundingStatus === "failed") return false;

  try {
    await withRetry(
      `on-chain confirmation for wallet ${wallet.index + 1}`,
      async () => {
        await server.getAccount(wallet.publicKey);
      },
      { attempts: 5, baseDelayMs: 2000 }
    );
    return true;
  } catch (err) {
    log(`Could not confirm wallet ${wallet.index + 1} on-chain: ${String(err)}`);
    wallet.fundingStatus = "failed";
    return false;
  }
}

// ---------------------------------------------------------------------------
// Step 5 + 6: action plan (distributes Supply/Borrow/Repay/Withdraw across wallets)
// ---------------------------------------------------------------------------

/**
 * USDC/AQUA on this deployment are classic Stellar assets wrapped as SACs (see
 * registry/deployments.json's `assets` entries) -- a wallet needs a trustline *and* a
 * balance, both of which require the issuer's secret key to mint. This script only has
 * Friendbot-funded XLM available, and does not have (and must not fabricate) the issuer
 * keys for USDC/AQUA. Any USDC/AQUA-labeled step below is therefore executed against XLM
 * instead, with both the originally-requested and actually-executed asset recorded in the
 * output -- no balance, transaction, or event is ever faked to paper over this gap.
 */
function actionPlanFor(index: number): ActionPlanStep[] {
  const plans: ActionPlanStep[][] = [
    [{ kind: "supply", assetRequested: "XLM", qty: 30 }],
    [{ kind: "supply", assetRequested: "USDC", qty: 25 }],
    [
      { kind: "supply", assetRequested: "XLM", qty: 30 },
      { kind: "borrow", assetRequested: "XLM", qty: 3 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 30 },
      { kind: "borrow", assetRequested: "USDC", qty: 3 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 30 },
      { kind: "borrow", assetRequested: "XLM", qty: 3 },
      { kind: "repay", assetRequested: "XLM", qty: 3 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 30 },
      { kind: "withdraw", assetRequested: "XLM", qty: 10 },
    ],
    // Wallets 7-10: mixed sequences exercising every action in one lifecycle.
    [
      { kind: "supply", assetRequested: "XLM", qty: 20 },
      { kind: "borrow", assetRequested: "XLM", qty: 3 },
      { kind: "repay", assetRequested: "XLM", qty: 3 },
      { kind: "withdraw", assetRequested: "XLM", qty: 5 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 20 },
      { kind: "withdraw", assetRequested: "XLM", qty: 5 },
      { kind: "supply", assetRequested: "XLM", qty: 5 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 25 },
      { kind: "borrow", assetRequested: "XLM", qty: 4 },
      { kind: "repay", assetRequested: "XLM", qty: 4 },
      { kind: "withdraw", assetRequested: "XLM", qty: 10 },
    ],
    [
      { kind: "supply", assetRequested: "XLM", qty: 15 },
      { kind: "withdraw", assetRequested: "XLM", qty: 5 },
      { kind: "supply", assetRequested: "XLM", qty: 10 },
    ],
  ];
  return plans[index % plans.length];
}

// ---------------------------------------------------------------------------
// Step 5: execute real transactions via the existing CredenceProtocol SDK
// ---------------------------------------------------------------------------

async function runActionsForWallet(
  protocol: CredenceProtocol,
  wallet: WalletRecord,
  decimalsBySymbol: Record<string, number>
): Promise<void> {
  const plan = actionPlanFor(wallet.index);

  for (let step = 0; step < plan.length; step++) {
    const planStep = plan[step];
    const alreadyDone = wallet.actions[step];
    if (alreadyDone?.status === "success") {
      log(`Wallet ${wallet.index + 1} step ${step + 1} (${planStep.kind}) already succeeded -- skipping.`);
      continue;
    }

    // See actionPlanFor's doc comment: we don't have issuer keys for USDC/AQUA, so those
    // requests execute against XLM, which this wallet's Friendbot funding can actually cover.
    const assetExecuted = planStep.assetRequested === "XLM" ? "XLM" : XLM_SYMBOL;
    if (assetExecuted !== planStep.assetRequested) {
      log(
        `Wallet ${wallet.index + 1} step ${step + 1}: requested asset ${planStep.assetRequested} has no ` +
          `issuer key available to this script -- substituting ${assetExecuted}.`
      );
    }

    const decimals = decimalsBySymbol[assetExecuted] ?? 7;
    const amountRaw = BigInt(Math.round(planStep.qty * 10 ** decimals));

    const result: ActionResult = {
      ...planStep,
      assetExecuted,
      status: "failed",
      timestampIso: new Date().toISOString(),
      attempts: 0,
    };

    try {
      const txHash = await withRetry(
        `wallet ${wallet.index + 1} step ${step + 1} (${planStep.kind} ${assetExecuted})`,
        async () => {
          result.attempts += 1;
          switch (planStep.kind) {
            case "supply":
              return protocol.supply(assetExecuted, amountRaw, wallet.publicKey);
            case "withdraw":
              return protocol.withdraw(assetExecuted, amountRaw, wallet.publicKey);
            case "borrow":
              return protocol.borrow(assetExecuted, amountRaw, wallet.publicKey);
            case "repay":
              return protocol.repay(assetExecuted, amountRaw, wallet.publicKey);
          }
        },
        { attempts: 3, baseDelayMs: 4000 }
      );

      result.status = "success";
      result.txHash = txHash;
      result.timestampIso = new Date().toISOString();
      log(`Wallet ${wallet.index + 1} step ${step + 1} (${planStep.kind}) SUCCESS: ${txHash}`);
    } catch (err) {
      result.status = "failed";
      result.error = err instanceof Error ? err.message : String(err);
      result.timestampIso = new Date().toISOString();
      log(`Wallet ${wallet.index + 1} step ${step + 1} (${planStep.kind}) FAILED: ${result.error}`);
      // A failed step (e.g. insufficient shared-testnet liquidity) shouldn't block the rest
      // of this wallet's sequence from being attempted and recorded.
    }

    wallet.actions[step] = result;
  }
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function generateReport(output: OutputFile): void {
  const wallets = output.wallets;
  const fundedCount = wallets.filter((w) => w.fundingStatus === "funded" || w.fundingStatus === "already_funded").length;
  const allActions = wallets.flatMap((w) => w.actions);
  const successfulActions = allActions.filter((a) => a.status === "success");
  const failedActions = allActions.filter((a) => a.status === "failed");

  const walletRows = wallets
    .map(
      (w) =>
        `| ${w.index + 1} | \`${w.publicKey}\` | ${w.fundingStatus} | ${w.actions.length} | ${
          w.actions.filter((a) => a.status === "success").length
        } |`
    )
    .join("\n");

  const txRows = wallets
    .flatMap((w) =>
      w.actions
        .filter((a) => a.status === "success")
        .map(
          (a) =>
            `| ${w.index + 1} | \`${w.publicKey.slice(0, 8)}...${w.publicKey.slice(-4)}\` | ${a.kind} | ${
              a.assetExecuted
            }${a.assetExecuted !== a.assetRequested ? ` (requested ${a.assetRequested})` : ""} | ${a.qty} | \`${
              a.txHash
            }\` | ${a.timestampIso} |`
        )
    )
    .join("\n");

  const failedRows = failedActions
    .map((a) => {
      const w = wallets.find((wallet) => wallet.actions.includes(a))!;
      return `| ${w.index + 1} | ${a.kind} | ${a.assetExecuted} | ${a.error ?? "unknown error"} |`;
    })
    .join("\n");

  const md = `# Credence Testnet User Verification Report

Generated: ${output.generatedAtIso}
Network: ${output.network}

## Summary

- Total wallets created: ${wallets.length}
- Total wallets funded: ${fundedCount}
- Total transactions attempted: ${allActions.length}
- Total transactions succeeded: ${successfulActions.length}
- Total transactions failed: ${failedActions.length}

## Wallets

| # | Public Key | Funding Status | Actions Attempted | Actions Succeeded |
|---|---|---|---|---|
${walletRows}

Secret keys are stored only in \`scripts/output/testnet-users.json\` (gitignored) -- never in this report.

## Successful Transactions

| Wallet | Address | Action | Asset | Amount | Tx Hash | Timestamp |
|---|---|---|---|---|---|---|
${txRows || "| - | - | - | - | - | - | - |"}

${
  failedActions.length > 0
    ? `## Failed Transactions\n\n| Wallet | Action | Asset | Error |\n|---|---|---|---|\n${failedRows}\n`
    : ""
}

## Notes on Asset Substitution

USDC and AQUA on this deployment are classic Stellar assets wrapped as Soroban Asset
Contracts (see \`registry/deployments.json\`). Minting a testnet balance of either requires
the issuing account's secret key, which this script does not have and does not fabricate.
Any step originally requesting USDC or AQUA was executed against XLM instead (both the
requested and executed asset are recorded per-transaction above) so that every recorded
transaction represents a real, successful, on-chain interaction rather than a faked balance.
`;

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md);
  log(`Report written to ${REPORT_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log("Starting Credence testnet user onboarding...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registry = (deploymentsJson as Record<string, any>)[NETWORK];
  if (!registry) {
    throw new Error(`No deployment registry found for network "${NETWORK}" in registry/deployments.json`);
  }

  const decimalsBySymbol: Record<string, number> = {};
  for (const asset of Object.values(registry.assets ?? {}) as Array<{ symbol: string; decimals: number }>) {
    decimalsBySymbol[asset.symbol] = asset.decimals;
  }

  const existing = loadExisting();
  const wallets = ensureWallets(existing);
  const output: OutputFile = { network: NETWORK, generatedAtIso: new Date().toISOString(), wallets };
  save(output);

  log(`Step 1/5: ${wallets.length} wallets ready (${wallets.filter((w) => w.fundingStatus !== "pending").length} already funded from a previous run).`);

  // Step 2: fund sequentially, gently, with retry/backoff baked into fundWallet().
  for (const wallet of wallets) {
    await fundWallet(wallet);
    save(output);
  }

  const server = new rpc.Server(RPC_URL);

  // Step 4: wait for on-chain confirmation before attempting any transaction against a wallet.
  log("Step 2/5: confirming funding on-chain...");
  for (const wallet of wallets) {
    const confirmed = await waitForFundingConfirmation(server, wallet);
    if (!confirmed) {
      log(`Wallet ${wallet.index + 1} could not be confirmed on-chain -- its actions will be skipped.`);
    }
    save(output);
  }

  const fundedWallets = wallets.filter((w) => w.fundingStatus === "funded" || w.fundingStatus === "already_funded");
  log(`Step 3/5: ${fundedWallets.length}/${wallets.length} wallets confirmed funded on-chain.`);

  // Step 5: wire up a single signer that dispatches to whichever wallet's keypair the SDK
  // asks for, so one CredenceProtocol instance (identical to the one the frontend uses) can
  // drive every wallet's transactions without re-instantiating anything.
  const keypairByAddress = new Map(wallets.map((w) => [w.publicKey, Keypair.fromSecret(w.secretKey)]));
  const signer: TransactionSigner = async (xdr, opts) => {
    const kp = keypairByAddress.get(opts.address);
    if (!kp) throw new Error(`No local keypair known for signer address ${opts.address}`);
    const tx = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);
    tx.sign(kp);
    return tx.toXDR();
  };

  const protocol = new CredenceProtocol(NETWORK, registry);
  protocol.setSigner(signer);

  log("Step 4/5: executing real protocol transactions per wallet...");
  for (const wallet of fundedWallets) {
    await runActionsForWallet(protocol, wallet, decimalsBySymbol);
    save(output);
  }

  log("Step 5/5: generating report...");
  generateReport(output);

  const successfulCount = wallets.flatMap((w) => w.actions).filter((a) => a.status === "success").length;
  log(`Done. ${fundedWallets.length}/${wallets.length} wallets funded, ${successfulCount} successful transactions.`);

  if (fundedWallets.length < WALLET_COUNT) {
    log(`ERROR: fewer than ${WALLET_COUNT} wallets were successfully funded.`);
    process.exit(1);
  }
  if (successfulCount === 0) {
    log("ERROR: no transactions succeeded.");
    process.exit(1);
  }
}

main().catch((err) => {
  log(`FATAL: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exit(1);
});
