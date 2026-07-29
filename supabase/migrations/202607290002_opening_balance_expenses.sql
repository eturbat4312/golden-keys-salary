alter table public.employees
add column if not exists opening_balance numeric(10, 2) not null default 0;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  amount numeric(10, 2) not null check (amount > 0),
  category text not null check (length(trim(category)) > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create index if not exists expenses_date_idx on public.expenses(expense_date desc);

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at before update on public.expenses
for each row execute function public.touch_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "admins read expenses" on public.expenses;
create policy "admins read expenses" on public.expenses
for select to authenticated
using (public.is_admin());

drop policy if exists "admins write expenses" on public.expenses;
create policy "admins write expenses" on public.expenses
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
  selected_expenses as (
    select ex.*
    from public.expenses ex
    where ex.expense_date between start_date and end_date
  ),
  employee_summary as (
    select
      e.id employee_id,
      e.name employee_name,
      coalesce(e.opening_balance, 0)::numeric opening_balance,
      coalesce(sum(sw.hours), 0)::numeric total_hours,
      coalesce(sum(sw.hours * sw.hourly_rate), 0)::numeric total_earned,
      coalesce((select sum(sp.amount) from selected_payments sp where sp.employee_id = e.id), 0)::numeric total_paid
    from public.employees e
    left join selected_work sw on sw.employee_id = e.id
    group by e.id, e.name, e.opening_balance
  )
  select jsonb_build_object(
    'range', jsonb_build_object('start', start_date, 'end', end_date),
    'totals', jsonb_build_object(
      'total_hours', coalesce(sum(es.total_hours), 0),
      'total_earned', coalesce(sum(es.total_earned), 0),
      'total_paid', coalesce(sum(es.total_paid), 0),
      'remaining_balance', coalesce(sum(es.opening_balance + es.total_earned - es.total_paid), 0),
      'total_expenses', coalesce((select sum(se.amount) from selected_expenses se), 0)
    ),
    'summary', coalesce(jsonb_agg(
      jsonb_build_object(
        'employee_id', es.employee_id,
        'employee_name', es.employee_name,
        'opening_balance', es.opening_balance,
        'total_hours', es.total_hours,
        'total_earned', es.total_earned,
        'total_paid', es.total_paid,
        'remaining_balance', es.opening_balance + es.total_earned - es.total_paid
      )
      order by es.employee_name
    ), '[]'::jsonb),
    'work_entries', coalesce((select jsonb_agg(to_jsonb(sw) || jsonb_build_object('employees', jsonb_build_object('name', sw.employee_name)) order by sw.work_date desc) from selected_work sw), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(to_jsonb(sp) || jsonb_build_object('employees', jsonb_build_object('name', sp.employee_name)) order by sp.payment_date desc) from selected_payments sp), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(to_jsonb(se) order by se.expense_date desc) from selected_expenses se), '[]'::jsonb)
  )
  into result
  from employee_summary es;

  return result;
end;
$$;

grant execute on function public.get_public_report(text, date, date) to anon;
