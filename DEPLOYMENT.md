# Deployment Guide — Sri Varahi Building Solutions

## 1. Supabase (production project)

1. Create a new project at supabase.com (choose a region close to Vijayawada,
   e.g. `ap-south-1` / Mumbai, for lowest latency).
2. In the SQL Editor, run in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_views.sql`
3. **Authentication → Providers**: ensure Email is enabled; disable public
   sign-ups if the option is available (`Authentication → Settings →
   Disable new user signups`), since this app has exactly one owner and new
   users should only ever be created manually by you.
4. **Authentication → Users → Add User**: create the owner's login
   (email + password). This immediately creates their `businesses` row via
   the `handle_new_user()` trigger.
5. (Optional) Run `supabase/seed.sql` in the SQL Editor to load demo data —
   skip this step for the real production launch.
6. Note down, from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New Project** → import the repository.
3. Framework preset: Next.js (auto-detected).
4. **Environment Variables** (Production + Preview):
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase Project Settings → API |
5. Deploy.
6. Once live, sign in at `https://your-app.vercel.app/login` with the owner
   credentials created in Supabase step 4.

## 3. Post-Deployment Checklist

- [ ] Sign in successfully and confirm the dashboard loads with your business
      name (Settings page, or it defaults to "Sri Varahi Building
      Solutions").
- [ ] Go to **Settings** and fill in the real business address, phone,
      email, and confirm currency is `INR`.
- [ ] Add your real employees (**Employees**).
- [ ] Add your real product catalog with accurate default purchase/selling
      prices (**Products**).
- [ ] Create one test bill on **Sales → New Sale**, confirm the totals and
      profit calculate as expected, then void it (don't leave test data in
      real reports).
- [ ] Download a **Settings → Database Backup** immediately after go-live,
      and periodically thereafter (weekly recommended) — this is a
      single-owner app with no separate backend admin, so this JSON export
      is your disaster-recovery copy.
- [ ] Bookmark `/reports` for month-end and daily EOD printing.

## 4. Ongoing Maintenance

- **Database migrations**: any future schema change should be added as a new
  numbered file in `supabase/migrations/` and run manually via the SQL
  Editor (or `supabase db push` if you set up the CLI + linked project).
- **Type regeneration**: after any schema change, regenerate
  `types/database.types.ts` — either hand-edit to match, or run
  `npm run db:types` if you have the Supabase CLI authenticated locally
  with `SUPABASE_PROJECT_ID` set.
- **Backups**: Supabase takes automatic daily backups on paid plans, but the
  in-app **Settings → Download Backup** JSON export is a fast, portable
  supplement you control directly.
