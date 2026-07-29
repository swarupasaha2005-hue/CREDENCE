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
    contractId: "CARFUMHTTKBZCMXMZDTFBHTIFILAMUHDCXHQQLZEWL6BIU556GIBWWN5",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Stats", values: readonly [string]};


export interface TreasuryStats {
  current_balance: i128;
  total_deposited: i128;
  total_withdrawn: i128;
}

export interface Client {
  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposits an asset into the treasury. This is permissionless.
   */
  deposit: ({asset, caller, amount}: {asset: string, caller: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraws an asset from the treasury to a recipient. Only callable by the Admin.
   */
  withdraw: ({asset, amount, recipient}: {asset: string, amount: i128, recipient: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the Treasury with a master Admin.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_balance: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfers the admin role to a new address (e.g. a DAO).
   */
  transfer_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_total_deposits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_deposits: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_treasury_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_treasury_stats: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<TreasuryStats>>

  /**
   * Construct and simulate a get_total_withdrawals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_withdrawals: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAAAAAAADxEZXBvc2l0cyBhbiBhc3NldCBpbnRvIHRoZSB0cmVhc3VyeS4gVGhpcyBpcyBwZXJtaXNzaW9ubGVzcy4AAAAHZGVwb3NpdAAAAAADAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAFBXaXRoZHJhd3MgYW4gYXNzZXQgZnJvbSB0aGUgdHJlYXN1cnkgdG8gYSByZWNpcGllbnQuIE9ubHkgY2FsbGFibGUgYnkgdGhlIEFkbWluLgAAAAh3aXRoZHJhdwAAAAMAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAFU3RhdHMAAAAAAAABAAAAEw==",
        "AAAAAAAAAC1Jbml0aWFsaXplcyB0aGUgVHJlYXN1cnkgd2l0aCBhIG1hc3RlciBBZG1pbi4AAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2JhbGFuY2UAAAAAAQAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAADdUcmFuc2ZlcnMgdGhlIGFkbWluIHJvbGUgdG8gYSBuZXcgYWRkcmVzcyAoZS5nLiBhIERBTykuAAAAAA50cmFuc2Zlcl9hZG1pbgAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAQAAAAAAAAAAAAAADVRyZWFzdXJ5U3RhdHMAAAAAAAADAAAAAAAAAA9jdXJyZW50X2JhbGFuY2UAAAAACwAAAAAAAAAPdG90YWxfZGVwb3NpdGVkAAAAAAsAAAAAAAAAD3RvdGFsX3dpdGhkcmF3bgAAAAAL",
        "AAAAAAAAAAAAAAASZ2V0X3RvdGFsX2RlcG9zaXRzAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAASZ2V0X3RyZWFzdXJ5X3N0YXRzAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAH0AAAAA1UcmVhc3VyeVN0YXRzAAAA",
        "AAAAAAAAAAAAAAAVZ2V0X3RvdGFsX3dpdGhkcmF3YWxzAAAAAAAAAQAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    deposit: this.txFromJSON<null>,
        withdraw: this.txFromJSON<null>,
        get_admin: this.txFromJSON<string>,
        initialize: this.txFromJSON<null>,
        get_balance: this.txFromJSON<i128>,
        transfer_admin: this.txFromJSON<null>,
        get_total_deposits: this.txFromJSON<i128>,
        get_treasury_stats: this.txFromJSON<TreasuryStats>,
        get_total_withdrawals: this.txFromJSON<i128>
  }
}