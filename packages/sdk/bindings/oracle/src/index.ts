import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CD4HRMQGXNOO4CDB4J7PQYI5MTFQNA2TGIMRMFUHP5Q3PH7T2EB6SUTT",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Price", values: readonly [string]};


export interface PriceData {
  price: i128;
  timestamp: u64;
}

export interface Client {
  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retrieves the current admin.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Gets the current price of an asset. Panics if the asset price does not exist.
   */
  get_price: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sets the price for a specific asset. Only the admin can call this.
   * Price is represented as a fixed-point integer (e.g. 7 decimals for XLM).
   */
  set_price: ({asset, price}: {asset: string, price: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the oracle contract with an admin.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a price_exists transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Checks if a price exists for a given asset.
   */
  price_exists: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a transfer_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfers the admin role to a new address.
   */
  transfer_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_last_updated transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Gets the timestamp of the last price update for a given asset.
   */
  get_last_updated: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAABxSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgYWRtaW4uAAAACWdldF9hZG1pbgAAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAE1HZXRzIHRoZSBjdXJyZW50IHByaWNlIG9mIGFuIGFzc2V0LiBQYW5pY3MgaWYgdGhlIGFzc2V0IHByaWNlIGRvZXMgbm90IGV4aXN0LgAAAAAAAAlnZXRfcHJpY2UAAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAItTZXRzIHRoZSBwcmljZSBmb3IgYSBzcGVjaWZpYyBhc3NldC4gT25seSB0aGUgYWRtaW4gY2FuIGNhbGwgdGhpcy4KUHJpY2UgaXMgcmVwcmVzZW50ZWQgYXMgYSBmaXhlZC1wb2ludCBpbnRlZ2VyIChlLmcuIDcgZGVjaW1hbHMgZm9yIFhMTSkuAAAAAAlzZXRfcHJpY2UAAAAAAAACAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAABXByaWNlAAAAAAAACwAAAAA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAFUHJpY2UAAAAAAAABAAAAEw==",
        "AAAAAAAAAC5Jbml0aWFsaXplcyB0aGUgb3JhY2xlIGNvbnRyYWN0IHdpdGggYW4gYWRtaW4uAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAQAAAAAAAAAAAAAACVByaWNlRGF0YQAAAAAAAAIAAAAAAAAABXByaWNlAAAAAAAACwAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAAAAAAACtDaGVja3MgaWYgYSBwcmljZSBleGlzdHMgZm9yIGEgZ2l2ZW4gYXNzZXQuAAAAAAxwcmljZV9leGlzdHMAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAACpUcmFuc2ZlcnMgdGhlIGFkbWluIHJvbGUgdG8gYSBuZXcgYWRkcmVzcy4AAAAAAA50cmFuc2Zlcl9hZG1pbgAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAD5HZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIGxhc3QgcHJpY2UgdXBkYXRlIGZvciBhIGdpdmVuIGFzc2V0LgAAAAAAEGdldF9sYXN0X3VwZGF0ZWQAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAABg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_admin: this.txFromJSON<string>,
        get_price: this.txFromJSON<i128>,
        set_price: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        price_exists: this.txFromJSON<boolean>,
        transfer_admin: this.txFromJSON<null>,
        get_last_updated: this.txFromJSON<u64>
  }
}