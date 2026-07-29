import { CredenceProtocol } from "../../packages/sdk/src";
// In a real Jest environment, we would use testing accounts and local Soroban sandbox

describe("Credence Protocol End-to-End", () => {
  let credence: CredenceProtocol;
  const admin = "GD...ADMIN";
  const userA = "GD...USERA";
  const userB = "GD...USERB";
  const USDC = "C_USDC";
  const XLM = "C_XLM";

  beforeAll(async () => {
    // Load mock registry
    const registry = require("../../registry/deployments.json")["testnet"];
    credence = new CredenceProtocol("testnet", registry);
  });

  test("User A deposits collateral", async () => {
    const tx = await credence.depositCollateral(XLM, 1000n, userA);
    expect(tx).toBeDefined();

    const pos = await credence.getUserPosition(userA, XLM);
    expect(pos.collateral_amount).toBeGreaterThan(0n);
  });

  test("User B deposits USDC liquidity", async () => {
    const tx = await credence.depositCollateral(USDC, 5000n, userB);
    expect(tx).toBeDefined();
  });

  test("User A borrows USDC against XLM", async () => {
    const tx = await credence.borrow(USDC, 500n, userA);
    expect(tx).toBeDefined();

    const pos = await credence.getUserPosition(userA, USDC);
    expect(pos.scaled_debt).toBeGreaterThan(0n);
  });

  test("User A repays USDC loan", async () => {
    const tx = await credence.repay(USDC, 250n, userA);
    expect(tx).toBeDefined();
  });
});
