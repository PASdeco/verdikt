export default function HowItWorks() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 56 }}>How it works</h1>
      <ol style={{ fontSize: 18, lineHeight: 1.7 }}>
        <li><strong>Write the rubric once, lock it.</strong> Weighted criteria are fixed on-chain before entries open.</li>
        <li><strong>Validators read every entry.</strong> Each opens the link live, scores 0–10 per criterion with reasons. Judging is blind: the model never sees creator identity.</li>
        <li><strong>Consensus pays out.</strong> Validators must agree within ±1 per criterion. Finalize computes weighted totals with deterministic tie-breaks, then the winner claims after a 3-day appeal window.</li>
      </ol>
      <h2 id="appeals">Appeals and bonds</h2>
      <p>Creator or organizer can appeal within 3 days with a 0.1 GEN bond. Re-scoring that changes the ruling refunds the bond and updates the winner; otherwise the bond is forfeited. Unscorable links (dead/blocked) get one resubmission instead of a zero.</p>
      <h2 id="roles">Roles</h2>
      <p><strong>Organizers</strong> launch with a rubric and prize. <strong>Creators</strong> submit one link per address. <strong>Validators</strong> publish scores + reasons next to every entry.</p>
      <p style={{ color: "var(--ink-muted)" }}>Prototype on GenLayer StudioNet. No real funds. LLM judging can be inconsistent; plagiarism detection is out of scope.</p>
    </div>
  );
}
