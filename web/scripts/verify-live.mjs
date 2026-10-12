/**
 * Verifies the deployed VerdiktContest contract on StudioNet.
 * Reads VERDIKT_CONTRACT_ADDRESS from the root .env, then calls
 * get_stats + list_contests via plain reads (no wallet needed).
 *
 * Run from Verdikt/: node scripts/verify-live.mjs
 */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

process.loadEnvFile("../.env");

const address = (process.env.VERDIKT_CONTRACT_ADDRESS || "").trim();
if (!address || !address.startsWith("0x") || address.length !== 42) {
  console.error("VERDIKT_CONTRACT_ADDRESS is missing or malformed in root .env.");
  console.error("Paste the deployed 0x address, then re-run.");
  process.exit(1);
}

const client = createClient({ chain: studionet });
console.log(`contract: ${address}`);
console.log(`rpc: https://studio.genlayer.com/api`);

try {
  const stats = await client.readContract({ address, functionName: "get_stats", args: [] });
  console.log("get_stats:", JSON.stringify(stats));
} catch (e) {
  console.error("get_stats FAILED:", e?.message || e);
  process.exit(1);
}

try {
  const listed = await client.readContract({ address, functionName: "list_contests", args: ["ALL", 0, 5] });
  const contests = listed?.contests ?? [];
  console.log(`list_contests: ${contests.length} shown (total: ${listed?.total})`);
  for (const c of contests) {
    console.log(`  #${c.id} [${c.status}] "${c.title}" entries=${c.entry_count} scored=${c.scored_count}`);
  }
} catch (e) {
  console.error("list_contests FAILED:", e?.message || e);
  process.exit(1);
}

console.log("\nLIVE CHECK PASSED — contract responds on StudioNet.");
