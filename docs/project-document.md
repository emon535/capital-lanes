# CapitalLanes — Project Document

_Landing page + booking website. Version 0.1, 20 November 2026. Companion to [system-design.md](./system-design.md). Built on the findings in [research/competitors.md](../research/competitors.md)._

---

## 1. Summary

CapitalLanes is a UK private hire company focused on **pre-booked airport transfers** (cars with drivers, not self-drive). The first deliverable is a fast, SEO-strong marketing website with a **native instant-quote and booking flow**, an admin/dispatch panel, and an API designed from day one to serve a **driver app** and **customer live tracking** later.

**Positioning in one line:** _"The fixed price you see is the price you pay, and you can watch your driver arrive."_

Why this wins (from competitor research):

| Market gap | CapitalLanes answer |
|---|---|
| Small operators use a flaky third-party iframe widget (autocomplete down, "Map Authentication Failed") | Native quote widget in the hero: price in under 10 s, booked in under 60 s |
| Prices hidden or contradictory ("from £45" vs £90) | Published per-route, per-vehicle price tables with "includes" list and a "prices last checked" date |
| No real live tracking or working app among the four named competitors | Live tracking link by SMS/WhatsApp on every ride, powered by the driver app |
| Inconsistent promises (15 vs 60 min wait, "all-inclusive" vs extra fees) | One promise block, one source of truth, reused on every page |
| Aircabio is client-rendered and invisible to Google | Server-rendered / statically generated pages for every airport, terminal and route |
| No licence numbers, thin reviews | TfL operator licence + company number in the footer, real review counts |

---

## 2. Goals and success measures

| Goal | Measure (first 6 months after launch) |
|---|---|
| Convert visitors to bookings | Quote-to-booking conversion ≥ 8%; quote shown in < 10 s on 4G |
| Rank for airport/route searches | 50+ indexed route pages; top-10 for 10 "[airport] to [area] airport transfer" terms |
| Fast and reliable | Lighthouse ≥ 90 mobile; LCP < 2.5 s; 99.5% uptime |
| Reduce phone/admin load | ≥ 70% of bookings fully online; self-service amend/cancel |
| Be ready for the driver app | All booking states and driver assignment exposed via a versioned API |

**Non-goals for v1:** self-drive car rental, a marketplace of other operators, native customer app (the web is mobile-first instead), multi-country coverage.

---

## 3. Users

| User | Needs |
|---|---|
| **Traveller (guest)** | Instant fixed price, enter flight number, pay by card/Apple Pay, confirmation and driver details, track the driver |
| **Returning customer** | Saved details and addresses, booking history, receipts |
| **Business booker** (phase 2) | Book for others, monthly invoice, multiple bookers |
| **Dispatcher / admin** | See all bookings, assign drivers, edit prices, issue refunds, manage fleet and drivers |
| **Driver** (phase 3, app) | Job list, accept/decline, navigation, status updates, share location |

---

## 4. Scope

### 4.1 MVP (Phase 1)

**Public website**
- Home with hero quote widget, promise block, price table, how it works, fleet, reviews, FAQ.
- Airport pages (Heathrow, Gatwick, Stansted, Luton, London City) + terminal sections.
- Route pages generated from data ("Heathrow to Central London airport transfer" etc.) with price table, journey time, FAQ.
- Fleet, Prices, About (licence, vetting), Contact, FAQ, Terms, Privacy, Cookie policy.
- Fully server-rendered/statically generated, structured data (LocalBusiness, Service, FAQPage, BreadcrumbList).

**Booking**
- One-way and return; airport, address and postcode autocomplete.
- Flight-number lookup for airport pickups (auto terminal + landing time; pickup = landing + chosen buffer).
- Instant quote for every vehicle class on one screen.
- Extras: child/booster seats (free), extra stop, meet & greet name board (included), extra luggage.
- Passenger details, lead passenger mobile, notes for driver.
- Payment by Stripe (card, Apple Pay, Google Pay). Pay in full at booking.
- Confirmation page + email + SMS; booking reference; "Manage booking" link.

**Manage booking (no login needed)**
- Look up by reference + email (magic link). View, amend (within rules), cancel, download receipt.

**Admin panel**
- Bookings list with filters and status, booking detail, manual booking, assign driver/vehicle, refund.
- Pricing editor (zones, fixed routes, vehicle multipliers, surcharges).
- Drivers and vehicles (with licence and expiry dates), customers, promo codes, content of the promise block.

### 4.2 Phase 2 — Accounts and growth
- Customer accounts (passwordless email login), saved passengers and addresses.
- Business accounts: invoices, multiple bookers, cost centres.
- WhatsApp notifications; review requests after the ride.
- Blog/guides (drop-off charges 2026, Heathrow terminal guide, private hire vs Elizabeth line).
- Comparison pages (vs Uber, vs Addison Lee). Ad landing pages per airport.
- Promo codes and referral credit.

### 4.3 Phase 3 — Driver app and live tracking
- Driver app (React Native / Expo): job offers, accept, status ("on the way", "arrived", "passenger on board", "completed"), navigation hand-off, background location.
- Customer live tracking page (link by SMS/WhatsApp) with map, ETA, driver photo, car and plate.
- Automatic flight-delay handling (pickup time moves with the flight).
- Driver earnings view, document expiry reminders.

### 4.4 Phase 4 — Optional
- Customer mobile app (wrap of the same API), corporate API, aggregator listing (minicabit), dynamic pricing experiments, multi-language pages.

---

## 5. Sitemap and pages

```
/                                   Home (hero quote widget)
/book                               Booking flow (steps 1–4)
/book/confirmation/[ref]            Confirmation
/manage                             Find my booking
/manage/[ref]                       View / amend / cancel (magic link)
/track/[token]                      Live tracking (phase 3)
/airports                           All airports
/airports/[airport]                 e.g. /airports/heathrow (terminals, prices, meeting point)
/[airport]-to-[area]-transfer       Route pages, generated from data
/prices                             Full price table, all airports × vehicle class
/fleet                              Vehicle classes (pax, luggage, examples)
/business                           Business accounts (phase 2)
/about                              Company, TfL licence, driver vetting
/reviews                            Reviews with counts and source
/faq                                FAQ
/contact                            Phone, WhatsApp, email, form
/guides/[slug]                      Guides/blog (phase 2)
/terms  /privacy  /cookies          Legal
/admin/*                            Admin panel (no-index, auth)
```

### Home page sections (top to bottom)
1. **Hero:** headline, sub-line, quote widget (From, To, Date, Time, Passengers, Luggage, Return toggle) → "Get prices".
2. **Promise strip:** fixed all-in fare · 60 min free airport waiting · flight tracking · meet & greet · free cancellation up to 24 h · free child seats.
3. **Popular routes price table** (Heathrow/Gatwick/Stansted/Luton/City to Central London etc., per vehicle class).
4. **How it works:** Get price → Add flight → Meet your driver → Track your ride.
5. **Fleet:** Saloon, Estate, Executive, MPV 6, MPV 8 (pax/luggage icons).
6. **Reviews** (real, with source and count).
7. **Airports** grid linking to airport pages.
8. **FAQ** (with FAQPage schema).
9. **Footer:** TfL operator licence no., company no., address, phone, WhatsApp, payment icons.

---

## 6. Booking flow

```
1. Journey      From / To (autocomplete, airports & terminals), date, time,
                passengers, luggage, one-way/return
                        │
2. Choose car   All vehicle classes with fixed price, pax/luggage limits,
                "includes" list. Unsuitable classes greyed out.
                        │
3. Details      Lead passenger name, mobile, email; flight number (airport
                pickup) → landing time + terminal; pickup buffer; child seats;
                notes; extra stops; promo code
                        │
4. Pay          Summary + T&Cs tick → Stripe Payment Element
                (card, Apple Pay, Google Pay) → 3-D Secure if needed
                        │
5. Confirmed    Reference, summary, add to calendar, manage link.
                Email + SMS sent. Admin notified.
```

**Rules**
- A quote is valid for 30 minutes and is re-priced server-side at payment (never trust the client price).
- Minimum lead time: 3 hours online (configurable); shorter → "call us / WhatsApp".
- Airport pickups: driver waits 60 min after **actual** landing at no charge; after that, waiting is billed per started 15 min (rate set in admin).
- Free cancellation up to 24 h before pickup (consider 12 h to beat most competitors). Inside the window: no refund unless the admin overrides.
- Amendments: allowed until 24 h before pickup; a price change creates a top-up payment or partial refund.
- Return trips are stored as two linked bookings so each can be dispatched separately.

### Booking statuses
`draft → pending_payment → confirmed → driver_assigned → driver_en_route → driver_arrived → passenger_on_board → completed`
Side exits: `cancelled_by_customer`, `cancelled_by_operator`, `no_show`, `payment_failed`, `refunded`.

---

## 7. Pricing model

Fixed fares, decided before the ride, all-in.

1. **Fixed route prices** (airport ↔ zone) take priority, edited in admin. Example zones: Central London (Zone A), Inner London, Outer London, Home Counties.
2. **Distance fallback** for anything else: `base fare + per-mile rate × route miles (via Google Routes)`, with a minimum fare.
3. **Vehicle class multiplier** (Saloon 1.0, Estate 1.1, Executive 1.45, MPV 6 1.6, MPV 8 2.0 as a starting point).
4. **Surcharges:** airport pickup/parking, airport drop-off charge (Heathrow £7, Gatwick £10, London City £8 as of 2026; check before launch), night (e.g. 23:00–05:00), extra stop, Congestion Charge policy (decide: absorb or include visibly; never add at checkout).
5. **Return discount** (e.g. 5%) and promo codes.
6. Round to the nearest £1. Show "Includes VAT, parking, drop-off charge, 60 min waiting".

**Launch price benchmark:** Heathrow → Central London saloon in the market is £56–69. Set the launch saloon price inside or just under that band, and publish it.

---

## 8. Content and trust checklist
- [ ] TfL Private Hire Operator licence number (footer, About, Terms)
- [ ] Company number and registered address
- [ ] Driver vetting explained (TfL PHV licence, DBS, insurance)
- [ ] Real reviews with platform and count (Google, Trustpilot)
- [ ] One promise block, same wording everywhere (managed in admin)
- [ ] Clear cancellation, waiting and cash policy in plain English
- [ ] Meeting point instructions per terminal (with photos later)
- [ ] Unique meta title/description per page; no placeholder text anywhere

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Lighthouse mobile ≥ 90; JS for the quote widget < 100 KB gzipped; images in AVIF/WebP |
| SEO | SSR/SSG for all public pages, sitemap.xml, robots.txt, canonical URLs, schema.org, no client-only content |
| Accessibility | WCAG 2.2 AA; keyboard-usable date/time pickers |
| Security | HTTPS only, OWASP top 10, Stripe handles card data (SAQ A), admin 2FA |
| Privacy | UK GDPR: cookie consent for analytics, privacy policy, data retention rules |
| Hosting | Fits Namecheap VPS Pulsar (2 vCPU, 2 GB RAM) with headroom; daily off-site backups |
| Reliability | Booking never lost: payment webhook is the source of truth; idempotent handlers |

---

## 10. Roadmap

| Phase | Weeks (indicative) | Output |
|---|---|---|
| 0. Foundations | 1–2 | Brand, copy, price list, licence details, repo, CI, VPS hardening |
| 1a. Website | 3–5 | Design system, home, airport, route, fleet, prices, legal pages (SSG) |
| 1b. Booking | 5–8 | Quote engine, booking flow, Stripe, emails/SMS, manage booking |
| 1c. Admin | 7–9 | Bookings, dispatch, pricing editor, drivers/vehicles |
| 1d. Launch | 10 | QA, load test, Search Console, analytics, go-live |
| 2. Growth | 11–16 | Accounts, business, WhatsApp, guides, reviews, ad landers |
| 3. Driver app | 17–26 | Expo driver app, live tracking page, flight-delay automation |

---

## 11. Decisions needed from Emon

1. Launch airports and service area, and the operating base.
2. Vehicle classes at launch and real vehicles.
3. TfL operator licence status and number; company number.
4. Price list for the top 20 routes per vehicle class.
5. Cancellation window: 24 h or 12 h. Congestion Charge: absorb or show.
6. Cash: allowed or card-only (recommend card-only online, cash by arrangement).
7. Brand assets: logo, colours, photos of real vehicles.
8. Email/SMS providers and the business phone/WhatsApp number.

## 12. Risks

| Risk | Mitigation |
|---|---|
| 2 GB RAM too tight | Build in CI, not on the server; tune Postgres; swap file; clear upgrade path |
| Map/API costs grow (Google Places/Routes) | Session tokens, debounce, cache routes per zone pair, fixed-price table first |
| Payment disputes / no-shows | Clear T&Cs, 3-D Secure, driver "arrived" timestamp + location as evidence |
| Thin content penalised | Route pages only where a real price and useful local info exist |
| Driver app slips | Phase 1 dispatch works from admin + SMS; app adds value, not dependency |
