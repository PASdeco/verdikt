# Verdikt — Deploy

## Contract (StudioNet)

**Live:** `0xf67737Ce93A727BC59f41f753565BCFaFA02AcB9`
(deploy tx `0xa5929c42c621622bce15f7b6ac0494938b0e1925a6724e882ee8db090b1831bd`, ACCEPTED; verified with `scripts/verify-live.mjs` — `get_stats` responds.)
Superseded: `0xc5D08c126e407e5a7dA74E639De07E18155A1b6A` (u64 TreeMap keys, rejected on review), `0x349A02aA5C3f5646793447473dcFEa2EA40B39a9` (no no-winner refund), `0xA002306700390d24C1b24b372f006C0956edB2a3` (permissionless build); do not use.
1. `cp .env.example .env` — set `BACKEND_PRIVATE_KEY` (dedicated, funded GEN), `GENLAYER_NETWORK=studionet`.
2. `python scripts/lint_contract.py contracts/verdikt_contest.py` — must be ok.
3. `python -m pytest tests/direct -q` — 20 tests.
4. `cd web && node scripts/deploy-contracts.mjs` — waits for ACCEPTED, prints address. (Run from `web/` so `genlayer-js` resolves; mirrored copies live in `web/scripts/`.)
5. Set `VERDIKT_CONTRACT_ADDRESS` + `NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS` in root `.env` and `web/.env.local`, then `node scripts/verify-live.mjs` from `web/`.
6. Full contest on StudioNet: create → submit × N → close → judge each → finalize → (appeal) → claim after 3 days.

Network: RPC `https://studio.genlayer.com/api`, chain 61999, explorer `https://explorer-studio.genlayer.com`.

## Frontend (Vercel)

**Live:** `https://gen-verdikt.vercel.app/` (project `gen-verdikt`, production deploys from `web/`).
- Root: `web/`. Env: `NEXT_PUBLIC_GENLAYER_RPC`, `NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999`, `NEXT_PUBLIC_GENLAYER_EXPLORER`, `NEXT_PUBLIC_VERDIKT_CONTRACT_ADDRESS`, `NEXT_PUBLIC_APP_URL`, `MOCK_MODE`.
- `npm install && npm run build`. Deploy `web/` to Vercel. No secrets in client bundle (`BACKEND_PRIVATE_KEY` never prefixed with NEXT_PUBLIC_).
- Project must have framework preset `nextjs` (CLI-created projects default to null → pages 404 while static assets serve; set via API/portal and redeploy).
- Disable Deployment Protection (`ssoProtection: null`) or the public URLs serve a login challenge.
- Production env vars are stored on the project; `NEXT_PUBLIC_*` bakes at build time, so redeploy after any env change.
