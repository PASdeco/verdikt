import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "48px 24px 40px", textAlign: "center", overflow: "hidden" }}>
      <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", fontSize: 13, marginBottom: 24 }}>
        <Link href="/contests">Contests</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <div className="font-display" style={{ fontWeight: 700, fontSize: "clamp(64px,16vw,220px)", lineHeight: 0.9, letterSpacing: "-0.05em", color: "var(--wordmark)" }}>Verdikt</div>
      <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "20px 0 0" }}>Prototype on GenLayer StudioNet. No real funds.</p>
    </footer>
  );
}
