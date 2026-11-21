# Capital Lane website

Website for **Capital Lane Ltd**, chauffeur-driven airport transfers.
See `docs/` for the plan and `skills/capitallanes/SKILL.md` for project rules.

## Run it locally (Mac)

Needs Node 22 or newer (`node -v`). If you do not have Node: `brew install node@22`.

```bash
cd ~/Documents/Sites/CapitalLanes
corepack enable pnpm     # one time, turns on pnpm (comes with Node)
pnpm install             # installs packages
pnpm dev                 # open http://localhost:3000
```

Other commands:

| Command | What it does |
|---|---|
| `pnpm test` | Runs the fare tests |
| `pnpm typecheck` | Checks TypeScript |
| `pnpm check:wording` | Fails if a banned word is used anywhere |
| `pnpm build && pnpm start` | Production build, as it will run on the server |

## Layout

```
apps/web/            Next.js site (App Router, Tailwind)
  app/page.tsx       Homepage
  components/        Fare calculator and fare table
  content/site.ts    Company details, promise, vehicle text (one source of truth)
packages/pricing/    Fares in pence + quote function, with tests
scripts/             Wording check
```

To change a price, edit `packages/pricing/src/fares.ts` and the test in `quote.test.ts`.

## Wording rule

Never use the words Taxi, Taxis, Cab or Cabs. Use chauffeur, airport transfer or private hire. <!-- wording-check:allow -->

The only exception is a line that states this rule, marked with a `wording-check:allow` comment.
