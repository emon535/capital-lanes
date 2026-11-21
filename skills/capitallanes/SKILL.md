---
name: capitallanes
description: Use for any CapitalLanes work (UK airport transfer / private hire website, booking, admin, driver app, Namecheap VPS hosting) to follow the agreed product rules, stack and conventions.
---

# CapitalLanes project skill

**Legal company name: Capital Lane Ltd** (brand: Capital Lane; project/code name: CapitalLanes). It is a UK private hire company doing **pre-booked airport transfers with a driver** (not self-drive rental). We are building a landing page + booking website first, then an admin/dispatch panel, then a driver app with customer live tracking.

Work folder: `/Users/emon/Documents/Sites/CapitalLanes` (owner: Emon). Read these before big changes:
- `research/competitors.md` — competitor findings (Nov 2026)
- `docs/project-document.md` — scope, pages, booking flow, pricing, roadmap
- `docs/system-design.md` — architecture, data model, API, deployment, security

Code lives in the same folder: `apps/web` (Next.js homepage done), `packages/pricing`. Run with `pnpm install && pnpm dev`.

If a doc and this skill disagree, the newest doc wins; update this skill to match.

## 1. Product rules (never break these)

0. **Banned words:** never use **Taxi, Taxis, Cab or Cabs** anywhere: copy, page titles, meta, URLs/slugs, schema.org types (no `TaxiService`; use `LocalBusiness`/`Service`), code identifiers, file names, commit messages. Say chauffeur, airport transfer, private hire, driver, car. `pnpm check:wording` (scripts/check-wording.mjs) enforces this; run it before every commit. Only `research/` may quote competitor names. <!-- wording-check:allow -->
1. **One promise, same words everywhere:** fixed all-in fare (VAT, parking, airport drop-off charge included) · 60 min free airport waiting after actual landing · flight tracking · name-board meet & greet · free cancellation up to 24 h · free child seats. Keep it in one content source; never hard-code variations.
2. **Instant native quote** in the hero (no iframes, no third-party booking widgets). Price visible in under 10 s, booking in under 60 s.
3. **Price transparency:** publish per-route, per-vehicle price tables with an "includes" list and a "prices last checked" date. Never add fees at checkout that were not in the quote.
4. **Server is the price authority.** Re-price at payment from the stored quote; ignore client amounts.
5. **Trust signals:** TfL operator licence no. and company no. in the footer; real reviews with platform and count; no placeholder or demo text anywhere.
6. **SEO-readable:** every public page must render its content without JavaScript (SSG/SSR). Unique title + meta description per page.
7. **Driver app ready:** all booking state changes go through the shared state machine and the `/v1` API.

Market facts to remember: Heathrow → Central London saloon costs £56–69 at competitors; drop-off charges 2026: Heathrow £7, Gatwick £10, London City £8 (re-check before launch). Competitors' gaps: broken booking widgets, no live tracking, contradictory policies, client-rendered pages.

## 1a. Published prices (from Emon, 20 Nov 2026; one-way, all-in)

| From E14 (Canary Wharf) | Standard | Business Comfort | Executive | Luxury |
|---|---|---|---|---|
| Heathrow | £90 | £110 | £130 | £150 |
| Gatwick | £110 | £130 | £150 | £180 |

Vehicle tiers are exactly these four. The fares live only in `packages/pricing/src/fares.ts` (integer pence) and must be shown on the homepage (calculator + table). Never change live prices without Emon's say-so. Still unknown: reverse direction (airport → E14) pricing, return-trip pricing, other postcodes and airports, vehicle capacities.

## 2. Tech stack (default unless Emon says otherwise)

- **Monorepo:** pnpm workspaces + Turborepo. `apps/web` (Next.js), `apps/api` (Fastify), `apps/worker` (pg-boss jobs), `apps/driver` (Expo, later); `packages/shared` (Zod schemas, enums, API client), `packages/db` (Prisma), `packages/pricing` (pure functions), `packages/ui`.
- **Web:** Next.js App Router + React + TypeScript, Tailwind, React Hook Form + Zod. Marketing pages SSG/ISR; booking steps are client components in a server shell; admin under `/admin` with `noindex`.
- **API:** Fastify + TypeScript, versioned `/v1`, Zod validation, OpenAPI generated, Socket.IO for live location.
- **Data:** PostgreSQL 16 via Prisma. Jobs with pg-boss (no Redis on 2 GB).
- **Integrations:** Stripe Payment Element (card, Apple Pay, Google Pay) with webhooks; Google Places Autocomplete + Routes; flight data (AeroDataBox or FlightAware); Resend/Postmark email; Twilio SMS/WhatsApp; Sentry.
- **Python:** only for later analytics/pricing experiments, as a separate service reading Postgres.

## 3. Code conventions

- TypeScript `strict`; no `any` in shared packages.
- Money as **integer pence** (`pricePence`); format with `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.
- Times stored UTC (`timestamptz`), displayed in `Europe/London`. Use `date-fns-tz` or Temporal; never naive local times.
- Phones in E.164 (`libphonenumber-js`), UK default.
- Booking statuses: `draft, pending_payment, confirmed, driver_assigned, driver_en_route, driver_arrived, passenger_on_board, completed, cancelled_by_customer, cancelled_by_operator, no_show, payment_failed, refunded`. Change status only via `canTransition()` in `packages/shared`, and write a `BookingEvent` with the actor.
- Booking reference format `CL-XXXXXX` (no ambiguous characters).
- Webhook and job handlers must be **idempotent** (Stripe event id / dedupe keys in `NotificationLog`).
- Error shape: `{ error: { code, message, details? } }`.
- Pricing logic lives only in `packages/pricing` with table-driven unit tests.
- Return trips = two linked bookings (`returnOfId`).

## 4. Hosting: Namecheap VPS Pulsar (2 vCPU, 2 GB RAM, 40 GB SSD, no cPanel)

- Ubuntu 24.04, Nginx (TLS via Certbot, brotli/gzip, rate limits, WebSocket proxy), Node 22 LTS, PostgreSQL 16 on localhost, systemd units for `web`, `api`, `worker` with `MemoryMax` and Node `--max-old-space-size`.
- 2 GB swap file, `vm.swappiness=10`. Postgres: `shared_buffers=256MB`, `max_connections=30`.
- **Never build on the server.** GitHub Actions builds and tests, then rsyncs a release, runs `prisma migrate deploy`, flips the `current` symlink, restarts, health-checks `/v1/health`, rolls back on failure.
- Security: SSH keys only, ufw (22/80/443), fail2ban, unattended upgrades, secrets in `/etc/capitallanes/*.env` (600).
- Backups: nightly encrypted `pg_dump` to Backblaze B2/S3 (14 daily + 8 weekly), weekly restore test.
- If memory is tight: move Postgres to managed, or upgrade the plan, before adding more processes.

## 5. How to work on this project

- **Website/SEO tasks:** check the page renders without JS, has unique meta, schema.org JSON-LD, and uses the shared promise block and quote widget.
- **Booking/pricing tasks:** update `packages/pricing` tests first; confirm Heathrow → Central London cases; check cancellation and waiting rules match the project document.
- **API tasks:** add Zod schemas to `packages/shared`, regenerate OpenAPI, keep endpoints usable by the future driver app.
- **Infra tasks:** respect the memory budget in `docs/system-design.md` §9; keep config in `infra/`.
- **Docs:** keep `docs/` current when decisions change; record new decisions in the "Decisions" sections.
- Ask Emon before anything irreversible (production DB changes, deleting data, sending messages to real customers, changing live prices).

## 6. Open decisions (check docs for latest)

More airports and pickup areas · vehicle capacities and models · TfL licence and company numbers · domain · brand assets · 24 h vs 12 h free cancellation · Congestion Charge policy · cash policy · email/SMS providers.
