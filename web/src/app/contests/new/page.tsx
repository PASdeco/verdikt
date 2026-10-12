"use client";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { TxStatus, type TxState } from "@/components/TxStatus";
import { createContestWrite, fetchNewestContestId, genToWei, isMockMode } from "@/lib/genlayer";

const PRESETS: Record<string, { name: string; description: string; weight: number }[]> = {
  Design: [
    { name: "Craft", description: "Execution quality", weight: 40 },
    { name: "Originality", description: "Fresh ideas", weight: 35 },
    { name: "Clarity", description: "Clear communication", weight: 25 },
  ],
  Hackathon: [
    { name: "Functionality", description: "It works end to end", weight: 40 },
    { name: "Innovation", description: "Novel approach", weight: 30 },
    { name: "Presentation", description: "Demo clarity", weight: 30 },
  ],
  Writing: [
    { name: "Insight", description: "Depth of thought", weight: 40 },
    { name: "Style", description: "Voice and craft", weight: 30 },
    { name: "Structure", description: "Organization", weight: 30 },
  ],
};

export default function NewContestPage() {
  const { address, provider, chainOk, openModal, switchToStudioNet } = useWallet();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState(PRESETS.Design);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [maxEntries, setMaxEntries] = useState(20);
  const [prize, setPrize] = useState("1");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [newId, setNewId] = useState<number | null>(null);
  const total = criteria.reduce((s, c) => s + Number(c.weight || 0), 0);

  async function launch() {
    if (!address || !provider) {
      openModal();
      return;
    }
    if (!chainOk) {
      await switchToStudioNet();
      return;
    }
    setTx({ phase: "signing" });
    try {
      const prizeWei = genToWei(prize);
      const withIds = criteria.map((c, i) => ({
        id: `c${i + 1}`,
        name: c.name.trim(),
        description: c.description.trim(),
        weight: Number(c.weight),
      }));
      const deadline = Math.floor(Date.now() / 1000) + deadlineDays * 24 * 3600;
      setTx({ phase: "submitted", message: "Signature received — validators are reaching consensus…" });
      const receipt = await createContestWrite(provider, address, {
        title: title.trim(), description: description.trim(),
        criteria: withIds, entryDeadline: deadline, maxEntries, prizeWei,
      });
      setTx({ phase: "submitted", hash: receipt.hash, message: "Consensus accepted — reading it back…" });
      const id = await fetchNewestContestId();
      setNewId(id);
      setTx({ phase: "finalized", hash: receipt.hash, message: `Contest #${id} is live.` });
    } catch (e: unknown) {
      setTx({ phase: "error", hash: tx.hash, message: e instanceof Error ? e.message : "Launch failed." });
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 52, margin: "0 0 8px" }}>Launch a contest</h1>
      <p style={{ color: "var(--ink-muted)" }}>Step {step + 1} of 4 · StudioNet prototype, no real funds.</p>
      {isMockMode() && (
        <p className="card" role="note" style={{ padding: 12, marginTop: 12, fontSize: 13 }}>
          MOCK_MODE is on (no contract address). Paste NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS in web/.env.local and restart dev to launch on-chain.
        </p>
      )}
      <ol className="font-mono2" style={{ display: "flex", gap: 12, fontSize: 12, padding: 0, listStyle: "none", margin: "24px 0" }}>
        {["Basics", "Rubric", "Rules", "Review"].map((s, i) => (
          <li key={s} style={{ color: i === step ? "var(--accent-text)" : "var(--ink-muted)", fontWeight: i === step ? 800 : 500 }}>{i + 1}. {s}</li>
        ))}
      </ol>

      {step === 0 && (
        <div style={{ display: "grid", gap: 16 }}>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={120} required placeholder="Best launch page" style={{ display: "block", width: "100%", padding: 12, marginTop: 6 }} /></label>
          <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="What should entries do?" style={{ display: "block", width: "100%", padding: 12, marginTop: 6 }} /></label>
        </div>
      )}
      {step === 1 && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.keys(PRESETS).map((p) => (
              <button key={p} type="button" className="btn btn-ghost" onClick={() => setCriteria(PRESETS[p])}>{p}</button>
            ))}
          </div>
          {criteria.map((c, i) => (
            <div key={i} className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <label>Name<input value={c.name} onChange={(e) => { const n = [...criteria]; n[i] = { ...n[i], name: e.target.value }; setCriteria(n); }} style={{ padding: 8, width: "100%" }} /></label>
              <label>Description<input value={c.description} onChange={(e) => { const n = [...criteria]; n[i] = { ...n[i], description: e.target.value }; setCriteria(n); }} style={{ padding: 8, width: "100%" }} /></label>
              <label>Weight (1–100)<input type="number" min={1} max={100} value={c.weight} onChange={(e) => { const n = [...criteria]; n[i] = { ...n[i], weight: Number(e.target.value) }; setCriteria(n); }} style={{ padding: 8, width: "100%" }} /></label>
              <button type="button" className="btn btn-ghost" onClick={() => setCriteria(criteria.filter((_, k) => k !== i))}>Remove</button>
            </div>
          ))}
          <p aria-live="polite" style={{ color: total === 100 ? "var(--accent-text)" : "var(--danger)", fontWeight: 700 }}>Weights total: {total} / 100 {total === 100 ? "✓" : "— must total 100"}</p>
          {criteria.length < 5 && <button type="button" className="btn btn-ghost" onClick={() => setCriteria([...criteria, { name: "New criterion", description: "", weight: 10 }])}>Add criterion</button>}
        </div>
      )}
      {step === 2 && (
        <div style={{ display: "grid", gap: 16 }}>
          <label>Deadline (days from now)<input type="number" min={1} max={90} value={deadlineDays} onChange={(e) => setDeadlineDays(Number(e.target.value))} style={{ padding: 8, width: "100%" }} /></label>
          <label>Max entries (2–100)<input type="number" min={2} max={100} value={maxEntries} onChange={(e) => setMaxEntries(Number(e.target.value))} style={{ padding: 8, width: "100%" }} /></label>
          <label>Prize in GEN (demo funds)<input value={prize} onChange={(e) => setPrize(e.target.value)} inputMode="decimal" style={{ padding: 8, width: "100%" }} /></label>
        </div>
      )}
      {step === 3 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{title || "(untitled)"}</h2>
          <p style={{ color: "var(--ink-muted)" }}>{description}</p>
          <ul>{criteria.map((c) => <li key={c.name}>{c.name} — {c.weight}</li>)}</ul>
          <p>Total weights: {total} / 100</p>
          <p>Deadline in {deadlineDays} days · Max {maxEntries} · Prize {prize} GEN (demo, StudioNet only)</p>
          {!address ? (
            <button className="btn btn-accent btn-hero" onClick={openModal}>Connect wallet to launch</button>
          ) : !chainOk ? (
            <button className="btn btn-accent btn-hero" onClick={() => void switchToStudioNet()}>Switch to StudioNet</button>
          ) : newId !== null ? (
            <Link href={`/contests/${newId}`} className="btn btn-accent btn-hero">Open contest #{newId} →</Link>
          ) : (
            <button className="btn btn-accent btn-hero" onClick={() => void launch()} disabled={tx.phase === "signing" || tx.phase === "submitted"}>
              {tx.phase === "signing" || tx.phase === "submitted" ? "Launching…" : "Sign and lock prize"}
            </button>
          )}
          <TxStatus tx={tx} />
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 && (
          <button className="btn btn-accent" onClick={() => setStep(step + 1)}
            disabled={(step === 0 && title.trim().length < 3) || (step === 1 && total !== 100)}>Continue</button>
        )}
      </div>
    </div>
  );
}
