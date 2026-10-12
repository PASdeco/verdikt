import { fetchContests } from "@/lib/genlayer";

export default async function Dashboard() {
  const contests = await fetchContests("ALL");
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 52 }}>Dashboard</h1>
      <p style={{ color: "var(--ink-muted)" }}>Connect a wallet to see your contests and entries. Showing mock data until the contract is configured.</p>
      <h2>My contests</h2>
      {contests.map((c) => <div key={c.id} className="card" style={{ padding: 16, marginBottom: 12 }}><strong>{c.title}</strong> · {c.status} · next: {c.status === "OPEN" ? "wait for entries" : c.status === "SCORED" ? "finalize" : c.status === "FINALIZED" ? "wait out appeal window, then claim" : "done"}</div>)}
      <h2>My entries</h2>
      <p style={{ color: "var(--ink-muted)" }}>Entries you submit will appear here with per-criterion scores.</p>
    </div>
  );
}
