create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'boss');
create type public.payment_method as enum ('cash', 'bank', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  default_hourly_rate numeric(10, 2) not null default 0 check (default_hourly_rate >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  work_date date not null,
  hours numeric(8, 2) not null check (hours > 0),
  hourly_rate numeric(10, 2) not null check (hourly_rate >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  payment_date date not null,
  amount numeric(10, 2) not null check (amount > 0),
  payment_method public.payment_method not null default 'cash',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create table public.public_report_links (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Boss report',
  token_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index employees_active_idx on public.employees(is_active);
create index work_entries_employee_date_idx on public.work_entries(employee_id, work_date desc);
create index payments_employee_date_idx on public.payments(employee_id, payment_date desc);
create index public_report_links_active_idx on public.public_report_links(is_active);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger employees_touch_updated_at before update on public.employees
for each row execute function public.touch_updated_at();

create trigger work_entries_touch_updated_at before update on public.work_entries
for each row execute function public.touch_updated_at();

create trigger payments_touch_updated_at before update on public.payments
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.work_entries enable row level security;
alter table public.payments enable row level security;
alter table public.public_report_links enable row level security;

create policy "admins read profiles" on public.profiles
for select to authenticated
using (public.is_admin());

create policy "admins update own profile" on public.profiles
for update to authenticated
using (id = auth.uid() and public.is_admin())
with check (id = auth.uid() and public.is_admin());

create policy "admins read employees" on public.employees
for select to authenticated
using (public.is_admin());

create policy "admins write employees" on public.employees
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins read work entries" on public.work_entries
for select to authenticated
using (public.is_admin());

create policy "admins write work entries" on public.work_entries
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins read payments" on public.payments
for select to authenticated
using (public.is_admin());

create policy "admins write payments" on public.payments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage public report links" on public.public_report_links
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_public_report(link_token text, start_date date, end_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_valid boolean;
  result jsonb;
begin
  select exists (
    select 1
    from public.public_report_links
    where is_active = true
      and token_hash = extensions.crypt(link_token, token_hash)
  ) into is_valid;

  if not is_valid then
    raise exception 'invalid_report_link' using errcode = '28000';
  end if;

  with selected_work as (
    select we.*, e.name employee_name
    from public.work_entries we
    join public.employees e on e.id = we.employee_id
    where we.work_date between start_date and end_date
  ),
  selected_payments as (
    select p.*, e.name employee_name
    from public.payments p
    join public.employees e on e.id = p.employee_id
    where p.payment_date between start_date and end_date
  ),
  employee_summary as (
    select
      e.id employee_id,
      e.name employee_name,
      coalesce(sum(sw.hours), 0)::numeric total_hours,
      coalesce(sum(sw.hours * sw.hourly_rate), 0)::numeric total_earned,
      coalesce((select sum(sp.amount) from selected_payments sp where sp.employee_id = e.id), 0)::numeric total_paid
    from public.employees e
    left join selected_work sw on sw.employee_id = e.id
    group by e.id, e.name
  )
  select jsonb_build_object(
    'range', jsonb_build_object('start', start_date, 'end', end_date),
    'totals', jsonb_build_object(
      'total_hours', coalesce(sum(es.total_hours), 0),
      'total_earned', coalesce(sum(es.total_earned), 0),
      'total_paid', coalesce(sum(es.total_paid), 0),
      'remaining_balance', coalesce(sum(es.total_earned - es.total_paid), 0)
    ),
    'summary', coalesce(jsonb_agg(
      jsonb_build_object(
        'employee_id', es.employee_id,
        'employee_name', es.employee_name,
        'total_hours', es.total_hours,
        'total_earned', es.total_earned,
        'total_paid', es.total_paid,
        'remaining_balance', es.total_earned - es.total_paid
      )
      order by es.employee_name
    ), '[]'::jsonb),
    'work_entries', coalesce((select jsonb_agg(to_jsonb(sw) || jsonb_build_object('employees', jsonb_build_object('name', sw.employee_name)) order by sw.work_date desc) from selected_work sw), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(to_jsonb(sp) || jsonb_build_object('employees', jsonb_build_object('name', sp.employee_name)) order by sp.payment_date desc) from selected_payments sp), '[]'::jsonb)
  )
  into result
  from employee_summary es;

  return result;
end;
$$;

grant execute on function public.get_public_report(text, date, date) to anon;

-- Create a boss report token after deploying the migration:
-- insert into public.public_report_links (label, token_hash)
-- values ('Boss WhatsApp report', extensions.crypt('replace-with-a-long-random-token', extensions.gen_salt('bf')));
-- Boss link format: https://your-cloudflare-pages-site.pages.dev/boss/replace-with-a-long-random-token
