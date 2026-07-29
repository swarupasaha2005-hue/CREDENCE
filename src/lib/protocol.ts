import { CredenceProtocol } from "../../packages/sdk/src";
import deployments from "../../registry/deployments.json";

const NETWORK = "testnet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const protocol = new CredenceProtocol(NETWORK, (deployments as Record<string, any>)[NETWORK]);
