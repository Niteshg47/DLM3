# Dental Lab Portal

Multi-tenant dental lab case management portal (Next.js 14, Prisma, PostgreSQL, NextAuth v5, next-intl).

## Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, etc.

2. Install and migrate:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

3. Run dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) — local dev uses tenant slug `demo` automatically.

## Demo accounts

| Role       | Email            | Password     |
|-----------|------------------|--------------|
| Admin     | admin@demo.lab   | password123  |
| Staff     | staff@demo.lab   | password123  |
| Doctor    | doctor@demo.lab  | password123  |

## Multi-tenant

- Production: `{labSlug}.dentallab.app`
- Local: set `DEV_TENANT_SLUG=demo` (default) on `localhost`

## Phase 1 deliverables

- Auth: password + magic link (Resend)
- Tenant middleware + row-level `tenantId`
- Lab dashboard with live stats + pipeline + audit feed
- Case CRUD (list, create, detail, status updates, print)
- Doctor portal (submit case, track own cases)

## Phase 2 deliverables

- **UI overhaul** — indigo sidebar, stat cards, striped tables, sky doctor portal, gradient login
- **Billing** — `/billing`, `/billing/new`, `/billing/[id]`, `/billing/[id]/edit`, PDF at `/api/invoices/[id]/pdf`, CSV export
- **Analytics** — `/analytics` (admin only), 6 Recharts + date range via `/api/analytics/summary`
- **Notifications** — bell in top bar; auto on case status change + invoice sent

## Scripts

- `npm run dev` — development
- `npm run db:migrate` — Prisma migrate
- `npm run db:seed` — seed demo tenant + 10 cases
- `npm run build` — production build
