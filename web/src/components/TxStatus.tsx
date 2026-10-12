"use client";
import { explorerTx } from "@/lib/genlayer";

export type TxPhase = "idle" | "signing" | "submitted" | "finalized" | "error";

export interface TxState {
  phase: TxPhase;
  hash?: string;
  message?: string;
}

/** Human-readable transaction lifecycle line with explorer link. */
export function TxStatus({ tx }: { tx: TxState }) {
  if (tx.phase === "idle") return null;
  const label =
    tx.phase === "signing" ? "Waiting for wallet signature…"
    : tx.phase === "submitted" ? "Submitted — awaiting validator consensus. This can take a few minutes."
    : tx.phase === "finalized" ? "Finalized on StudioNet."
    : "Failed.";
  return (
    <div className="card" role="status" aria-live="polite" style={{ padding: 16, marginTop: 16 }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      {tx.hash && (
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Tx{" "}
          <a href={explorerTx(tx.hash)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)} ↗
          </a>
        </div>
      )}
      {tx.message && <div style={{ fontSize: 13, marginTop: 6, color: tx.phase === "error" ? "var(--danger)" : "var(--ink-muted)" }}>{tx.message}</div>}
    </div>
  );
}
