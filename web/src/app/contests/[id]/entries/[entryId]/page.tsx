import { fetchContest, fetchEntries } from "@/lib/genlayer";
import { EntryAppeal } from "@/components/ContestActions";

export default async function EntryDetail({ params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await params;
  const contest = await fetchContest(Number(id));
  const entries = await fetchEntries(Number(id));
  const entry = entries.find((e) => e.id === Number(entryId));
  if (!entry) return <div style={{ padding: 48 }}>Entry not found.</div>;
  const byId: Record<string, { name: string; weight: number }> = {};
  for (const c of contest.criteria) byId[c.id] = c;
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 96px" }}>
      <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)" }}>ENTRY #{entry.id} · {entry.status} · CONTEST #{contest.id}</div>
      <h1 className="font-display" style={{ fontSize: 44 }}>Entry #{entry.id}</h1>
      <a href={entry.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Open submitted link ↗</a>
      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {Object.entries(entry.scores).map(([cid, score]) => (
          <div key={cid} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{byId[cid]?.name || cid} (weight {byId[cid]?.weight})</strong>
              <span className="font-mono2">{score}/10</span>
            </div>
            <p style={{ color: "var(--ink-muted)", margin: "8px 0 0" }}>{entry.reasons[cid]}</p>
          </div>
        ))}
        {Object.keys(entry.scores).length === 0 && (
          <p style={{ color: "var(--ink-muted)" }}>Not scored yet — run judging from the contest page.</p>
        )}
      </div>
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <strong>Validator consensus panel</strong>
        <p style={{ color: "var(--ink-muted)" }}>Scores within ±1 per criterion and matching accessibility = agreement. Reasons are published but need not match word-for-word.</p>
      </div>
      <EntryAppeal entryId={entry.id} entryStatus={entry.status} />
    </div>
  );
}
