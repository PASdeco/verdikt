# Verdikt

> And the winner is *provably* fair.

**Verdikt is on-chain contest judging.** An organizer publishes a weighted rubric and locks a prize. Creators submit public links as entries. GenLayer validators open every entry live, score it per criterion with written reasons, and must reach consensus. The ranking — and every reason behind it — stays public, and the prize releases to the winner on-chain.

Prototype on **GenLayer StudioNet**. No real funds.

**Live app:** `https://gen-verdikt.vercel.app/`

## Live deployment

| | |
|---|---|
| Contract | `0xf67737Ce93A727BC59f41f753565BCFaFA02AcB9` |
| Network | StudioNet · chain `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |

## How it works

```
Organizer locks rubric (weights sum to 100) + prize GEN
        ↓  OPEN
Creators submit one link per wallet (cap enforced)
        ↓  organizer closes entries
Validators fetch each link live → LLM scores 0–10 per criterion
with written reasons → consensus requires ±1 agreement
        ↓  organizer finalizes → weighted totals, deterministic tie-break
Winner banner goes public → 3-day appeal window (0.1 GEN bond)
        ↓  winner (or organizer) claims → prize pays out on-chain
```

Judging is **blind** — creator identity is stripped before the model sees anything — and fetched page content is treated as **untrusted data** (prompt-injection hardened, strict JSON only).

## Features

- **Locked rubric** — weighted criteria fixed on-chain before entries open; nobody can move the goalposts.
- **Consensus scoring** — every entry fetched live and scored per criterion; validators must agree within ±1 or the round fails honestly.
- **Organizer-run contests** — only the launching wallet can close entries, run judging, or cancel; cancel works on empty contests only (prize refunded, never stuck).
- **Appeals with teeth** — creator or organizer re-runs scoring with a 0.1 GEN bond; changed ruling refunds the bond, otherwise it's forfeited.
- **No-winner safety** — if nothing proves scorable, only the organizer can reclaim the locked prize.
- **Transparent board** — winner banner with score and payout, per-criterion bars, validator reasons, and a public activity timeline per contest.
- **Wallet-native** — EIP-6963 connect (Rabby, Zerion, MetaMask…), one-click StudioNet switch, honest transaction states (signing → consensus → *settled* execution, never "done" prematurely).

## Tech stack

| Layer | Choice |
|---|---|
| Contract | GenLayer Intelligent Contract (Python, GenVM) |
| Frontend | Next.js App Router · TypeScript · Tailwind CSS |
| Chain access | `genlayer-js` (reads + wallet-signed writes), single wrapper in `web/src/lib/genlayer.ts` |
| Wallets | EIP-6963 discovery + injected fallback, StudioNet auto-add/switch |
| Tests | `genlayer-test` direct mode (mocked web + LLM, real consensus checks) |

## Repo layout

```
contracts/  verdikt_contest.py          # the intelligent contract
tests/direct/  conftest.py + test_verdikt_contest.py   # 22 direct-mode tests
web/  Next.js app (app/, components/, lib/, public/brand/)
web/scripts/  runnable deploy + verify scripts (genlayer-js resolves here)
scripts/  canonical tooling (lint driver, deploy, live verifier)
docs/  ARCHITECTURE.md, DECISIONS.md, DEPLOY.md, BLUEPRINT.md
```

## Getting started

```bash
git clone https://github.com/PASdeco/verdikt.git && cd verdikt
cp .env.example .env        # add BACKEND_PRIVATE_KEY (deploys) + contract address

# Contract checks (Python 3.12+)
pip install genlayer-test
python scripts/lint_contract.py contracts/verdikt_contest.py
python -m pytest tests/direct -q

# Frontend (Node 20+)
cd web && npm install && npm run dev   # http://localhost:3000
```

Wallet for testing needs StudioNet GEN (faucet) for prizes, bonds, and fees. The app prompts the StudioNet switch automatically.

## Test a full contest in minutes

1. **Launch** (`/contests/new`, wallet 1): title `Best Web Copy`, Design preset, deadline `7` days, **max entries `2`**, prize `0.2` GEN → *Sign and lock prize*.
2. **Enter**: wallet 1 submits `https://www.gnu.org/philosophy/free-sw.html`, wallet 2 submits `https://example.com` (one entry per wallet).
3. **Run it** (wallet 1): Close entries → Judge all → Finalize. Expect a clear split — rich structured copy vs. one thin paragraph — and a winner banner naming Entry #1.
4. **Appeals & payout**: appeal any entry with 0.1 GEN (unchanged ruling forfeits the bond); claiming unlocks after the 3-day window.

Tip: use small prizes while testing, and prefer fetch-friendly links (static pages, Gists) — JS-walled sites like GitHub repo pages come back `UNSCORABLE`, which correctly earns one resubmission instead of a zero.

## Contract API

| Write (who) | What |
|---|---|
| `create_contest` (anyone, payable) | Locks rubric + prize; weights must sum to 100 |
| `submit_entry` (anyone, one per wallet) | Validated URL, no shorteners |
| `close_entries` (organizer) | After deadline or cap reached |
| `judge_entry` (organizer) | One consensus-scored entry per call |
| `finalize` (anyone) | Weighted totals + tie-break, sets winner + appeal deadline |
| `appeal` (creator/organizer, 0.1 GEN bond) | Re-scores; refund bond only on changed ruling |
| `claim_prize` (winner/organizer) | Pays winner after appeal window; organizer-only reclaim if no winner |
| `cancel_contest` (organizer, empty only) | Refunds prize |

Views: `get_contest`, `list_contests`, `get_entries`, `get_entry`, `list_by_organizer`, `list_by_creator`, `get_stats`, `get_activity`.

## Security notes

- Never commit `.env` / `web/.env.local` — keys stay local (both gitignored; only `.env.example` ships).
- `BACKEND_PRIVATE_KEY` is server-side only and never `NEXT_PUBLIC_`-prefixed.
- Every state-changing method carries an authorization check; state updates before fund movement.
- Reverted transactions surface the contract's reason in the UI — acceptance is never reported as success until execution settles.

## Known limitations

- Some platforms block automated fetching (GitHub repo pages, JS-walled sites) — entries go `UNSCORABLE` with one resubmission window; provide an archive/mirror link instead.
- LLM scores vary run to run (±1 consensus tolerance absorbs normal drift, not wild disagreement).
- Escrow is demo GEN on StudioNet; plagiarism detection is out of scope.

Details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); every deviation from the original plan is logged in [`docs/DECISIONS.md`](docs/DECISIONS.md); the runbook is [`docs/DEPLOY.md`](docs/DEPLOY.md).

## License

MIT — see [LICENSE](LICENSE).
