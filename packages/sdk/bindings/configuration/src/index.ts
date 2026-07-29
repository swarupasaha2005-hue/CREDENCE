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
    contractId: "CC3P2CRXZP4EQXKQ2RTU3ZKD4SKE6LG5PW26TJC6ZMMFOIQ7WUO3S3FK",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "LTV", values: void} | {tag: "LiqThreshold", values: void} | {tag: "LiqBonus", values: void} | {tag: "ReserveFactor", values: void} | {tag: "BaseBorrowRate", values: void} | {tag: "OptUtilization", values: void} | {tag: "Slope1", values: void} | {tag: "Slope2", values: void} | {tag: "Treasury", values: void} | {tag: "Oracle", values: void} | {tag: "LendingPool", values: void} | {tag: "InterestModel", values: void};

export interface Client {
  /**
   * Construct and simulate a get_ltv transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_ltv: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_ltv transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_ltv: ({ltv}: {ltv: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_oracle: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_slope1 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_slope1: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_slope2 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_slope2: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the configuration contract. Can only be called once.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_oracle: ({oracle}: {oracle: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_slope1 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_slope1: ({slope}: {slope: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_slope2 transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_slope2: ({slope}: {slope: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_treasury: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_treasury: ({treasury}: {treasury: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_liq_bonus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_liq_bonus: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a transfer_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_lending_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_lending_pool: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_lending_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_lending_pool: ({pool}: {pool: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_liq_threshold transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_liq_threshold: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_interest_model transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_interest_model: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_reserve_factor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_reserve_factor: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_interest_model transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_interest_model: ({model}: {model: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_reserve_factor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_reserve_factor: ({factor}: {factor: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_base_borrow_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_base_borrow_rate: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_base_borrow_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_base_borrow_rate: ({rate}: {rate: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_liquidation_bonus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_liquidation_bonus: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_liquidation_bonus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_liquidation_bonus: ({bonus}: {bonus: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_optimal_utilization transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_optimal_utilization: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_optimal_utilization transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_optimal_utilization: ({utilization}: {utilization: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_liquidation_threshold transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_liquidation_threshold: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_liquidation_threshold transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_liquidation_threshold: ({threshold}: {threshold: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
      new ContractSpec([ "AAAAAAAAAAAAAAAHZ2V0X2x0dgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAHc2V0X2x0dgAAAAABAAAAAAAAAANsdHYAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAADTFRWAAAAAAAAAAAAAAAADExpcVRocmVzaG9sZAAAAAAAAAAAAAAACExpcUJvbnVzAAAAAAAAAAAAAAANUmVzZXJ2ZUZhY3RvcgAAAAAAAAAAAAAAAAAADkJhc2VCb3Jyb3dSYXRlAAAAAAAAAAAAAAAAAA5PcHRVdGlsaXphdGlvbgAAAAAAAAAAAAAAAAAGU2xvcGUxAAAAAAAAAAAAAAAAAAZTbG9wZTIAAAAAAAAAAAAAAAAACFRyZWFzdXJ5AAAAAAAAAAAAAAAGT3JhY2xlAAAAAAAAAAAAAAAAAAtMZW5kaW5nUG9vbAAAAAAAAAAAAAAAAA1JbnRlcmVzdE1vZGVsAAAA",
        "AAAAAAAAAAAAAAAKZ2V0X29yYWNsZQAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAKZ2V0X3Nsb3BlMQAAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAAAAAAAKZ2V0X3Nsb3BlMgAAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAEBJbml0aWFsaXplcyB0aGUgY29uZmlndXJhdGlvbiBjb250cmFjdC4gQ2FuIG9ubHkgYmUgY2FsbGVkIG9uY2UuAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAKc2V0X29yYWNsZQAAAAAAAQAAAAAAAAAGb3JhY2xlAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAKc2V0X3Nsb3BlMQAAAAAAAQAAAAAAAAAFc2xvcGUAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAKc2V0X3Nsb3BlMgAAAAAAAQAAAAAAAAAFc2xvcGUAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAMZ2V0X3RyZWFzdXJ5AAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAMc2V0X3RyZWFzdXJ5AAAAAQAAAAAAAAAIdHJlYXN1cnkAAAATAAAAAA==",
        "AAAAAAAAAAAAAAANZ2V0X2xpcV9ib251cwAAAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAAOdHJhbnNmZXJfYWRtaW4AAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAQZ2V0X2xlbmRpbmdfcG9vbAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAAAAAAAQc2V0X2xlbmRpbmdfcG9vbAAAAAEAAAAAAAAABHBvb2wAAAATAAAAAA==",
        "AAAAAAAAAAAAAAARZ2V0X2xpcV90aHJlc2hvbGQAAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAASZ2V0X2ludGVyZXN0X21vZGVsAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAASZ2V0X3Jlc2VydmVfZmFjdG9yAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAASc2V0X2ludGVyZXN0X21vZGVsAAAAAAABAAAAAAAAAAVtb2RlbAAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAASc2V0X3Jlc2VydmVfZmFjdG9yAAAAAAABAAAAAAAAAAZmYWN0b3IAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAUZ2V0X2Jhc2VfYm9ycm93X3JhdGUAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAUc2V0X2Jhc2VfYm9ycm93X3JhdGUAAAABAAAAAAAAAARyYXRlAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAVZ2V0X2xpcXVpZGF0aW9uX2JvbnVzAAAAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAAAAAAAVc2V0X2xpcXVpZGF0aW9uX2JvbnVzAAAAAAAAAQAAAAAAAAAFYm9udXMAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAXZ2V0X29wdGltYWxfdXRpbGl6YXRpb24AAAAAAAAAAAEAAAAE",
        "AAAAAAAAAAAAAAAXc2V0X29wdGltYWxfdXRpbGl6YXRpb24AAAAAAQAAAAAAAAALdXRpbGl6YXRpb24AAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAZZ2V0X2xpcXVpZGF0aW9uX3RocmVzaG9sZAAAAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAAZc2V0X2xpcXVpZGF0aW9uX3RocmVzaG9sZAAAAAAAAAEAAAAAAAAACXRocmVzaG9sZAAAAAAAAAQAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_ltv: this.txFromJSON<u32>,
        set_ltv: this.txFromJSON<null>,
        get_admin: this.txFromJSON<string>,
        get_oracle: this.txFromJSON<string>,
        get_slope1: this.txFromJSON<u32>,
        get_slope2: this.txFromJSON<u32>,
        initialize: this.txFromJSON<null>,
        set_oracle: this.txFromJSON<null>,
        set_slope1: this.txFromJSON<null>,
        set_slope2: this.txFromJSON<null>,
        get_treasury: this.txFromJSON<string>,
        set_treasury: this.txFromJSON<null>,
        get_liq_bonus: this.txFromJSON<u32>,
        transfer_admin: this.txFromJSON<null>,
        get_lending_pool: this.txFromJSON<string>,
        set_lending_pool: this.txFromJSON<null>,
        get_liq_threshold: this.txFromJSON<u32>,
        get_interest_model: this.txFromJSON<string>,
        get_reserve_factor: this.txFromJSON<u32>,
        set_interest_model: this.txFromJSON<null>,
        set_reserve_factor: this.txFromJSON<null>,
        get_base_borrow_rate: this.txFromJSON<u32>,
        set_base_borrow_rate: this.txFromJSON<null>,
        get_liquidation_bonus: this.txFromJSON<u32>,
        set_liquidation_bonus: this.txFromJSON<null>,
        get_optimal_utilization: this.txFromJSON<u32>,
        set_optimal_utilization: this.txFromJSON<null>,
        get_liquidation_threshold: this.txFromJSON<u32>,
        set_liquidation_threshold: this.txFromJSON<null>
  }
}