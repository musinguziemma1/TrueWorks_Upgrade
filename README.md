# TrueWorks Limited — Business Operating Systems

We build Business Operating Systems that help organizations operate better,
decide faster, and grow stronger.

**Website:** [trueworksgroup.com](https://trueworksgroup.com)  
**Phase:** 1 — Digital Products Store (Launch Version)  
**Version:** 0.1.0

---

## About

TrueWorks Limited is a Ugandan professional systems company. We sell premium,
ready-to-use digital products: Excel financial models, dashboards, KPI trackers,
budget systems, HR templates, SOP manuals, board presentation decks, and
specialized template packs for hospitals, NGOs, churches, schools, and farms.

**Primary customers:** Hospital administrators, finance managers, accountants,
NGO program staff, church administrators, school bursars, SME owners, and
consultants across Uganda, East Africa, and the wider African market.

### Positioning

TrueWorks is not an Excel template company. TrueWorks is not a consulting firm.
TrueWorks is a **Business Operating System** company. We build the operational
infrastructure that enables organizations to perform consistently at a high level.

| We are not | We are |
|---|---|
| Templates you fill in | Operating systems you run your business on |
| Advice you receive once | Standards embedded into daily operation |
| A tool for a task | Infrastructure for an organization |
| A one-off spreadsheet | A versioned, supported, evolving product line |

### Brand Pillars

- **Trusted** — Built on integrity and reliability.
- **Precise** — Systems that drive accurate results.
- **Powerful** — Tools that scale with your ambition.
- **Secure** — Protecting what matters most.
- **Global** — Solutions for every business, anywhere.

### Core Values

| Value | Meaning |
|---|---|
| **Truth** | We build systems based on reality, not assumptions. Data is respected, sources are cited, and figures reconcile. |
| **Excellence** | Everything we design reflects world-class quality. Nothing ships until it meets the standard. |
| **Simplicity** | Complexity is reduced into clarity. If a user needs a manual to begin, we have not finished designing. |
| **Innovation** | We continually improve how businesses operate, across Excel, web, mobile, and AI. |
| **Integrity** | Our systems earn trust because they are transparent and dependable. |
| **Stewardship** | We create solutions that endure — maintainable, documented, and owned. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Auth | First-party IAM (`convex/iam.ts`) — email/password, Google OAuth, TOTP MFA, server-side sessions (see `docs/IAM_ARCHITECTURE.md`) |
| Backend / Database | [Convex](https://convex.dev) (real-time DB + server functions) |
| Payments | [Stripe](https://stripe.com) (international cards) + [Pesapal](https://pesapal.com) (MTN MoMo, Airtel Money, cards) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) |
| Animation | [Framer Motion](https://motion.dev) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |
| Email | [Resend](https://resend.com) |
| Testing | [Vitest](https://vitest.dev) + `convex-test` (unit), [Playwright](https://playwright.dev) (E2E) |
| Spreadsheet parsing | [SheetJS](https://sheetjs.com) (`xlsx`) |

### Design System

- **Primary color:** Navy `#0B2545`
- **Secondary color:** Steel blue `#4A6FA5`
- **Accent color:** Gold `#C9A227`
- **Background:** White and light grey `#F2F5F9`
- **Headings font:** Playfair Display (Georgia-equivalent serif)
- **Body font:** Inter (clean humanist sans-serif)

---

## Project Structure

```
src/
  app/
    (site)/        Public storefront
      about/       About page
      account/     User account (orders, downloads, security/MFA)
      cart/        Shopping cart
      checkout/    Checkout flow (Stripe + Pesapal)
      contact/     Contact page
      resources/   Blog / content
      store/       Product listing + [slug] detail
    admin/         Admin dashboard
      analytics/   Analytics & charts
      categories/  Category management
      coupons/     Discount coupons
      customers/   Customer list
      downloads/   Download management
      email/       Email marketing / campaigns
      media/       Media library
      orders/      Order management
      payments/    Payment records
      products/    Product CRUD
      reports/     Reports
      reviews/     Review moderation
      settings/    Site settings
      support/     Support tickets
      users/       User & invitation management
    api/auth/      IAM auth endpoints (login, register, MFA, sessions)
    sign-in/       Sign-in pages
    sign-up/       Sign-up pages
  components/      admin/ hero/ home/ layout/ product/ store/ ui/
  lib/             Utilities, Convex client, first-party auth provider, admin queries
  proxy.ts         Auth middleware (validates tw_session against Convex /iam/me)

convex/
  schema.ts        Database schema (~35 tables)
  iam.ts           IAM HTTP handlers (login, register, MFA, sessions, JWKS)
  iamDb.ts         Fine-grained DB operations backing the IAM handlers
  lib/             tokens (JWT/hashing), sessions, mfa, password, audit, sanitize
  http.ts          HTTP router (payments webhooks, email endpoints)
  checkout.ts      Server-side checkout order creation (prices recomputed from DB)
  stripe.ts        Stripe payment intents + webhook settlement
  pesapal.ts       Pesapal mobile-money integration
  orders.ts        Order management
  products.ts      Product CRUD + catalog queries
  users.ts         User CRUD + RBAC helpers
  downloads.ts     Secure download grants (signed URLs on demand)
  ...              coupons, customers, reviews, campaigns, analytics, gdpr, etc.
  *.test.ts        Unit tests (vitest + convex-test)

docs/
  IAM_ARCHITECTURE.md   Identity & access management design
  IAM_SETUP.md          IAM operational setup notes

e2e/              Playwright smoke + commerce flow tests
tests/            CSP / route-protection preservation tests
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Lint
npm run lint

# Unit tests (Convex functions)
npm test

# E2E tests (requires a running dev server)
npm run test:e2e
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the client-side values.
Server-side secrets (IAM keys, Resend, Stripe, Pesapal, admin allowlists) live
on the Convex deployment — set them with `npx convex env set NAME value`.
See `.env.local.example` for the full annotated list.

---

## Key Features (Phase 1)

- Digital products store with instant download delivery
- Card payments via Stripe; MTN MoMo, Airtel Money and cards via Pesapal
- Protected downloads with expiry and download limits (signed URLs generated on demand)
- Coupon / discount code support
- Email newsletter capture and campaigns (Resend)
- First-party authentication: email/password, Google OAuth, TOTP MFA, recovery codes, server-side session management
- Blog / resources section
- Admin dashboard for product, order, customer, media, coupon and content management
- Google Analytics 4 and Meta Pixel ready
- Role-based access control (superadmin / owner / admin / editor / viewer) enforced server-side
- Automatic order confirmation and download emails

---

## Phase Roadmap

| Phase | Scope |
|---|---|
| **1 (Current)** | Digital products store, payments, instant delivery |
| **2** | Larger catalog, bundles, stronger Resources hub |
| **3** | Academy (courses), Consulting page with fixed-price packages |
| **4** | Memberships, research reports |

---

## License

Private — TrueWorks Limited. All rights reserved.
