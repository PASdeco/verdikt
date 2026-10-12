"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { TxStatus, type TxState } from "@/components/TxStatus";
import {
  appealWrite, cancelContestWrite, claimPrizeWrite, closeEntriesWrite,
  finalizeWrite, judgeEntryWrite, resubmitEntryWrite, submitEntryWrite,
} from "@/lib/genlayer";

export interface ContestSummary {
  id: number;
  status: string;
  organizer: string;
  entryCount: number;
  maxEntries: number;
  entryDeadline: number;
}

export interface EntrySummary {
  id: number;
  status: string;
  creator: string;
}

async function creds(w: { address: string | null; provider: EthereumProvider | null; chainOk: boolean; openModal: () => void; switchToStudioNet: () => Promise<void> }) {
  if (!w.address || !w.provider) {
    w.openModal();
    return null;
  }
  if (!w.chainOk) {
    await w.switchToStudioNet();
    return null;
  }
  return { address: w.address, provider: w.provider };
}

export function ContestActions({ contest, entries }: { contest: ContestSummary; entries: EntrySummary[] }) {
  const wallet = useWallet();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [progress, setProgress] = useState<string[]>([]);

  const me = (wallet.address || "").toLowerCase();
  const isOrganizer = me !== "" && me === contest.organizer.toLowerCase();
  const isFull = contest.entryCount >= contest.maxEntries;
  const hasEntered = me !== "" && entries.some((e) => e.creator.toLowerCase() === me);
  const deadlinePassed = Date.now() / 1000 >= contest.entryDeadline;
  const canClose = contest.status === "OPEN" && (deadlinePassed || isFull);

  async function run(label: string, fn: (c: { address: string; provider: EthereumProvider }) => Promise<{ hash: string }>) {
    const c = await creds(wallet);
    if (!c) return;
    setTx({ phase: "signing", message: label });
    try {
      setTx({ phase: "submitted", message: `${label} — awaiting validator consensus. This can take a few minutes.` });
      const receipt = await fn(c);
      setTx({ phase: "finalized", hash: receipt.hash, message: `${label} — executed on StudioNet.` });
      router.refresh();
    } catch (e: unknown) {
      setTx({ phase: "error", message: e instanceof Error ? e.message : `${label} failed.` });
    }
  }

  async function judgeAll() {
    const c = await creds(wallet);
    if (!c) return;
    const pending = entries.filter((e) => e.status === "SUBMITTED");
    if (pending.length === 0) {
      setTx({ phase: "error", message: "Nothing awaiting judging." });
      return;
    }
    setProgress([]);
    for (const e of pending) {
      setProgress((p) => [...p, `Judging entry #${e.id}…`]);
      try {
        const receipt = await judgeEntryWrite(c.provider, c.address, e.id);
        setProgress((p) => [...p.slice(0, -1), `Entry #${e.id} scored ✓ (${receipt.hash.slice(0, 10)}…)`]);
      } catch (err: unknown) {
        setProgress((p) => [...p.slice(0, -1), `Entry #${e.id} failed: ${err instanceof Error ? err.message : "error"}`]);
      }
    }
    router.refresh();
  }

  function organizerHint(action: string) {
    if (!wallet.address) return "Connect the organizer wallet to " + action + ".";
    return `Only the organizer (${contest.organizer.slice(0, 6)}…${contest.organizer.slice(-4)}) can ${action}.`;
  }

  return (
    <div>
      <div className="font-mono2" style={{ fontSize: 12, color: isFull ? "var(--accent-text)" : "var(--ink-muted)", marginTop: 8 }}>
        {contest.entryCount}/{contest.maxEntries} entries{isFull ? " · FULL — no more entries accepted" : ""}
      </div>

      {contest.status === "OPEN" && (
        <>
          {!wallet.address ? (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <button className="btn btn-accent" onClick={wallet.openModal}>Connect wallet to enter</button>
            </div>
          ) : isFull ? (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <strong>Contest is full ({contest.entryCount}/{contest.maxEntries}).</strong>
              <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "6px 0 0" }}>No more entries accepted. {isOrganizer ? "You can close entries to start judging." : "Waiting on the organizer to close entries."}</p>
            </div>
          ) : hasEntered ? (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <strong>You&apos;re in ✓</strong>
              <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "6px 0 0" }}>One entry per wallet — yours is on the board above.</p>
            </div>
          ) : deadlinePassed ? (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <strong>Deadline passed.</strong>
              <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "6px 0 0" }}>Entries are closed. {isOrganizer ? "Close entries to start judging." : "Waiting on the organizer."}</p>
            </div>
          ) : (
            <form className="card" style={{ padding: 16, marginTop: 16 }} onSubmit={(e) => {
              e.preventDefault();
              void run("Submitting entry", (c) => submitEntryWrite(c.provider, c.address, contest.id, url.trim()));
            }}>
              <label style={{ display: "block", fontWeight: 700 }}>
                Submit your entry link
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/my-work"
                  required minLength={10} style={{ display: "block", width: "100%", padding: 12, marginTop: 8 }} />
              </label>
              <button className="btn btn-accent" type="submit" style={{ marginTop: 12 }}>Enter contest</button>
            </form>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {contest.status === "OPEN" && (
          <div>
            <button className="btn btn-ghost" disabled={!isOrganizer || !canClose}
              title={!isOrganizer ? organizerHint("close entries") : !canClose ? "Available after the deadline or when the contest is full." : "Close entries and start judging"}
              onClick={() => void run("Closing entries", (c) => closeEntriesWrite(c.provider, c.address, contest.id))}>
              Close entries
            </button>
            {(!isOrganizer || !canClose) && (
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6, maxWidth: 260 }}>
                {!isOrganizer ? organizerHint("close entries") : "Available after the deadline or when full."}
              </div>
            )}
          </div>
        )}
        {(contest.status === "CLOSED" || contest.status === "JUDGING") && (
          <div>
            <button className="btn btn-accent" disabled={!isOrganizer}
              title={!isOrganizer ? organizerHint("run judging") : "Score every submitted entry"}
              onClick={() => void judgeAll()}>Judge all entries</button>
            {!isOrganizer && (
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6, maxWidth: 260 }}>{organizerHint("run judging")}</div>
            )}
          </div>
        )}
        {contest.status === "SCORED" && (
          <button className="btn btn-accent" onClick={() => void run("Finalizing", (c) => finalizeWrite(c.provider, c.address, contest.id))}>
            Finalize + set winner
          </button>
        )}
        {contest.status === "FINALIZED" && (
          <button className="btn btn-accent" onClick={() => void run("Claiming prize", (c) => claimPrizeWrite(c.provider, c.address, contest.id))}>
            Claim prize
          </button>
        )}
        {(contest.status === "OPEN" || contest.status === "CLOSED") && (
          <div>
            <button className="btn btn-ghost" disabled={!isOrganizer || contest.entryCount > 0}
              title={contest.entryCount > 0 ? "Contests with entries cannot be cancelled — the prize is locked for the winner." : !isOrganizer ? organizerHint("cancel") : "Refund the prize (empty contests only)"}
              onClick={() => void run("Cancelling contest", (c) => cancelContestWrite(c.provider, c.address, contest.id))}>
              Cancel (empty only)
            </button>
            {(!isOrganizer || contest.entryCount > 0) && (
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6, maxWidth: 260 }}>
                {contest.entryCount > 0 ? "Has entries — cannot cancel. Prize stays locked for the winner." : organizerHint("cancel")}
              </div>
            )}
          </div>
        )}
      </div>

      {progress.length > 0 && (
        <div className="card" aria-live="polite" style={{ padding: 16, marginTop: 16 }}>
          <strong>Validators are reviewing entries. This can take a few minutes.</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {progress.map((line, i) => <li key={i} style={{ fontSize: 13 }}>{line}</li>)}
          </ul>
        </div>
      )}
      <TxStatus tx={tx} />
    </div>
  );
}

export function EntryAppeal({ entryId, entryStatus }: { entryId: number; entryStatus: string }) {
  const wallet = useWallet();
  const router = useRouter();
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [newUrl, setNewUrl] = useState("");

  async function appeal() {
    const c = await creds(wallet);
    if (!c) return;
    setTx({ phase: "signing", message: "Appeal bond: 0.1 GEN (refunded if the ruling changes)." });
    try {
      setTx({ phase: "submitted", message: "Appeal submitted — re-scoring under consensus…" });
      const receipt = await appealWrite(c.provider, c.address, entryId, BigInt(10) ** BigInt(17));
      setTx({ phase: "finalized", hash: receipt.hash, message: "Appeal executed on StudioNet." });
      router.refresh();
    } catch (e: unknown) {
      setTx({ phase: "error", message: e instanceof Error ? e.message : "Appeal failed." });
    }
  }

  async function resubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = await creds(wallet);
    if (!c) return;
    setTx({ phase: "signing", message: "Resubmitting fixed link…" });
    try {
      const receipt = await resubmitEntryWrite(c.provider, c.address, entryId, newUrl.trim());
      setTx({ phase: "finalized", hash: receipt.hash, message: "Resubmitted — awaiting judging." });
      router.refresh();
    } catch (err: unknown) {
      setTx({ phase: "error", message: err instanceof Error ? err.message : "Resubmission failed." });
    }
  }

  return (
    <div>
      {entryStatus === "UNSCORABLE" && (
        <form className="card" style={{ padding: 16, marginTop: 16 }} onSubmit={(e) => void resubmit(e)}>
          <label style={{ display: "block", fontWeight: 700 }}>
            This link was unscorable — paste one working replacement (one-time window)
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/fixed"
              required minLength={10} style={{ display: "block", width: "100%", padding: 12, marginTop: 8 }} />
          </label>
          <button className="btn btn-accent" type="submit" style={{ marginTop: 12 }}>Resubmit link</button>
        </form>
      )}
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <strong>Appeal this ruling</strong>
        <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>0.1 GEN bond · refunded if the ruling changes, forfeited otherwise. Creator or organizer, within 3 days of finalization.</p>
        <button className="btn btn-ghost" onClick={() => void appeal()}>Appeal with 0.1 GEN bond</button>
      </div>
      <TxStatus tx={tx} />
    </div>
  );
}
