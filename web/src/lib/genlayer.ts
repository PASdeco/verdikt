/**
 * Single genlayer access module. Components never call genlayer-js directly.
 *
 * Reads work without a wallet. Writes use the connected EVM wallet
 * (Rabby / Zerion / MetaMask via EIP-6963) through the 1.1.8 client shape:
 *   createClient({ chain, account: address, provider })
 *   writeContract({ address, functionName, args, value? })
 *   waitForTransactionReceipt({ hash, status: ACCEPTED })
 * Read the revert reason on FINISHED_WITH_ERROR so the UI can show it.
 */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { Hash } from "genlayer-js/types";
import type { Contest, Entry } from "./mock";
import { mockContests, mockEntries } from "./mock";

const CONTRACT = (process.env.NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS || "") as `0x${string}`;
const MOCK = !CONTRACT;

function readOnlyClient() {
  return createClient({ chain: studionet });
}

function writeClient(provider: EthereumProvider, address: string) {
  return createClient({
    chain: studionet,
    account: address as `0x${string}`,
    provider,
  });
}

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  if (MOCK) throw new Error("Contract not configured (MOCK_MODE).");
  const client = readOnlyClient();
  return (await client.readContract({ address: CONTRACT, functionName, args })) as unknown as T;
}

export interface WriteReceipt {
  hash: string;
  execution: string;
}

function receiptError(receipt: any): string {
  const reason = String(receipt?.revert_reason || receipt?.revertReason || "");
  if (reason) {
    const m = reason.match(/\[EXPECTED\](.*)/);
    return (m ? m[1] : reason).trim().slice(0, 300);
  }
  return `Transaction executed with error (${String(receipt?.txExecutionResultName || "unknown")}).`;
}

function executionFailed(name: string): boolean {
  const n = name.toUpperCase();
  if (!n) return false;
  return n.includes("ERROR") || n.includes("REVERT") || n.includes("FAIL") || n.includes("UNDETERMINED");
}

/** Submit a write with the connected wallet and wait until execution settles.
 * Never reports success from acceptance alone: polls the transaction until
 * the execution result is populated, then enforces it. Revert reasons from
 * the contract ([EXPECTED]…) are surfaced so the app — not just the
 * explorer — tells the user why a call failed. */
export async function submitWrite(
  provider: EthereumProvider,
  from: string,
  functionName: string,
  args: any[] = [],
  value?: bigint,
): Promise<WriteReceipt> {
  if (MOCK) throw new Error("Set NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS to go live.");
  const client = writeClient(provider, from);
  const txHash = (await client.writeContract({
    address: CONTRACT,
    functionName,
    args,
    value: value ?? BigInt(0),
  })) as unknown as string;
  const receipt = (await client.waitForTransactionReceipt({
    hash: txHash as unknown as Hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3_000,
    retries: 200,
  })) as unknown as any;
  let execution = String(receipt?.txExecutionResultName || "");
  // Acceptance is not execution: poll until the execution result settles.
  if (!execution) {
    const reader = readOnlyClient();
    for (let i = 0; i < 40 && !execution; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const tx = (await reader.getTransaction({ hash: txHash as unknown as Hash })) as unknown as any;
        execution = String(tx?.txExecutionResultName || tx?.tx_execution_result_name || "");
      } catch {
        // Keep polling; the node may not serve the tx yet.
      }
    }
  }
  if (!execution) {
    throw new Error(
      "Accepted by consensus but execution hasn't settled yet — check the explorer link, then refresh.",
    );
  }
  if (executionFailed(execution)) {
    throw new Error(receiptError({ ...receipt, txExecutionResultName: execution }));
  }
  return { hash: String(txHash), execution };
}

export interface CreateContestInput {
  title: string;
  description: string;
  criteria: { id: string; name: string; description: string; weight: number }[];
  entryDeadline: number;
  maxEntries: number;
  prizeWei: bigint;
}

export async function createContestWrite(
  provider: EthereumProvider, from: string, input: CreateContestInput,
): Promise<WriteReceipt> {
  return submitWrite(provider, from, "create_contest",
    [input.title, input.description, JSON.stringify(input.criteria), input.entryDeadline, input.maxEntries],
    input.prizeWei);
}

export async function submitEntryWrite(provider: EthereumProvider, from: string, contestId: number, url: string) {
  return submitWrite(provider, from, "submit_entry", [contestId, url]);
}

export async function closeEntriesWrite(provider: EthereumProvider, from: string, contestId: number) {
  return submitWrite(provider, from, "close_entries", [contestId]);
}

export async function judgeEntryWrite(provider: EthereumProvider, from: string, entryId: number) {
  return submitWrite(provider, from, "judge_entry", [entryId]);
}

export async function resubmitEntryWrite(provider: EthereumProvider, from: string, entryId: number, url: string) {
  return submitWrite(provider, from, "resubmit_entry", [entryId, url]);
}

export async function finalizeWrite(provider: EthereumProvider, from: string, contestId: number) {
  return submitWrite(provider, from, "finalize", [contestId]);
}

export async function appealWrite(provider: EthereumProvider, from: string, entryId: number, bondWei: bigint) {
  return submitWrite(provider, from, "appeal", [entryId], bondWei);
}

export async function claimPrizeWrite(provider: EthereumProvider, from: string, contestId: number) {
  return submitWrite(provider, from, "claim_prize", [contestId]);
}

export async function cancelContestWrite(provider: EthereumProvider, from: string, contestId: number) {
  return submitWrite(provider, from, "cancel_contest", [contestId]);
}

/** "0.5" GEN -> 500000000000000000n. Throws on bad input. */
export function genToWei(input: string): bigint {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) throw new Error("Enter a GEN amount like 1 or 0.5.");
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * BigInt(10) ** BigInt(18) + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

export async function fetchFeatured(): Promise<{ contest: Contest; entries: Entry[] }> {
  if (MOCK) {
    const contest = mockContests[0];
    const entries = [...mockEntries].sort((a, b) => b.total_x100 - a.total_x100);
    return { contest, entries };
  }
  const listed = (await read<{ contests: Contest[] }>("list_contests", ["ALL", 0, 1])).contests;
  if (!listed.length) throw new Error("No contests on-chain yet. Launch the first one.");
  const contest = listed[0];
  const { entries } = await read<{ entries: Entry[] }>("get_entries", [contest.id]);
  return { contest, entries: [...entries].sort((a, b) => b.total_x100 - a.total_x100) };
}

export async function fetchContests(status = "ALL"): Promise<Contest[]> {
  if (MOCK) return mockContests;
  const out = await read<{ contests: Contest[] }>("list_contests", [status, 0, 20]);
  return out.contests;
}

export async function fetchContest(id: number): Promise<Contest> {
  if (MOCK) return mockContests[0];
  return read<Contest>("get_contest", [id]);
}

export async function fetchEntries(contestId: number): Promise<Entry[]> {
  if (MOCK) return mockEntries.filter((e) => e.contest_id === contestId);
  const out = await read<{ entries: Entry[] }>("get_entries", [contestId]);
  return out.entries;
}

export async function fetchNewestContestId(): Promise<number> {
  const out = await read<{ contests: Contest[] }>("list_contests", ["ALL", 0, 1]);
  if (!out.contests.length) throw new Error("Contest not found after submission.");
  return out.contests[0].id;
}

export function isMockMode() { return MOCK; }
export function contractAddress() { return CONTRACT || null; }
export function explorerTx(hash: string) {
  const base = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER || "https://explorer-studio.genlayer.com";
  return `${base}/tx/${hash}`;
}
