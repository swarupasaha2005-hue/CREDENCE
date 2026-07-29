import { CredenceProtocol } from "../../packages/sdk/src";
import deployments from "../../registry/deployments.json";

const NETWORK = "testnet";

export const protocol = new CredenceProtocol(
  NETWORK,
  (deployments as Record<string, Record<string, string>>)[NETWORK]
);
