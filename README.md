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
| Auth | [Clerk](https://clerk.com) (`@clerk/nextjs` v7) |
| Backend / Database | [Convex](https://convex.dev) (real-time DB + server functions) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) |
| Animation | [Framer Motion](https://motion.dev) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |
| Webhooks | [Svix](https://svix.com) |
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
      account/     User account (orders, downloads)
      cart/        Shopping cart
      checkout/    Checkout flow
      contact/     Contact page
      resources/   Blog / content
      store/       Product listing + [slug] detail
    admin/         Admin dashboard
      analytics/   Analytics & charts
      categories/  Category management
      coupons/     Discount coupons
      customers/   Customer list
      downloads/   Download management
      email/       Email / newsletter
      media/       Media library
      orders/      Order management
      payments/    Payment records
      products/    Product CRUD
      reports/     Reports
      reviews/     Review moderation
      settings/    Site settings
      support/     Support tickets
      users/       User management
    sign-in/       Clerk sign-in pages
    sign-up/       Clerk sign-up pages
  components/
    admin/         Admin-specific components
    home/          Home page sections (hero, featured, etc.)
    layout/        Header, footer, navigation, providers
    product/       Product card, stars
    store/         Store-specific components
    ui/            Reusable UI primitives (button, card, table, etc.)
  lib/             Utilities, convex client, admin queries

convex/
  schema.ts        Database schema (14 tables)
  users.ts         User CRUD + admin checks
  products.ts      Product CRUD
  orders.ts        Order management
  customers.ts     Customer management
  reviews.ts       Review moderation
  categories.ts    Category management
  coupons.ts       Coupon management
  pages.ts         CMS pages
  mediaFiles.ts    Media file records
  storage.ts       File upload/download + storage
  settings.ts      Key-value settings
  subscribers.ts   Newsletter subscribers
  notifications.ts Admin notifications
  clerk.ts         Clerk metadata sync
  http.ts          Clerk webhook handler
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
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain |
| `CONVEX_DEPLOY_KEY` | Convex deployment key |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CLERK_WEBHOOK_SECRET` | Svix webhook signing secret |

---

## Key Features (Phase 1)

- Digital products store with instant download delivery
- Mobile money (MTN MoMo, Airtel Money) and card payments via Flutterwave/Pesapal
- Protected download links with expiry and download limits
- Coupon / discount code support
- Email newsletter capture (MailerLite integration)
- Blog / resources section
- Admin dashboard for product, order, customer, and media management
- Google Analytics 4 and Meta Pixel ready
- Role-based access (admin / customer)
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
