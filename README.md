# Golden Keys Salary

Small internal work-hours and salary tracking MVP for 2-3 employees.

## Features

- Admin email/password login through Supabase Auth.
- Employees do not have accounts.
- Boss uses a simple username/password gate plus a private `/boss/:token` read-only report link backed by a Supabase `security definer` RPC.
- Employee management with deactivation.
- Work entry and payment CRUD.
- CHF salary calculations from source records only.
- Weekly, monthly, and custom date filters.
- WhatsApp button for sending the current report text to the boss.
- PWA-ready Vite build for Cloudflare Pages.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202607290001_initial_schema.sql`.
3. Create the admin user in Supabase Auth.
4. Set the admin profile role to `admin` if needed.
5. Insert a boss report token:

```sql
insert into public.public_report_links (label, token_hash)
values ('Boss report', crypt('make-a-long-random-token', gen_salt('bf')));
```

6. Copy `.env.example` to `.env` and fill in the values.
7. Install and run:

```bash
npm install
npm run dev
```

Boss opens the app from:

```text
https://your-site.pages.dev/boss
```

`VITE_BOSS_WHATSAPP_NUMBER` should be the international phone number without `+`, for example `41788664979`.

Boss login defaults:

```text
VITE_BOSS_USERNAME=boss
VITE_BOSS_PASSWORD=123
```
# golden-keys-salary
