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
    contractId: "CD6KIVR7Q57W37SWE3MX3T5LVX7LXGF7ES2GRKSVFPBHR3MUWYZE4QDK",
  }
} as const

export type DataKey = {tag: "ConfigAddress", values: void} | {tag: "PoolState", values: readonly [string]} | {tag: "UserPosition", values: readonly [string, string]};


export interface PoolState {
  current_borrow_rate: i128;
  current_supply_rate: i128;
  current_utilization: i128;
  total_borrowed: i128;
  total_liquidity: i128;
}


export interface UserPosition {
  collateral_amount: i128;
  last_interaction: u64;
  scaled_debt: i128;
}

export interface Client {
  /**
   * Construct and simulate a repay transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Repays a borrowed asset.
   */
  repay: ({user, asset, amount}: {user: string, asset: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a borrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Borrows assets against collateral.
   */
  borrow: ({user, collateral_asset, borrow_asset, amount}: {user: string, collateral_asset: string, borrow_asset: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the Lending Pool with the central Configuration Contract address.
   */
  initialize: ({config_address}: {config_address: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a deposit_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposits collateral into the pool.
   */
  deposit_collateral: ({user, asset, amount}: {user: string, asset: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_pool_state_view transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pool_state_view: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<PoolState>>

  /**
   * Construct and simulate a withdraw_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraws collateral if health factor allows.
   */
  withdraw_collateral: ({user, collateral_asset, borrow_asset, amount}: {user: string, collateral_asset: string, borrow_asset: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_user_position_view transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_position_view: ({user, asset}: {user: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<UserPosition>>

  /**
   * Construct and simulate a execute_liquidation_burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Called by the Liquidation Engine to burn a borrower's debt and seize collateral.
   * The liquidator's repayment tokens must already have been transferred to this pool
   * (the Liquidation Engine does this before invoking this function).
   */
  execute_liquidation_burn: ({borrower, liquidator, collat_asset, debt_asset, actual_debt_repaid, collat_seized}: {borrower: string, liquidator: string, collat_asset: string, debt_asset: string, actual_debt_repaid: i128, collat_seized: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_current_borrow_index_view transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_current_borrow_index_view: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAAAAAAABhSZXBheXMgYSBib3Jyb3dlZCBhc3NldC4AAAAFcmVwYXkAAAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAACJCb3Jyb3dzIGFzc2V0cyBhZ2FpbnN0IGNvbGxhdGVyYWwuAAAAAAAGYm9ycm93AAAAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAQY29sbGF0ZXJhbF9hc3NldAAAABMAAAAAAAAADGJvcnJvd19hc3NldAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAADUNvbmZpZ0FkZHJlc3MAAAAAAAABAAAAAAAAAAlQb29sU3RhdGUAAAAAAAABAAAAEwAAAAEAAAAAAAAADFVzZXJQb3NpdGlvbgAAAAIAAAATAAAAEw==",
        "AAAAAAAAAE1Jbml0aWFsaXplcyB0aGUgTGVuZGluZyBQb29sIHdpdGggdGhlIGNlbnRyYWwgQ29uZmlndXJhdGlvbiBDb250cmFjdCBhZGRyZXNzLgAAAAAAAAppbml0aWFsaXplAAAAAAABAAAAAAAAAA5jb25maWdfYWRkcmVzcwAAAAAAEwAAAAA=",
        "AAAAAQAAAAAAAAAAAAAACVBvb2xTdGF0ZQAAAAAAAAUAAAAAAAAAE2N1cnJlbnRfYm9ycm93X3JhdGUAAAAACwAAAAAAAAATY3VycmVudF9zdXBwbHlfcmF0ZQAAAAALAAAAAAAAABNjdXJyZW50X3V0aWxpemF0aW9uAAAAAAsAAAAAAAAADnRvdGFsX2JvcnJvd2VkAAAAAAALAAAAAAAAAA90b3RhbF9saXF1aWRpdHkAAAAACw==",
        "AAAAAQAAAAAAAAAAAAAADFVzZXJQb3NpdGlvbgAAAAMAAAAAAAAAEWNvbGxhdGVyYWxfYW1vdW50AAAAAAAACwAAAAAAAAAQbGFzdF9pbnRlcmFjdGlvbgAAAAYAAAAAAAAAC3NjYWxlZF9kZWJ0AAAAAAs=",
        "AAAAAAAAACJEZXBvc2l0cyBjb2xsYXRlcmFsIGludG8gdGhlIHBvb2wuAAAAAAASZGVwb3NpdF9jb2xsYXRlcmFsAAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAATZ2V0X3Bvb2xfc3RhdGVfdmlldwAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAH0AAAAAlQb29sU3RhdGUAAAA=",
        "AAAAAAAAAC1XaXRoZHJhd3MgY29sbGF0ZXJhbCBpZiBoZWFsdGggZmFjdG9yIGFsbG93cy4AAAAAAAATd2l0aGRyYXdfY29sbGF0ZXJhbAAAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAQY29sbGF0ZXJhbF9hc3NldAAAABMAAAAAAAAADGJvcnJvd19hc3NldAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAWZ2V0X3VzZXJfcG9zaXRpb25fdmlldwAAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAfQAAAADFVzZXJQb3NpdGlvbg==",
        "AAAAAAAAAORDYWxsZWQgYnkgdGhlIExpcXVpZGF0aW9uIEVuZ2luZSB0byBidXJuIGEgYm9ycm93ZXIncyBkZWJ0IGFuZCBzZWl6ZSBjb2xsYXRlcmFsLgpUaGUgbGlxdWlkYXRvcidzIHJlcGF5bWVudCB0b2tlbnMgbXVzdCBhbHJlYWR5IGhhdmUgYmVlbiB0cmFuc2ZlcnJlZCB0byB0aGlzIHBvb2wKKHRoZSBMaXF1aWRhdGlvbiBFbmdpbmUgZG9lcyB0aGlzIGJlZm9yZSBpbnZva2luZyB0aGlzIGZ1bmN0aW9uKS4AAAAYZXhlY3V0ZV9saXF1aWRhdGlvbl9idXJuAAAABgAAAAAAAAAIYm9ycm93ZXIAAAATAAAAAAAAAApsaXF1aWRhdG9yAAAAAAATAAAAAAAAAAxjb2xsYXRfYXNzZXQAAAATAAAAAAAAAApkZWJ0X2Fzc2V0AAAAAAATAAAAAAAAABJhY3R1YWxfZGVidF9yZXBhaWQAAAAAAAsAAAAAAAAADWNvbGxhdF9zZWl6ZWQAAAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAdZ2V0X2N1cnJlbnRfYm9ycm93X2luZGV4X3ZpZXcAAAAAAAABAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    repay: this.txFromJSON<null>,
        borrow: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        deposit_collateral: this.txFromJSON<null>,
        get_pool_state_view: this.txFromJSON<PoolState>,
        withdraw_collateral: this.txFromJSON<null>,
        get_user_position_view: this.txFromJSON<UserPosition>,
        execute_liquidation_burn: this.txFromJSON<null>,
        get_current_borrow_index_view: this.txFromJSON<i128>
  }
}