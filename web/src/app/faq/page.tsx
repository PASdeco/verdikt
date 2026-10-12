const QA: [string, string][] = [
  ["How does scoring work?", "Validators fetch each entry link live and score 0–10 per criterion with written reasons. Consensus requires ±1 agreement per criterion and matching accessibility."],
  ["Is judging blind?", "Yes. Creator identity is stripped before the model sees the content."],
  ["What if a link dies?", "Marked Unscorable with one resubmission window, not a zero."],
  ["How do appeals and bonds work?", "Within 3 days of finalization, creator or organizer posts 0.1 GEN. A changed ruling refunds the bond; otherwise it is forfeited."],
  ["Which platforms are supported?", "Public https URLs except shorteners. Some sites block automated fetching — provide an archive or embed mirror. Adapter list is extendable."],
  ["Is this real money?", "No. StudioNet prototype. No real funds. Prize amounts are demo GEN."],
  ["What are the limits?", "LLM judging can vary run to run; prompt-injected entries are treated as untrusted data but no system is perfect; plagiarism detection is out of scope."],
];

export default function Faq() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 56 }}>FAQ</h1>
      {QA.map(([q, a]) => (
        <details key={q} className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
          <summary style={{ fontWeight: 700 }}>{q}</summary>
          <p style={{ color: "var(--ink-muted)" }}>{a}</p>
        </details>
      ))}
    </div>
  );
}
