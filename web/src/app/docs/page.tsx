export default function Docs() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 96px" }}>
      <h1 className="font-display" style={{ fontSize: 52 }}>Integration docs</h1>
      <p>Contract: <code>contracts/verdikt_contest.py</code> (GenLayer Intelligent Contract, Python).</p>
      <ul>
        <li><code>create_contest(title, description, criteria_json, entry_deadline, max_entries)</code> payable — weights must sum to 100.</li>
        <li><code>submit_entry(contest_id, url)</code> — one per address, no shorteners.</li>
        <li><code>close_entries → judge_entry(entry_id) × N → finalize → appeal (0.1 GEN bond) → claim_prize</code></li>
        <li>Views: <code>get_contest, list_contests, get_entries, get_entry, list_by_organizer, list_by_creator, get_stats, get_activity</code></li>
      </ul>
      <p>Frontend reads via <code>src/lib/genlayer.ts</code> (single wrapper). Set <code>NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS</code> to leave MOCK_MODE. StudioNet: RPC <code>https://studio.genlayer.com/api</code>, chain 61999, explorer <code>https://explorer-studio.genlayer.com</code>.</p>
    </div>
  );
}
