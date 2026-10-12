import { fetchContest, fetchEntries } from "@/lib/genlayer";
import { ContestActions } from "@/components/ContestActions";
import Link from "next/link";

export default async function ContestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);
  const contest = await fetchContest(contestId);
  const entries = (await fetchEntries(contestId)).sort((a, b) => b.total_x100 - a.total_x100);
  const winner = entries.find((e) => e.id === contest.winner_entry_id);
  const decided = contest.status === "FINALIZED" || contest.status === "PAID";
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px" }}>
      <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)" }}>{contest.status} · {(contest.prize_wei / 1e18).toFixed(1)} GEN prize · demo funds, StudioNet only</div>
      <h1 className="font-display" style={{ fontSize: 52, margin: "8px 0" }}>{contest.title}</h1>
      <p style={{ color: "var(--ink-muted)", maxWidth: 720 }}>{contest.description}</p>
      <div className="card" style={{ padding: 20, margin: "24px 0" }}>
        <h2 style={{ margin: "0 0 12px" }}>Rubric (locked on-chain)</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {contest.criteria.map((c) => <li key={c.id}><strong>{c.name}</strong> · weight {c.weight} — {c.description}</li>)}
        </ul>
        <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Weights sum to 100. Closes {new Date(contest.entry_deadline * 1000).toLocaleString()}.</p>
      </div>
      {decided && (
        winner ? (
          <div className="card" role="status" style={{ padding: 24, margin: "0 0 8px", borderColor: "var(--accent)", borderWidth: 2 }}>
            <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Winner · decided by validator consensus
            </div>
            <div className="font-display" style={{ fontSize: 36, margin: "8px 0" }}>
              Entry #{winner.id} — {(winner.total_x100 / 100).toFixed(1)} pts
            </div>
            <div style={{ fontSize: 14 }}>
              by <span className="font-mono2">{winner.creator.slice(0, 6)}…{winner.creator.slice(-4)}</span>
              {" · "}prize {(contest.prize_wei / 1e18).toFixed(2)} GEN
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
              {contest.status === "FINALIZED"
                ? `Appeal window open until ${new Date(contest.appeal_deadline * 1000).toLocaleString()}. Payout unlocks after.`
                : "Prize paid out."}
            </div>
            <Link href={`/contests/${contestId}/entries/${winner.id}`} className="btn btn-ghost" style={{ marginTop: 12 }}>See the winning scores →</Link>
          </div>
        ) : (
          <div className="card" role="status" style={{ padding: 24, margin: "0 0 8px", borderColor: "var(--danger)", borderWidth: 2 }}>
            <div className="font-mono2" style={{ fontSize: 12, color: "var(--danger)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              No winner
            </div>
            <p style={{ margin: "8px 0 0" }}>No entries could be scored, so there is nothing to pay out to.</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
              The organizer can reclaim the locked {(contest.prize_wei / 1e18).toFixed(2)} GEN prize with the claim button below. Nobody else can touch it.
            </p>
          </div>
        )
      )}
      <h2 className="font-display" style={{ fontSize: 34 }}>Leaderboard</h2>
      {entries.length === 0 ? <p>No entries yet.</p> : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {entries.map((e, i) => {
            const isWinner = decided && e.id === contest.winner_entry_id;
            return (
              <Link key={e.id} href={`/contests/${contestId}/entries/${e.id}`} className="card"
                style={{ padding: 20, borderColor: isWinner ? "var(--accent)" : undefined, borderWidth: isWinner ? 2 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong>#{i + 1} Entry #{e.id}{isWinner ? " · WINNER" : ""}</strong>
                  <span className="font-mono2">{(e.total_x100 / 100).toFixed(1)} · {e.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>{e.url}</div>
                <div className="font-mono2" style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>
                  by {e.creator.slice(0, 6)}…{e.creator.slice(-4)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <ContestActions
        contest={{ id: contestId, status: contest.status, organizer: contest.organizer, entryCount: contest.entry_count, maxEntries: contest.max_entries, entryDeadline: contest.entry_deadline, winnerEntryId: contest.winner_entry_id, appealDeadline: contest.appeal_deadline, prizeWei: contest.prize_wei }}
        entries={entries.map((e) => ({ id: e.id, status: e.status, creator: e.creator }))}
      />
    </div>
  );
}
