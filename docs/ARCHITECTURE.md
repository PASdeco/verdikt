# Verdikt — Architecture

## States
`OPEN → CLOSED → JUDGING → SCORED → FINALIZED → PAID`, plus `CANCELLED`.
- OPEN: entries accepted before `entry_deadline` and under `max_entries` (one per wallet).
- CLOSED: organizer closes once the deadline passes or the cap is reached (`close_entries`, organizer-only).
- JUDGING: organizer runs `judge_entry` per entry (organizer-only); entries scored one tx at a time.
- SCORED: `scored_count == entry_count` (SCORABLE + UNSCORABLE both count).
- FINALIZED: `finalize` computed weighted totals + winner; sets 3-day `appeal_deadline`.
- PAID: `claim_prize` after appeal window, once. Winner-or-organizer triggers; funds always go to the winner. No-winner contests (nothing scorable): only the organizer can reclaim the locked prize — otherwise it would sit stuck forever.
- CANCELLED: organizer cancels empty contest; prize refunded.

Activity log per contest records every transition with timestamp + actor.

## Scoring flow
`judge_entry(entry_id)` runs a non-deterministic block:
1. `gl.nondet.web.get(url)` fetches live content (capped 8000 chars).
2. `gl.nondet.exec_prompt` scores blind (no creator address) with strict JSON `{scores, reasons, accessible}`.
3. Consensus via `gl.vm.run_nondet_unsafe`: validator re-runs scoring; `accessible` must match; each criterion within ±1; reasons need not match.
4. Deterministic update stores scores, `total_x100 = Σ(score×weight)` (0–1000), status SCORED/UNSCORABLE.

Tie-break: higher total wins; then higher score on highest-weight criterion; then earlier submission.

## Appeal economics
- Who/when: entry creator or organizer, within 3 days of finalization.
- Bond: 0.1 GEN payable with `appeal`. Re-runs scoring under consensus.
- Changed ruling (accessibility flip or any criterion shift >1 / total change) → bond refunded via `emit_transfer`, winner recomputed.
- Unchanged → bond stays in contract (forfeited; demo-only accounting).
- `claim_prize` pays `prize_wei` to winner creator after window. Double-claim blocked.

## Trust assumptions
- Validators independently fetch + LLM-score; ±1 tolerance handles LLM variance.
- Fetched content is untrusted data: delimited, instruction-ignoring prompt, strict JSON, size caps, shortener blocklist.
- Escrow is native GEN via payable + `emit_transfer` (verified pattern from RoastPayments on StudioNet). Marked demo-only: StudioNet has no real funds.
- Limits: LLM variance, fetch blocking (archive/mirror fallback, extensible adapters), no plagiarism detection.
