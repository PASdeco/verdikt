import Link from "next/link";
import { fetchFeatured, isMockMode } from "@/lib/genlayer";
import type { Contest, Entry } from "@/lib/mock";

export default async function Home() {
  let featured: { contest: Contest; entries: Entry[] } | null = null;
  try {
    featured = await fetchFeatured();
  } catch {
    featured = null;
  }
  return (
    <div>
      <Hero />
      <Board featured={featured} />
      <Method />
      <AccentBand />
      <Roles />
      <FaqPreview />
    </div>
  );
}

function Hero() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px 40px", textAlign: "center" }}>
      <div className="font-mono2" style={{ fontSize: 13, color: "var(--accent-text)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 28 }}>
        Contest judging · on-chain · open record
      </div>
      <h1 className="font-display" style={{ fontWeight: 500, fontSize: "clamp(52px,9vw,116px)", lineHeight: 0.96, letterSpacing: "-0.035em", margin: "0 auto 32px", maxWidth: 1100 }}>
        And the winner is <em style={{ color: "var(--accent-text)" }}>provably</em> fair.
      </h1>
      <p style={{ fontSize: 20, color: "var(--ink-muted)", maxWidth: 640, margin: "0 auto 40px" }}>
        Set the rubric, lock the prize, and let independent validators score every entry. The ranking, and the reasons behind it, stay public.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/contests/new" className="btn btn-hero btn-accent">Launch a contest</Link>
        <Link href="/contests" className="btn btn-hero btn-ghost">Browse live contests</Link>
      </div>
    </section>
  );
}

function Board({ featured }: { featured: { contest: Contest; entries: Entry[] } | null }) {
  if (!featured) {
    return (
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 96px" }} aria-label="Leaderboard">
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>
            {isMockMode() ? "Sample board (MOCK_MODE)" : "Live on StudioNet · no contests yet"}
          </div>
          <p style={{ color: "var(--ink-muted)" }}>No contests on-chain yet. Launch the first one and it will appear here.</p>
          <Link href="/contests/new" className="btn btn-accent btn-hero" style={{ marginTop: 16 }}>Launch a contest</Link>
        </div>
      </section>
    );
  }
  const { contest, entries } = featured;
  const criteria = contest.criteria.slice(0, 3);
  return (
    <section id="board" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 96px" }} aria-label="Leaderboard">
      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 760 }}>
          <div className="font-mono2" style={{ display: "flex", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--ink-muted)", letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span>{contest.title} · {contest.status}</span>
            <span>Prize pool {(contest.prize_wei / 1e18).toFixed(1)} GEN · demo funds</span>
          </div>
          <div className="font-mono2" style={{ display: "grid", gridTemplateColumns: "56px 1.4fr repeat(3,1fr) 90px", gap: 20, padding: "12px 28px", fontSize: 11, color: "var(--ink-muted)", letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span>#</span><span>Entry</span>{criteria.map((c) => <span key={c.id}>{c.name}</span>)}<span style={{ textAlign: "right" }}>Total</span>
          </div>
          {entries.map((e, i) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "56px 1.4fr repeat(3,1fr) 90px", gap: 20, alignItems: "center", padding: "20px 28px", borderTop: "1px solid var(--border)", background: i === 0 ? "var(--surface-raised)" : "transparent" }}>
              <span className="font-display" style={{ fontSize: 34, color: i === 0 ? "var(--accent-text)" : "var(--ink-muted)" }}>{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Entry #{e.id}</span>
              {criteria.map((c) => {
                const v = e.scores[c.id] ?? 0;
                return (
                  <div key={c.id} style={{ height: 6, background: "var(--border)" }} role="img" aria-label={`${c.name} ${v} of 10`}>
                    <div style={{ width: `${v * 10}%`, height: 6, background: i === 0 ? "var(--accent)" : "var(--ink-muted)" }} />
                  </div>
                );
              })}
              <span className="font-mono2" style={{ fontWeight: 600, fontSize: 20, textAlign: "right" }}>{(e.total_x100 / 100).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="font-mono2" style={{ fontSize: 12, color: "var(--ink-muted)", margin: "14px 4px 0" }}>
        {isMockMode() ? "Sample board (MOCK_MODE). Deploy the contract for live validator scores." : "Live scores come from validator consensus."}
      </p>
    </section>
  );
}

function Method() {
  return (
    <section id="rubric" style={{ background: "var(--band)", color: "var(--band-ink)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 64 }}>
        <div>
          <div className="font-mono2" style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--accent-text)", marginBottom: 20 }}>The method</div>
          <h2 className="font-display" style={{ fontWeight: 500, fontSize: "clamp(40px,5vw,64px)", lineHeight: 1, letterSpacing: "-0.03em", margin: 0 }}>The rubric is the product.</h2>
        </div>
        <div>
          {[
            { n: "1", h: "Write it once, lock it", p: "Weighted criteria are fixed on-chain before the first entry, so nobody can move the goalposts." },
            { n: "2", h: "Validators read every entry", p: "Each one opens the submitted link and scores it per criterion with written reasons." },
            { n: "3", h: "Consensus pays out", p: "When validators agree on the ranking, the contract releases the prize to the winner." },
          ].map((s) => (
            <div key={s.n} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 16, padding: "28px 0", borderTop: "1.5px solid currentColor" }}>
              <span className="font-display" style={{ fontSize: 36, color: "var(--accent-text)" }}>{s.n}</span>
              <div><h3 style={{ margin: "0 0 6px", fontSize: 22 }}>{s.h}</h3><p style={{ margin: 0, opacity: 0.75 }}>{s.p}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccentBand() {
  return (
    <section style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32 }}>
        <h2 className="font-display" style={{ fontWeight: 500, fontSize: "clamp(36px,5vw,68px)", lineHeight: 1, letterSpacing: "-0.03em", margin: 0, maxWidth: 760 }}>Every score. Every reason. On the record.</h2>
        <Link href="/how-it-works#appeals" className="btn btn-hero btn-dark">Contest an outcome</Link>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" style={{ maxWidth: 1280, margin: "0 auto", padding: "104px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
      {[
        { k: "ORGANIZERS", p: "Launch hackathons, design contests and writing prizes with a rubric the whole world can inspect." },
        { k: "CREATORS", p: "Enter once, see exactly how each criterion scored, and appeal when you think a ruling is wrong." },
        { k: "VALIDATORS", p: "Independent judges whose reasoning is published next to every score they give." },
      ].map((r) => (
        <div key={r.k} style={{ padding: "8px 32px 8px 0", borderTop: "1px solid var(--border)" }}>
          <div className="font-mono2" style={{ fontSize: 12, color: "var(--accent-text)", letterSpacing: ".12em", margin: "20px 0 12px" }}>{r.k}</div>
          <p style={{ margin: 0, fontSize: 19, color: "var(--ink-muted)" }}>{r.p}</p>
        </div>
      ))}
    </section>
  );
}

function FaqPreview() {
  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 104px" }} aria-label="FAQ preview">
      <h2 className="font-display" style={{ fontSize: 40, margin: "0 0 24px" }}>Questions, answered.</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {[
          ["How does scoring work?", "Validators fetch each entry link live, score it 0–10 per criterion with written reasons, and must agree within ±1 per criterion."],
          ["What if a link dies?", "The entry is marked Unscorable and the creator gets one resubmission window instead of a zero."],
          ["How do appeals work?", "Creator or organizer posts a 0.1 GEN bond within 3 days. Re-scoring that changes the ruling refunds the bond; otherwise it is forfeited."],
          ["Is this real money?", "No. Prototype on GenLayer StudioNet. No real funds."],
        ].map(([q, a]) => (
          <details key={q} className="card" style={{ padding: "16px 20px" }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{q}</summary>
            <p style={{ color: "var(--ink-muted)", margin: "8px 0 0" }}>{a}</p>
          </details>
        ))}
      </div>
      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/contests/new" className="btn btn-accent btn-hero">Launch a contest</Link>
        <Link href="/faq" className="btn btn-ghost btn-hero">Read the FAQ</Link>
      </div>
    </section>
  );
}
