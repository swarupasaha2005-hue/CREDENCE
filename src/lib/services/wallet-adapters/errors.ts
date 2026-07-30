export class WalletServiceError extends Error {
  code: "NOT_INSTALLED" | "REJECTED" | "WRONG_NETWORK" | "TIMEOUT" | "UNKNOWN";

  constructor(code: WalletServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "WalletServiceError";
  }
}
