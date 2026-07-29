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
    contractId: "CBQDUJ5NW6CIIXDDY4OEQAVTQ3B5AXV6XNTM7DV6HI3U3YUS6X34KW54",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "ConfigAddress", values: void};


export interface UserPosition {
  collateral_amount: i128;
  last_interaction: u64;
  scaled_debt: i128;
}

export interface Client {
  /**
   * Construct and simulate a liquidate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Primary entrypoint for a liquidator to liquidate an unhealthy position.
   * Liquidator must have already authorized the token transfer of `debt_to_cover` to the pool.
   */
  liquidate: ({liquidator, borrower, debt_asset, collat_asset, debt_to_cover}: {liquidator: string, borrower: string, debt_asset: string, collat_asset: string, debt_to_cover: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the Liquidation Engine.
   */
  initialize: ({admin, config_address}: {admin: string, config_address: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAAAAAAAKJQcmltYXJ5IGVudHJ5cG9pbnQgZm9yIGEgbGlxdWlkYXRvciB0byBsaXF1aWRhdGUgYW4gdW5oZWFsdGh5IHBvc2l0aW9uLgpMaXF1aWRhdG9yIG11c3QgaGF2ZSBhbHJlYWR5IGF1dGhvcml6ZWQgdGhlIHRva2VuIHRyYW5zZmVyIG9mIGBkZWJ0X3RvX2NvdmVyYCB0byB0aGUgcG9vbC4AAAAAAAlsaXF1aWRhdGUAAAAAAAAFAAAAAAAAAApsaXF1aWRhdG9yAAAAAAATAAAAAAAAAAhib3Jyb3dlcgAAABMAAAAAAAAACmRlYnRfYXNzZXQAAAAAABMAAAAAAAAADGNvbGxhdF9hc3NldAAAABMAAAAAAAAADWRlYnRfdG9fY292ZXIAAAAAAAALAAAAAA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAANQ29uZmlnQWRkcmVzcwAAAA==",
        "AAAAAAAAACNJbml0aWFsaXplcyB0aGUgTGlxdWlkYXRpb24gRW5naW5lLgAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAA5jb25maWdfYWRkcmVzcwAAAAAAEwAAAAA=",
        "AAAAAQAAAAAAAAAAAAAADFVzZXJQb3NpdGlvbgAAAAMAAAAAAAAAEWNvbGxhdGVyYWxfYW1vdW50AAAAAAAACwAAAAAAAAAQbGFzdF9pbnRlcmFjdGlvbgAAAAYAAAAAAAAAC3NjYWxlZF9kZWJ0AAAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    liquidate: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>
  }
}