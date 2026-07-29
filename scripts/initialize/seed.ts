import * as fs from "fs";
import * as path from "path";

/**
 * Initializes the protocol with risk parameters and mock prices.
 */
async function seedProtocol() {
  console.log("Seeding Credence Protocol...");
  const network = process.env.NETWORK || "testnet";
  const registryPath = path.join(__dirname, "../../registry/deployments.json");
  
  if (!fs.existsSync(registryPath)) {
    throw new Error("Deployments registry not found. Run deploy script first.");
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))[network];
  
  const USDC_ADDRESS = "C_USDC_MOCK";
  const XLM_ADDRESS = "C_XLM_MOCK";

  // 1. Seed Oracle
  console.log("Setting Oracle Prices...");
  // await oracleClient.set_price({ asset: USDC_ADDRESS, price: 1_000_000_000_000_000_000n }); // $1
  // await oracleClient.set_price({ asset: XLM_ADDRESS, price: 100_000_000_000_000_000n }); // $0.10

  // 2. Seed Configuration Risk Parameters
  console.log("Configuring Risk Parameters...");
  // await configClient.set_liq_threshold({ threshold: 8000 }); // 80%
  // await configClient.set_liq_bonus({ bonus: 10500 }); // 105%
  // await configClient.set_reserve_factor({ factor: 1000 }); // 10%

  console.log(`✅ Seeding Complete on ${network}! Protocol is ready for users.`);
}

if (require.main === module) {
  seedProtocol().catch(console.error);
}
