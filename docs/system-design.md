# CapitalLanes — System Design

_Version 0.1, 20 November 2026. Scope: landing page + booking website, admin/dispatch, and an API ready for the driver app and live tracking. Read with [project-document.md](./project-document.md)._

---

## 1. Constraints that shape the design

| Constraint | Consequence |
|---|---|
| Public pages must rank on Google | Next.js with SSG/ISR for marketing pages; no client-only content |
| One Namecheap VPS Pulsar: 2 vCPU, 2 GB RAM, 40 GB SSD, unmanaged, no cPanel | Few processes, no build on server, no Kubernetes, Redis optional, Postgres tuned small |
| Driver app later (React Native) | Separate, versioned REST API + WebSocket from day one; web is just one client |
| Card payments | Stripe Payment Element (SAQ A); webhooks are the source of truth |
| Small team | One TypeScript monorepo, shared types and validation, boring tech |

---

## 2. Architecture overview

```
                    ┌──────────────────────────────────────────────────────┐
 Browser / Mobile   │                Namecheap VPS (Ubuntu 24.04)          │
 ───────────────►   │  Nginx (TLS, gzip/brotli, cache static, rate limit)  │
    HTTPS 443       │     │                  │                    │        │
                    │     ▼                  ▼                    ▼        │
                    │  web (Next.js)     api (Fastify)       /ws (Socket.IO│
                    │  :3000 SSR/ISR     :4000 REST /v1      on api :4000) │
                    │     │  server-side calls │                           │
                    │     └──────────►─────────┤                           │
                    │                          ▼                           │
                    │             worker (pg-boss jobs: email, SMS,        │
                    │             flight polling, reminders, cleanup)      │
                    │                          │                           │
                    │                   PostgreSQL 16 (+ PostGIS opt.)     │
                    └──────────────────────────┬───────────────────────────┘
                                               │
   External: Stripe · Google Maps Places/Routes · Flight data API (AeroDataBox
   or FlightAware AeroAPI) · Email (Resend/Postmark) · SMS/WhatsApp (Twilio)
   · Backups to Backblaze B2 / S3 · Uptime monitor · Sentry
```

**Processes (systemd or PM2):** `web`, `api`, `worker`. Postgres and Nginx as system services. No Docker in production by default (saves ~150–300 MB); Docker Compose is fine for local dev.

### Why a separate API instead of Next.js route handlers only
- The driver app and future customer app need a stable, versioned API with its own auth.
- Webhooks, WebSockets and background work are simpler in a long-running Fastify process.
- Next.js stays focused on rendering and can be scaled or moved (e.g. to Vercel) without touching the API.

### Python
Not needed for v1. Reserve a Python service for later analytics or pricing experiments; it would read from Postgres (read-only role) or expose an internal HTTP endpoint behind the API.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | `apps/web`, `apps/api`, `apps/worker`, `apps/driver` (later), `packages/shared`, `packages/db`, `packages/ui` |
| Web | Next.js 15 (App Router), React, TypeScript | SSG/ISR for content, server components, minimal client JS |
| Styling | Tailwind CSS + small component library (shadcn/ui style) | Design tokens in `packages/ui` |
| Forms/validation | React Hook Form + Zod | Zod schemas shared by web, API and driver app |
| API | Fastify + TypeScript, Zod type provider, OpenAPI generated | `/v1/...` |
| ORM | Prisma (or Drizzle) | Migrations in `packages/db` |
| Database | PostgreSQL 16 | PostGIS optional for zone polygons; plain lat/lng is fine at first |
| Jobs | pg-boss (Postgres-backed queue) | Avoids running Redis on 2 GB |
| Realtime | Socket.IO (or ws) on the API | Driver location → tracking page |
| Auth | Admin/driver: email + password + TOTP 2FA, httpOnly session cookies (admin), JWT access + refresh (driver app). Customers: magic link | Argon2id for passwords |
| Payments | Stripe Payment Intents + Payment Element, Apple Pay/Google Pay | Webhooks verified |
| Maps | Google Places Autocomplete (New) + Routes API | Session tokens; cache distances |
| Flights | AeroDataBox (RapidAPI) or FlightAware AeroAPI | Poll via worker |
| Email | Resend or Postmark + React Email templates | |
| SMS/WhatsApp | Twilio | WhatsApp templates in phase 2 |
| Observability | Sentry, pino logs → journald/logrotate, UptimeRobot/Better Stack | |
| CI/CD | GitHub Actions | Build + test in CI, rsync artefacts, restart services |
| Driver app (later) | React Native (Expo), expo-location background | Same `packages/shared` types |

---

## 4. Repository layout

```
capitallanes/
├─ apps/
│  ├─ web/          Next.js site + booking UI + admin UI (/admin, no-index)
│  ├─ api/          Fastify REST + WebSocket + Stripe webhooks
│  ├─ worker/       pg-boss job handlers
│  └─ driver/       Expo app (phase 3)
├─ packages/
│  ├─ shared/       Zod schemas, enums (BookingStatus), price types, API client
│  ├─ db/           Prisma schema, migrations, seed (airports, zones, vehicle classes)
│  ├─ pricing/      Pure pricing engine (unit-tested, no I/O)
│  └─ ui/           Design tokens, shared components
├─ content/         Route/airport data (YAML/JSON) and guides (MDX)
├─ infra/           nginx.conf, systemd units, backup scripts, deploy script
├─ docs/            project-document.md, system-design.md
└─ skills/          capitallanes/SKILL.md
```

---

## 5. Data model

```
Airport ──< Terminal
Zone (polygon or postcode-district list)
VehicleClass ──< Vehicle >── Driver
RoutePrice (fromAirport|fromZone, toZone|toAirport, vehicleClass, price)
PricingRule (surcharges, night, multipliers, minimum fare)
Customer ──< Booking >── Quote
Booking ──< BookingStop
Booking ──< Payment ──< Refund
Booking ──< BookingEvent (status history / audit)
Booking >── Driver, Vehicle (assignment)
Booking ──? FlightWatch
Driver ──< DriverLocation (recent only)
PromoCode, Review, AdminUser, NotificationLog, ContentBlock
```

### Key tables (abridged)

```prisma
model Booking {
  id              String   @id @default(cuid())
  reference       String   @unique          // e.g. CL-7K4Q2M (human friendly)
  status          BookingStatus
  customerId      String?
  quoteId         String
  vehicleClassId  String
  pickupAt        DateTime                  // stored UTC; displayed Europe/London
  pickupAddress   Json                      // {label, placeId, lat, lng, postcode, airportCode?, terminal?}
  dropoffAddress  Json
  passengers      Int
  luggage         Int
  childSeats      Json?                     // [{type:"booster", count:1}]
  flightNumber    String?
  pickupBufferMin Int?                      // minutes after landing
  leadName        String
  leadPhone       String                    // E.164
  leadEmail       String
  notes           String?
  priceTotalPence Int                       // all money in integer pence
  currency        String  @default("GBP")
  priceBreakdown  Json                      // lines from pricing engine
  returnOfId      String? @unique           // links outbound/return legs
  driverId        String?
  vehicleId       String?
  manageTokenHash String                    // for magic-link manage page
  trackTokenHash  String?                   // for live tracking link
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([status, pickupAt])
  @@index([driverId, pickupAt])
}

model Quote {
  id             String   @id @default(cuid())
  inputHash      String                     // normalised journey input
  input          Json
  options        Json                       // [{vehicleClassId, pricePence, breakdown}]
  distanceMeters Int
  durationSec    Int
  expiresAt      DateTime                   // now + 30 min
}

model Payment {
  id                    String @id @default(cuid())
  bookingId             String
  stripePaymentIntentId String @unique
  amountPence           Int
  status                PaymentStatus     // requires_action, succeeded, failed, refunded, partially_refunded
  kind                  PaymentKind       // initial, top_up, waiting_charge
}

model BookingEvent {
  id        String   @id @default(cuid())
  bookingId String
  type      String     // status_changed, driver_assigned, amended, note, flight_updated
  from      String?
  to        String?
  actor     String     // system | admin:<id> | driver:<id> | customer
  data      Json?
  at        DateTime @default(now())
}

model DriverLocation {
  driverId  String
  bookingId String?
  lat       Float
  lng       Float
  heading   Float?
  speed     Float?
  at        DateTime @default(now())
  @@index([driverId, at])
}
```

**Conventions:** money in integer pence; times in UTC (`timestamptz`), shown in `Europe/London`; phone numbers E.164; soft-delete only for drivers/vehicles; `DriverLocation` rows older than 30 days are deleted (privacy), latest position also kept in memory.

### Booking state machine

```
draft → pending_payment ──(webhook succeeded)──► confirmed
            │                                        │
            └─(failed/expired)─► payment_failed      ▼
                                              driver_assigned
                                                     ▼
                                              driver_en_route
                                                     ▼
                                              driver_arrived ──► no_show
                                                     ▼
                                              passenger_on_board
                                                     ▼
                                                 completed
  confirmed / driver_assigned ──► cancelled_by_customer | cancelled_by_operator ──► refunded
```

Transitions live in one function in `packages/shared` (`canTransition(from, to, actor)`) used by API, admin and driver app. Every change writes a `BookingEvent`.

---

## 6. API design (REST, `/v1`)

| Method & path | Who | Purpose |
|---|---|---|
| `GET /v1/places/autocomplete?q=&session=` | public | Proxy to Google Places (keeps key server-side, adds airport shortcuts) |
| `GET /v1/flights/:number?date=` | public | Flight lookup → terminal, scheduled/estimated arrival |
| `POST /v1/quotes` | public | Journey → prices for every vehicle class; returns `quoteId`, expiry |
| `POST /v1/bookings` | public | `quoteId` + vehicle class + passenger details → booking `pending_payment` + Stripe `clientSecret` |
| `GET /v1/bookings/:ref` | magic token / customer | View booking |
| `PATCH /v1/bookings/:ref` | magic token / customer | Amend (re-quotes, may create top-up) |
| `POST /v1/bookings/:ref/cancel` | magic token / customer | Cancel per policy, triggers refund |
| `POST /v1/manage/request-link` | public | Email a manage link (ref + email) |
| `GET /v1/track/:token` | public (token) | Tracking snapshot; then join WS room |
| `POST /v1/webhooks/stripe` | Stripe | Payment events (signature verified, idempotent) |
| `GET/POST/PATCH /v1/admin/...` | admin | Bookings, assign, refunds, pricing, drivers, vehicles, promo codes, content |
| `POST /v1/driver/auth/login` | driver | JWT pair |
| `GET /v1/driver/jobs` | driver | Assigned/offered jobs |
| `POST /v1/driver/jobs/:id/accept` · `/decline` | driver | Job offer response |
| `POST /v1/driver/jobs/:id/status` | driver | en_route / arrived / on_board / completed / no_show |
| `POST /v1/driver/location` | driver | Batched location points (fallback if WS drops) |

**Rules:** Zod validates every request and response; OpenAPI is generated for the driver app client; errors use `{ error: { code, message, details } }`; mutating public endpoints accept an `Idempotency-Key` header; rate limits at Nginx and Fastify (`@fastify/rate-limit`), stricter on quotes and autocomplete.

### WebSocket channels
- Driver app connects with JWT → emits `location` every 5–10 s while on a job.
- API stores the latest point, appends to `DriverLocation` (throttled), and broadcasts to room `booking:<id>`.
- Tracking page and admin dispatch map subscribe to that room. Tracking is only live from 30 min before pickup until completion.

---

## 7. Key flows

### 7.1 Quote
1. Web debounces autocomplete (300 ms) with a Places session token.
2. `POST /v1/quotes` → API resolves places (lat/lng, postcode, airport/terminal) → finds zones.
3. Pricing engine: fixed `RoutePrice` match? use it. Else get distance/duration from Google Routes (cached by rounded origin/destination for 7 days) → distance formula.
4. Apply vehicle multipliers, surcharges (airport, drop-off charge, night, stops), return discount, promo → round to £1.
5. Save `Quote` (30 min expiry), return options. Target p95 < 800 ms.

### 7.2 Book and pay
1. `POST /v1/bookings` re-validates the quote (not expired, input unchanged), checks lead time and capacity rules, creates `Booking(pending_payment)` and a Stripe PaymentIntent (amount from the server, `metadata.bookingId`, idempotency key).
2. Web mounts Stripe Payment Element with `clientSecret`; 3-D Secure handled by Stripe.
3. **Webhook `payment_intent.succeeded`** → `confirmed`, enqueue jobs: confirmation email + SMS, admin alert, flight watch, reminders. The redirect page only reads status; it never confirms.
4. `pending_payment` older than 1 h → `payment_failed` (cleanup job).

### 7.3 Flight tracking (worker)
- For airport pickups: poll the flight API at T-24h, T-6h, then every 15 min from T-3h until landed (keeps API cost low).
- Delay > 15 min → move `pickupAt` (landing + buffer), log event, notify driver/admin. Customer is told "your driver will wait for you".

### 7.4 Dispatch
- Phase 1: admin assigns driver + vehicle; driver gets job SMS with details; customer gets driver name, car, plate and phone 2 h before pickup (or at assignment if later).
- Phase 3: offer to driver in app → accept within N minutes or offered to next; admin can always override.

### 7.5 Cancellation and refund
- Customer cancel ≥ 24 h before pickup → full Stripe refund; inside window → no refund (admin override possible).
- Operator cancel → full refund + apology template.
- Amend with price increase → second PaymentIntent (`top_up`); decrease → partial refund.

### 7.6 Notifications (worker jobs)

| Event | Customer | Driver | Admin |
|---|---|---|---|
| Booking confirmed | Email + SMS | — | Email/Slack |
| Driver assigned | — | SMS / app push | — |
| 2 h before pickup | SMS with driver, car, plate, tracking link | Reminder | — |
| Driver arrived | SMS + meeting point | — | — |
| Flight delayed | SMS ("we'll wait") | App/SMS new time | Dashboard flag |
| Completed | Receipt email + review request (phase 2) | — | — |
| Cancelled / refunded | Email | Notice | Email |

All sends go through `NotificationLog` (dedupe key per booking + event) so retries never double-send.

---

## 8. Frontend design

- **Rendering:** marketing pages SSG with ISR (revalidate on admin price/content change via on-demand revalidation). Booking steps are client components inside a server shell. Admin is client-heavy under `/admin`, `noindex`, behind auth.
- **Route pages:** generated from `content/routes.yaml` + `RoutePrice` table at build time (`generateStaticParams`); each has unique title/meta, price table, journey time, meeting point, FAQ, schema.org.
- **Quote widget:** one component reused in hero, airport pages and ad landers; state in URL query params so quotes are shareable and back-button safe.
- **Performance:** `next/image`, self-hosted fonts, no heavy map on landing (load Google Maps JS only on tracking/admin), third-party scripts deferred, analytics cookieless (Plausible/Umami) or consented GA4.
- **SEO extras:** `sitemap.xml` and `robots.txt` via Next metadata routes, canonical URLs, breadcrumbs, `LocalBusiness`/`Service`/`FAQPage` JSON-LD, Open Graph images.

---

## 9. Deployment on the Pulsar VPS

### Memory budget (2 GB)

| Process | Target RSS |
|---|---|
| Ubuntu + sshd + journald | ~250 MB |
| Nginx | ~20 MB |
| PostgreSQL (shared_buffers 256 MB, work_mem 4 MB, max_connections 30) | ~350–450 MB |
| Next.js `web` (standalone output, `--max-old-space-size=384`) | ~250–350 MB |
| Fastify `api` (`--max-old-space-size=256`) | ~120–180 MB |
| `worker` (`--max-old-space-size=192`) | ~100–150 MB |
| Headroom + page cache | ~400 MB |
| Swap file | 2 GB (vm.swappiness=10) |

**Never run `next build` on the server.** Build in GitHub Actions and ship artefacts. If memory runs tight, first move Postgres to a managed DB or upgrade the VPS (Pulsar → Quasar).

### Server setup
- Ubuntu 24.04 LTS, non-root deploy user, SSH keys only, `ufw` (22, 80, 443), `fail2ban`, unattended security upgrades.
- Node 22 LTS, PostgreSQL 16 (listening on localhost only), Nginx, Certbot (Let's Encrypt, auto-renew).
- Nginx: HTTP→HTTPS, HSTS, brotli/gzip, long cache for `/_next/static`, proxy `/` → `web:3000`, `/v1` and `/socket.io` → `api:4000` (WebSocket upgrade headers), `limit_req` zones for `/v1/quotes` and `/v1/places`.
- systemd units for `web`, `api`, `worker` with `Restart=always`, `MemoryMax`, env from `/etc/capitallanes/*.env` (chmod 600).

### CI/CD (GitHub Actions)
1. On PR: install, lint, typecheck, unit tests (pricing engine, state machine), build.
2. On merge to `main`: build, run Prisma migrations against production via SSH (`prisma migrate deploy`), rsync release to `/srv/capitallanes/releases/<sha>`, switch `current` symlink, `systemctl reload`/restart, health check `/v1/health`, auto-rollback symlink on failure.
3. Staging: a second database and ports on the same VPS only if memory allows; otherwise preview the web on Vercel against a staging API.

### Backups and recovery
- Nightly `pg_dump` (compressed, encrypted with `age`) → Backblaze B2/S3, keep 14 daily + 8 weekly; WAL archiving optional later.
- Weekly restore test into a scratch DB (scripted).
- `/etc/capitallanes` and Nginx config in the repo (`infra/`), secrets kept outside the repo.
- RPO 24 h (v1), RTO < 2 h (rebuild VPS from script + restore).

### Monitoring
- Uptime check on `/` and `/v1/health` (UptimeRobot/Better Stack), alerts to email/WhatsApp.
- Sentry for web, API, worker, driver app.
- Daily job: failed payments, stuck `pending_payment`, unassigned bookings within 12 h → admin email.
- Disk, memory and Postgres size alerts (simple cron + email, or Netdata if RAM allows).

---

## 10. Security and compliance

| Area | Control |
|---|---|
| Transport | TLS everywhere, HSTS, secure cookies (`Secure; HttpOnly; SameSite=Lax`) |
| Payments | Card data never touches our servers (Stripe Elements, SAQ A); webhook signature check; amounts only from server |
| Auth | Argon2id passwords, TOTP 2FA for admins, short JWT (15 min) + rotating refresh for drivers, magic-link tokens hashed and expiring |
| Authorisation | Role checks per route (`admin`, `dispatcher`, `driver`); drivers can only see their own jobs |
| Input | Zod validation, Prisma parameterised queries, output encoding, strict CSP |
| Abuse | Rate limits on quotes/autocomplete/manage-link, Cloudflare Turnstile on contact and manage forms, Google API key restricted to server IP |
| Secrets | Env files outside repo, GitHub Actions secrets, rotate on staff change |
| Privacy (UK GDPR) | Privacy policy, cookie consent, location data kept 30 days, booking data per retention policy (e.g. 6 years for accounting), data export/delete on request |
| Licensing | TfL operator record-keeping: booking records (date, time, pickup, driver, vehicle) kept as required; driver/vehicle licence expiry tracked with alerts |
| Server | SSH keys only, ufw, fail2ban, automatic security updates, Postgres not public |

---

## 11. Driver app readiness checklist (built into phase 1)
- [x] Separate `/v1` API with OpenAPI spec and shared Zod types
- [x] Booking state machine shared across clients, actor recorded on every change
- [x] Driver and Vehicle tables with licence numbers and expiry dates
- [x] Assignment endpoints in admin
- [x] `trackTokenHash` on Booking and `DriverLocation` table
- [ ] Driver auth + jobs endpoints (phase 3)
- [ ] WebSocket location stream + tracking page (phase 3)
- [ ] Push notifications (Expo push) (phase 3)

---

## 12. Testing strategy
- **Unit:** pricing engine (table of route cases incl. Heathrow → Central London), state machine, cancellation rules.
- **Integration:** API with a test Postgres (Testcontainers or a CI service), Stripe in test mode with `stripe-cli` webhook forwarding.
- **E2E:** Playwright: quote → book → pay (test card) → confirmation → manage → cancel.
- **SEO checks:** build-time test that every public page has a unique title/meta and canonical, and renders content without JS.
- **Load:** k6 on `/v1/quotes` to confirm p95 < 800 ms at expected peak on the VPS.

---

## 13. Open technical decisions
1. Prisma vs Drizzle (Prisma recommended for speed of development; Drizzle if memory/cold start matters).
2. Google Maps vs Mapbox/OS Places (Google has the best UK airport/POI coverage; check cost at expected volume).
3. Flight data provider and plan (AeroDataBox is cheaper; FlightAware more reliable).
4. Self-host Postgres on the VPS vs managed (e.g. Neon/Supabase free tier) to save RAM.
5. Twilio vs a UK SMS provider (cost per SMS).
