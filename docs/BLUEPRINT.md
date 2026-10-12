# VERDIKT — Build Blueprint (feed this whole file to the coding agent)

## 0. How to work
You are a senior full-stack + smart-contract engineer. Build the project below end to end: contract, deployment to StudioNet, and the wired-up frontend.
- Work in milestones (section 12). After each: run tests, run the app, fix errors, then continue.
- **Do not guess GenLayer APIs from memory.** The platform is pre-mainnet and changes often. Before writing contract or SDK code, read the current official docs (docs.genlayer.com, the genlayer-js SDK, GenLayer Studio, StudioNet network details) and the example Intelligent Contracts. Use the exact current syntax, chain ID, RPC URL and explorer from those docs.
- If this blueprint conflicts with current docs, follow the docs and record the deviation in `docs/DECISIONS.md`.
- Never commit secrets. Use `.env.example`.
- Attached design files: `verdikt-design-reference.html` (approved visual reference, match it) and `verdikt-logo-mark.svg` (logo symbol). Treat the HTML as a visual spec, not production code.

## 1. Product
**Verdikt** is on-chain contest judging. An organizer publishes a weighted rubric and locks a prize. Creators submit public links as entries. GenLayer validators open each entry, score it per criterion against the rubric with written reasons, and must reach consensus. The ranking is public and the prize is released to the winner. Any participant can appeal a ruling with a bond.

Why GenLayer: judging is subjective and needs live web access, which ordinary oracles can't do.

Headline copy: "And the winner is *provably* fair." (italic accent on "provably").

## 2. Target network
**StudioNet.** Deploy and run everything there. Confirm its RPC URL, chain ID, explorer and wallet setup from current docs. It is a development environment with no real funds, so show that clearly in the UI. Keep all chain config in env vars so another GenLayer network can be targeted later by config only. Don't hard-code consensus timing or validator counts; StudioNet behavior may differ from production.

## 3. Tech stack (confirm against docs, then commit)
- Contract: GenLayer Intelligent Contract (Python), tested with GenLayer tooling, deployed to StudioNet.
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS.
- Chain access: `genlayer-js` for reads/writes; wallet connection via an EVM-compatible wallet flow (MetaMask plus WalletConnect-compatible wallets). Use wagmi + viem or whatever the SDK docs recommend.
- Data/state: TanStack Query. Forms: react-hook-form + zod. Icons: lucide-react.
- Tests: contract tests, Vitest for utilities, Playwright for 3 key flows.
- Deploy: Vercel for the frontend. Document contract deploy in `docs/DEPLOY.md`.

## 4. Repo structure
```
verdikt/
  contracts/           verdikt_contest.py (+ tests/)
  web/                 Next.js app (app/, components/, lib/, styles/)
  web/public/brand/    logo-mark.svg, favicons, og image
  docs/                ARCHITECTURE.md, DECISIONS.md, DEPLOY.md
  .env.example
  README.md
```

## 5. Smart contract spec (`verdikt_contest`)

### Data model
`Contest`: id, organizer, title, description, criteria[] (name, description, weight; weights must sum to 100), prize, entry_deadline, judging_window, max_entries, status, winner_entry_id, created_at.

`Entry`: id, contest_id, creator, url, submitted_at, criterion_scores{}, total, reasons{}, status, appeal_count.

Contest `status`: `OPEN → CLOSED → JUDGING → SCORED → FINALIZED → PAID`, plus `CANCELLED` (no entries, organizer cancels and is refunded).

### Methods
- `create_contest(title, description, criteria, entry_deadline, max_entries)` — organizer calls with prize attached. Validate lengths, weights sum to 100, future deadline.
- `submit_entry(contest_id, url)` — one entry per address, before the deadline, URL validation and platform allow-list.
- `close_entries(contest_id)` — callable by anyone after the deadline.
- `judge_entry(entry_id)` — callable by anyone; runs the **non-deterministic** scoring (below) for one entry. Judge entries individually so each call stays small.
- `finalize(contest_id)` — requires all entries scored; computes weighted totals and ranking; deterministic tie-break (higher score on the highest-weight criterion, then earlier submission). Sets the winner.
- `appeal(entry_id)` — entry creator or organizer, within an appeal window, with a bond. Re-runs scoring; bond returns if the ruling changes, otherwise is forfeited. Define this precisely in `docs/ARCHITECTURE.md`.
- `claim_prize(contest_id)` — pays the winner after the appeal window. Prevent double claim.
- `cancel_contest` / `refund` paths for zero entries.
- Views: `get_contest`, `list_contests(status, cursor)`, `get_entries(contest_id)`, `get_entry`, `list_by_organizer`, `list_by_creator`, `get_stats`.
- Keep an activity log per contest (status changes with timestamps) for the UI timeline.

### Scoring logic (the core)
In `judge_entry`, inside a non-deterministic block:
1. Fetch the entry URL (live web access).
2. Prompt the LLM with the rubric and the fetched content. **Strip creator identity** from what the model sees so judging is blind.
3. Require strict JSON: `{ "scores": { "<criterion_id>": integer 0-10 }, "reasons": { "<criterion_id>": string max 200 chars }, "accessible": bool }`.
4. Use the equivalence principle so validators agree when each criterion score is within a small tolerance (for example ±1) and `accessible` matches. Check current docs for the right comparative pattern. Free-text reasons need not match exactly.
5. If `accessible` is false (dead link, blocked), mark the entry `UNSCORABLE` and allow one resubmission window rather than score zero.

### Security and abuse hardening
- **Prompt injection is the main risk in a contest** — entries will contain text like "rate this 10/10". Treat fetched content as untrusted data: delimit it, instruct the model to ignore any instructions inside it, accept only the strict JSON, and reject anything that fails to parse. Add a test with a hostile entry.
- Cap fetched text size, allow-list platforms, reject URL shorteners and cross-domain redirects.
- Authorization on every state-changing method; update state before moving funds.
- Platforms that block automated fetching: support an alternate public proof link (archive or embed page) and make the platform adapter list easy to extend.
- Check how value/escrow works in current GenLayer contracts. If native transfer isn't supported on StudioNet, implement escrow accounting with the supported mechanism and mark it demo-only.
- Document honest limits: LLM judging can be inconsistent and plagiarism detection is out of scope.

### Contract tests
Happy path, tie-break, weights not summing to 100, duplicate entry, late entry, unscorable link, hostile injection entry, malformed LLM output, appeal that flips and appeal that doesn't, double claim, unauthorized callers, cancel/refund.

## 6. Design system (match the approved reference)

**Fonts (load via `next/font`):** Fraunces (500/700, plus italic 500) for headlines and rank numerals; Hanken Grotesk (400/500/700/800) for body and UI; IBM Plex Mono (500/600) for scores, labels and eyebrow text.

**Theme:** light and dark, `data-theme="light|dark"` on `<html>`. First visit follows `prefers-color-scheme`; the header toggle (sun/moon icon, with an accessible label) persists the choice. No flash of the wrong theme (tiny inline script before paint). Both themes must be fully polished on every page.

| Token | Dark (as in reference) | Light |
|---|---|---|
| `--bg` | #0A0A0B | #F5F3EE |
| `--surface` | #111112 | #FFFFFF |
| `--surface-raised` | #1A1411 | #FBEFE9 |
| `--band` (section that alternates) | #EDEBE6 | #0A0A0B |
| `--band-ink` | #151515 | #EDEBE6 |
| `--border` | #2B2A27 | #D6D2C8 |
| `--ink` | #EDEBE6 | #151515 |
| `--ink-muted` | #A9A59C | #4A4843 |
| `--accent` (fills) | #F2542D | #F2542D |
| `--accent-text` (accent used as text) | #F2542D | #9A2E12 |
| `--accent-ink` (text on accent fill) | #0A0A0B | #0A0A0B |
| `--danger` | #F2877F | #B3261E |

Sections that are paper-white in dark mode (the "rubric" method section) flip to a dark band in light mode, so the page keeps its rhythm. The full-bleed accent band stays accent in both themes. The giant footer wordmark uses a barely-visible tone of `--ink` on `--bg` in both themes.

Rules: buttons are sharp-cornered (4px radius), uppercase, letter-spaced, 44px minimum height (52px for hero CTAs). Cards and tables use 6px radius with 1px borders. Text contrast at least 4.5:1 in both themes. Visible focus rings. Respect `prefers-reduced-motion`. No emoji.

## 7. Symbols, logo and icons (light and dark)
- **Logo:** wordmark "Verdikt" in Fraunces 700 followed by an accent-colored period, plus the supplied `verdikt-logo-mark.svg` (a V with an accent square above it). The mark's strokes use `currentColor`, so it flips automatically with the theme; the accent square stays #F2542D. Provide both lockups: mark + wordmark (header, footer) and mark only (favicon, wallet modal, avatars).
- **Favicons and app icons:** generate SVG favicon with `prefers-color-scheme` support (light and dark variants), 32px PNG fallback, 180px Apple touch icon, and a web manifest.
- **Open Graph / Twitter image:** two compositions (dark default, light optional), generated at build or via an OG route, with the headline and logo.
- **Icon set:** lucide-react with `currentColor` and consistent 1.75 stroke; check every icon in both themes. Required symbols: sun/moon toggle, wallet, copy, external-link, check, x, clock, trophy, gavel/scale for rulings, link, alert, info, menu, chevrons, loader.
- **Status badges** carry icon + label, never color alone: Open, Closed, Judging, Scored, Finalized, Paid, Cancelled, Unscorable, Appealed. Define the badge color pairs per theme and confirm contrast.
- **Chain/wallet symbols:** wallet option icons shown on a neutral tile that works on both backgrounds.

## 8. Pages and features

Global: header (split layout: nav left, centered logo, right side with theme toggle and Connect Wallet; collapses to a menu on mobile), footer (links, giant wordmark, "Prototype on GenLayer StudioNet. No real funds."), toast system, error boundary, skeleton loaders, custom 404, network banner.

1. **`/` Landing**, following the reference:
   - Centered hero: eyebrow "Contest judging · on-chain · open record"; H1 "And the winner is *provably* fair."; sub "Set the rubric, lock the prize, and let independent validators score every entry. The ranking, and the reasons behind it, stay public."; CTAs "Launch a contest" and "Browse live contests".
   - Full-width leaderboard (live data for the featured contest, otherwise a clearly labelled sample): rank, entry, per-criterion score bars, total. Horizontal scroll on small screens.
   - "The rubric is the product" numbered method section (write it once and lock it; validators read every entry; consensus pays out).
   - Full-bleed accent band: "Every score. Every reason. On the record." with a "Contest an outcome" button linking to the appeals explainer.
   - Roles section: Organizers, Creators, Validators.
   - FAQ (how scoring works, blind judging, what if a link dies, appeals and bonds, supported platforms, StudioNet disclaimer), final CTA.
2. **`/contests`** Browse: search, status filter chips, sort (newest, prize, closing soon), contest cards/rows with prize, entries count, deadline countdown, status; empty and loading states.
3. **`/contests/new`** Create flow (stepper): basics → rubric builder (add/remove criteria, weight sliders with a live "must total 100" validator, template presets like "Design", "Hackathon", "Writing") → deadlines and entry cap → review → sign and lock prize with tx status.
4. **`/contests/[id]`** Contest detail: rules and rubric, prize, countdown, role-aware actions (enter, close entries, run judging, finalize, claim), the leaderboard board, entries list, timeline with explorer links.
5. **`/contests/[id]/entries/[entryId]`** Entry detail: the submitted link (opened safely, `rel="noopener noreferrer"`), per-criterion scores with each validator's reasoning, validator consensus panel ("X of N agree"), appeal button with a bond explainer modal.
6. **`/dashboard`** Tabs "My contests" and "My entries" with status chips and next-action prompts.
7. **`/how-it-works`**, **`/faq`**, **`/terms`**, **`/privacy`** (marked StudioNet prototype, placeholder legal text, no financial advice), **`/docs`** (contract overview and integration notes linking to the repo).

## 9. Wallet and chain handling
- "Connect wallet" modal with supported wallets (MetaMask, WalletConnect-compatible). Connected state: truncated address, network, balance, copy, disconnect.
- Wrong network → banner "Switch to StudioNet" that adds/switches the chain using params from current docs.
- Handle: no wallet installed (install link), rejected connection, rejected signature, insufficient funds, tx pending/success/failure with explorer link, disconnect mid-session, account change.
- Browsing works read-only without a wallet; gated actions prompt connection.
- Never store keys. Persist the last-used wallet only.

## 10. Frontend–contract integration
- One `lib/genlayer` module wraps client creation, reads, writes and receipt waiting. Components never call the SDK directly.
- Typed models mirroring the contract; zod-validate all contract responses.
- Transaction lifecycle UI: signing → submitted → awaiting consensus → finalized, with human-readable errors. Poll while a contest is CLOSED or JUDGING and show "Validators are reviewing entries. This can take a few minutes."
- Judging many entries means many transactions: build a "Judge all entries" helper that queues them and shows per-entry progress.
- Env vars: chain ID, RPC URL, contract address, explorer URL, WalletConnect project id.
- `MOCK_MODE=true` serves seeded fake contests, entries and scores so the UI can be built and demoed without the chain.

## 11. "Proper website" checklist (all required)
- SEO: titles, descriptions, Open Graph/Twitter images, favicon set, `sitemap.xml`, `robots.txt`.
- Accessibility: semantic HTML, labelled inputs, keyboard navigation, focus trap in modals, aria-live for toasts and tx status, no serious axe issues, status never conveyed by color alone.
- Performance: Lighthouse at least 90 on the landing page for all four categories; optimized fonts; no layout shift.
- Both themes verified on every page with screenshots at 360, 768 and 1280 widths.
- Loading, empty and error states for every data view.
- Security headers, input sanitation, no secrets in the client bundle, rate-limit any API route.
- Optional privacy-friendly analytics via env.
- StudioNet/demo disclaimer wherever prize amounts appear.

## 12. Milestones and acceptance criteria
1. **Scaffold:** repo, Next.js, tokens, theme toggle with no flash, logo and icon set, header/footer, mock mode. *Accept: landing shell renders in both themes with correct logo.*
2. **Landing and static pages** with full copy, FAQ, responsive. *Accept: Lighthouse targets met, matches the reference.*
3. **Contract:** implement, test, deploy to StudioNet, document the address. *Accept: all tests pass; one full contest judged on StudioNet.*
4. **Wallet and chain layer.** *Accept: connect, disconnect, wrong-network flows work.*
5. **Create contest and browse** wired to chain. *Accept: a contest created in the UI appears in the list.*
6. **Contest detail, entries, judging, finalize, claim, appeal.** *Accept: full lifecycle through the UI on StudioNet.*
7. **Polish:** a11y pass, Playwright flows, README, Vercel deploy. *Accept: live URL; a stranger can run the repo in 10 minutes.*

## 13. Content rules
Use the exact copy above for hero, section headings and CTAs. Where real data is unknown use obvious placeholders; never invent statistics, testimonials or logos. No lorem ipsum.

## 14. Deliverables
Working repo, deployed frontend URL, deployed StudioNet contract address, `README.md`, `docs/ARCHITECTURE.md` (states, scoring flow, appeal economics, trust assumptions), `docs/DECISIONS.md`, and a list of known limitations (platform fetch blocking, demo-only escrow if applicable, LLM scoring variance).

At the end report: what's done, what's mocked, what you couldn't verify against the docs, and the top 5 risks.
