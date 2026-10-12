/**
 * Deploys VerdiktContest to the configured GenLayer network.
 * Run: node scripts/deploy-contracts.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient } from "genlayer-js";
import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";

const chainMap = { localnet, studionet, testnetAsimov, testnetBradbury };
// Resolve repo root from this file so the script runs from anywhere
// (e.g. web/, where genlayer-js is installed).
// This copy lives under web/ (so genlayer-js resolves); repo root is one up.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
process.loadEnvFile(join(ROOT, ".env"));

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

const chainName = process.env.GENLAYER_NETWORK || "studionet";
const chain = chainMap[chainName] ?? studionet;
const account = createAccount(requireEnv("BACKEND_PRIVATE_KEY"));
const client = createClient({ chain, account });

console.log(`network: ${chainName}`);
console.log(`deployer: ${account.address}`);

const code = readFileSync(join(ROOT, "contracts/verdikt_contest.py"), "utf8");
console.log("\ndeploying VerdiktContest…");
const txHash = await client.deployContract({ code });
const result = await client.waitForTransactionReceipt({
  hash: txHash, status: "ACCEPTED", interval: 3_000, retries: 100, fullTransaction: true,
});
const address = result?.contract_address ?? result?.contractAddress ?? result?.data?.contract_address ?? result?.data?.contractAddress ?? result?.address;
console.log(`VerdiktContest: tx=${txHash} address=${address} status=${result?.statusName ?? result?.status}`);
if (!address) {
  console.error("full result:", JSON.stringify(result, null, 2).slice(0, 2000));
  throw new Error("deploy returned no address");
}
console.log("\n=== ADD TO .env ===");
console.log(`VERDIKT_CONTRACT_ADDRESS=${address}`);
console.log(`NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS=${address}`);
