# Verdikt

> And the winner is *provably* fair.

On-chain contest judging on GenLayer. Organizer locks a weighted rubric + prize. Creators submit links. Validators fetch each entry live, score per criterion with reasons, and must reach consensus. Ranking is public; prize releases to the winner. Appeals use a bond.

Prototype on GenLayer StudioNet. No real funds.

## Quickstart (10 min)
```bash
cd Verdikt
cp .env.example .env   # fill BACKEND_PRIVATE_KEY etc.
pip install genlayer-test
python -m pytest tests/direct -q   # 18 tests
cd web && npm install && npm run dev  # http://localhost:3000 (MOCK_MODE until contract set)
```

## Layout
```
contracts/  verdikt_contest.py
tests/direct/  conftest.py (Windows stdin shim from Roast) + test_verdikt_contest.py
web/  Next.js App Router + genlayer-js wrapper (src/lib/genlayer.ts) + MOCK_MODE
scripts/  lint_contract.py, genskill.py, deploy-contracts.mjs
docs/  ARCHITECTURE.md, DECISIONS.md, DEPLOY.md, BLUEPRINT.md, design-reference.html
```

## StudioNet
RPC `https://studio.genlayer.com/api` · chain 61999 · explorer `https://explorer-studio.genlayer.com`.

## Status
- Contract: **live on StudioNet at `0xA002306700390d24C1b24b372f006C0956edB2a3`** (lint-clean, 18/18 direct tests, `verify-live.mjs` passes). (happy path, tie-break, weights≠100, dup/late entries, unscorable, injection, malformed LLM, appeal flip/no-flip, double claim, auth, cancel/refund).
- Frontend: live reads/writes against the deployed contract, EIP-6963 wallet modal (Rabby/Zerion/MetaMask) + StudioNet switch. No mock.
- Deploy: contract deployed + wired in both env files; frontend Vercel-ready.

## Known limits
Fetch blocking on some platforms (use archive/mirror), demo-only escrow, LLM variance, no plagiarism detection. See `docs/ARCHITECTURE.md`.
