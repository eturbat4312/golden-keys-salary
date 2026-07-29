# Golden Keys Salary

Small internal work-hours and salary tracking MVP for 2-3 employees.

## Features

- Admin email/password login through Supabase Auth.
- Boss email/password login through Supabase Auth with read-only access.
- Employees do not have accounts.
- Employee management with deactivation.
- Work entry and payment CRUD.
- CHF salary calculations from source records only.
- Weekly, monthly, and custom date filters.
- WhatsApp button for sending the current report text to the boss.
- PWA-ready Vite build for Cloudflare Pages.

## Setup

1. Create a Supabase project.
2. Run all SQL files in `supabase/migrations/` in filename order.
3. Create the admin user in Supabase Auth.
4. Set the admin profile role to `admin`.
5. Create the boss user in Supabase Auth.
6. Set the boss profile role to `boss`.
7. Copy `.env.example` to `.env` and fill in the values.
8. Install and run:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);

update public.profiles
set role = 'boss'
where id = (
  select id from auth.users where email = 'boss@example.com'
);
```

```bash
npm install
npm run dev
```

Boss opens the app from:

```text
https://your-site.pages.dev/boss
```

`VITE_BOSS_WHATSAPP_NUMBER` should be the international phone number without `+`, for example `41788664979`.
