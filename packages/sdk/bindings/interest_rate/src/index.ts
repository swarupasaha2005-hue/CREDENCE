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
    contractId: "CA7QVKZN7YYVQ4XWYRSJKRN4FODGGLJ4P4ZYXKHOMQTJ3DM4HRGWQT3Q",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "BorrowIndex", values: readonly [string]} | {tag: "LastUpdated", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the contract.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_borrow_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculates the Borrow APR in BPS using an Aave-style piecewise linear interest curve.
   */
  get_borrow_rate: ({utilization, base_rate, optimal_utilization, slope1, slope2}: {utilization: i128, base_rate: i128, optimal_utilization: i128, slope1: i128, slope2: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_supply_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculates the Supply APR in BPS: Borrow Rate * Utilization * (1 - Reserve Factor).
   */
  get_supply_rate: ({borrow_rate, utilization, reserve_factor}: {borrow_rate: i128, utilization: i128, reserve_factor: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_borrow_index transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retrieves the current borrow index for an asset, defaulted to 1e18 (WAD).
   */
  get_borrow_index: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_last_updated transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retrieves the timestamp of the last index update for an asset.
   */
  get_last_updated: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_reserve_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculates the Reserve Rate (income to treasury) in BPS: Borrow Rate * Utilization * Reserve Factor.
   */
  get_reserve_rate: ({borrow_rate, utilization, reserve_factor}: {borrow_rate: i128, utilization: i128, reserve_factor: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a update_borrow_index transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Updates the global borrow index for a specific asset based on elapsed time and current borrow APR.
   * Only the Lending Pool (or Admin) should be authorized to call this during state transitions.
   */
  update_borrow_index: ({asset, borrow_rate}: {asset: string, borrow_rate: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_utilization_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculates the pool utilization rate in BPS (10000 = 100%).
   */
  get_utilization_rate: ({total_liquidity, total_borrowed}: {total_liquidity: i128, total_borrowed: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAALQm9ycm93SW5kZXgAAAAAAQAAABMAAAABAAAAAAAAAAtMYXN0VXBkYXRlZAAAAAABAAAAEw==",
        "AAAAAAAAABlJbml0aWFsaXplcyB0aGUgY29udHJhY3QuAAAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAFVDYWxjdWxhdGVzIHRoZSBCb3Jyb3cgQVBSIGluIEJQUyB1c2luZyBhbiBBYXZlLXN0eWxlIHBpZWNld2lzZSBsaW5lYXIgaW50ZXJlc3QgY3VydmUuAAAAAAAAD2dldF9ib3Jyb3dfcmF0ZQAAAAAFAAAAAAAAAAt1dGlsaXphdGlvbgAAAAALAAAAAAAAAAliYXNlX3JhdGUAAAAAAAALAAAAAAAAABNvcHRpbWFsX3V0aWxpemF0aW9uAAAAAAsAAAAAAAAABnNsb3BlMQAAAAAACwAAAAAAAAAGc2xvcGUyAAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAFNDYWxjdWxhdGVzIHRoZSBTdXBwbHkgQVBSIGluIEJQUzogQm9ycm93IFJhdGUgKiBVdGlsaXphdGlvbiAqICgxIC0gUmVzZXJ2ZSBGYWN0b3IpLgAAAAAPZ2V0X3N1cHBseV9yYXRlAAAAAAMAAAAAAAAAC2JvcnJvd19yYXRlAAAAAAsAAAAAAAAAC3V0aWxpemF0aW9uAAAAAAsAAAAAAAAADnJlc2VydmVfZmFjdG9yAAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAElSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgYm9ycm93IGluZGV4IGZvciBhbiBhc3NldCwgZGVmYXVsdGVkIHRvIDFlMTggKFdBRCkuAAAAAAAAEGdldF9ib3Jyb3dfaW5kZXgAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAD5SZXRyaWV2ZXMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbGFzdCBpbmRleCB1cGRhdGUgZm9yIGFuIGFzc2V0LgAAAAAAEGdldF9sYXN0X3VwZGF0ZWQAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAABg==",
        "AAAAAAAAAGRDYWxjdWxhdGVzIHRoZSBSZXNlcnZlIFJhdGUgKGluY29tZSB0byB0cmVhc3VyeSkgaW4gQlBTOiBCb3Jyb3cgUmF0ZSAqIFV0aWxpemF0aW9uICogUmVzZXJ2ZSBGYWN0b3IuAAAAEGdldF9yZXNlcnZlX3JhdGUAAAADAAAAAAAAAAtib3Jyb3dfcmF0ZQAAAAALAAAAAAAAAAt1dGlsaXphdGlvbgAAAAALAAAAAAAAAA5yZXNlcnZlX2ZhY3RvcgAAAAAACwAAAAEAAAAL",
        "AAAAAAAAAL9VcGRhdGVzIHRoZSBnbG9iYWwgYm9ycm93IGluZGV4IGZvciBhIHNwZWNpZmljIGFzc2V0IGJhc2VkIG9uIGVsYXBzZWQgdGltZSBhbmQgY3VycmVudCBib3Jyb3cgQVBSLgpPbmx5IHRoZSBMZW5kaW5nIFBvb2wgKG9yIEFkbWluKSBzaG91bGQgYmUgYXV0aG9yaXplZCB0byBjYWxsIHRoaXMgZHVyaW5nIHN0YXRlIHRyYW5zaXRpb25zLgAAAAATdXBkYXRlX2JvcnJvd19pbmRleAAAAAACAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAAC2JvcnJvd19yYXRlAAAAAAsAAAAA",
        "AAAAAAAAADtDYWxjdWxhdGVzIHRoZSBwb29sIHV0aWxpemF0aW9uIHJhdGUgaW4gQlBTICgxMDAwMCA9IDEwMCUpLgAAAAAUZ2V0X3V0aWxpemF0aW9uX3JhdGUAAAACAAAAAAAAAA90b3RhbF9saXF1aWRpdHkAAAAACwAAAAAAAAAOdG90YWxfYm9ycm93ZWQAAAAAAAsAAAABAAAACw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        get_borrow_rate: this.txFromJSON<i128>,
        get_supply_rate: this.txFromJSON<i128>,
        get_borrow_index: this.txFromJSON<i128>,
        get_last_updated: this.txFromJSON<u64>,
        get_reserve_rate: this.txFromJSON<i128>,
        update_borrow_index: this.txFromJSON<null>,
        get_utilization_rate: this.txFromJSON<i128>
  }
}