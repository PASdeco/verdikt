import { fetchContests } from "@/lib/genlayer";
import Link from "next/link";

export default async function ContestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (sp.status || "ALL").toUpperCase();
  const contests = await fetchContests(status === "ALL" ? "ALL" : status);
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 56, margin: "0 0 8px" }}>Live contests</h1>
      <p style={{ color: "var(--ink-muted)", margin: "0 0 24px" }}>Prototype on GenLayer StudioNet. No real funds.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }} role="group" aria-label="Status filter">
        {["ALL", "OPEN", "CLOSED", "JUDGING", "SCORED", "FINALIZED", "PAID"].map((s) => (
          <Link key={s} href={s === "ALL" ? "/contests" : `/contests?status=${s}`} className="btn btn-ghost" aria-current={status === s ? "true" : undefined} style={status === s ? { borderColor: "var(--accent)" } : undefined}>{s}</Link>
        ))}
      </div>
      {contests.length === 0 ? (
        <p className="card" style={{ padding: 32 }}>No contests found. Be the first to launch one.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {contests.map((c) => (
            <Link key={c.id} href={`/contests/${c.id}`} className="card" style={{ padding: 24, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)" }}>{c.status} · {(c.prize_wei / 1e18).toFixed(1)} GEN prize (demo)</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{c.title}</div>
                <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>{c.entry_count} entries · closes {new Date(c.entry_deadline * 1000).toLocaleString()}</div>
              </div>
              <span className="btn btn-ghost">Open →</span>
            </Link>
          ))}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <Link href="/contests/new" className="btn btn-accent">Launch a contest</Link>
      </div>
    </div>
  );
}
