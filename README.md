# Sri Varahi Building Solutions — Sales & Profit Management System

A single-owner sales and profit tracker for a building materials store (paints,
steel, cement, tiles, hardware, plumbing, construction materials). Not an
ERP — no inventory, no payroll, no accounting. Just: record sales, know your
profit.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style
components · Supabase (Postgres + Auth) · React Hook Form + Zod · TanStack
Query/Table · Recharts · Framer Motion · Lucide Icons.

## Key Business Rules (read this before touching billing code)

1. **Prices are always editable at the point of sale.** Products carry
   *default* purchase/selling prices, but every bill line stores its own
   snapshot (`bill_items.purchase_price` / `selling_price`). Product master
   updates never change historical bills.
2. **Grand total can be manually overridden** (negotiated price) —
   `bills.grand_total` is independent of the computed subtotal-minus-discount.
3. **Bills lock after their creation day.** A bill can be freely edited or
   hard-deleted only on the calendar day it was created (enforced by a
   Postgres trigger, not just app logic — see `enforce_bill_lock()` in
   `supabase/migrations/0001_init.sql`). After that, it can only be **voided**
   (soft delete, excluded from revenue, kept for history).
4. **Credit = a bill with `balance_due > 0`.** There is no separate credit
   ledger to keep in sync — `v_credit_outstanding` derives it directly from
   `bills`.
5. **All profit math lives in one place:** `lib/billing/calculate.ts`. Both
   the live billing form and the `createBill`/`updateBill` Server Actions
   import from it, so the number the owner sees while billing is guaranteed
   to match what gets stored.

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Supabase Setup

1. Create a new Supabase project.
2. Run the migrations in order (SQL Editor, or `supabase db push` if you use
   the CLI):
   - `supabase/migrations/0001_init.sql` — tables, triggers, RLS
   - `supabase/migrations/0002_views.sql` — dashboard/report views
3. Create your owner login: **Authentication → Users → Add User** (email +
   password). The `handle_new_user()` trigger automatically creates your
   `businesses` row the moment that user exists.
4. Optional: run `supabase/seed.sql` in the SQL Editor to load realistic
   demo data (employees, products, a few bills, an advance order, expenses).
   Run this *after* creating your user, since it looks up the auto-created
   business row.
5. Copy your Project URL and anon public key into `.env.local`.

## Folder Structure

```
app/(auth)/login          Login page (Supabase Auth)
app/(app)/                Protected routes (dashboard, sales, products, ...)
actions/                  Server Actions, grouped by domain
components/                Feature components + shadcn-style ui/ primitives
lib/billing/calculate.ts  Shared profit/total math (single source of truth)
lib/validations/          Zod schemas shared by forms and Server Actions
supabase/migrations/      Numbered SQL migrations
supabase/seed.sql         Realistic demo data
```

## Deployment

See `DEPLOYMENT.md` for the full Vercel + Supabase production checklist.
