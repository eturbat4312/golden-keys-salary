alter table public.profiles
alter column role set default 'boss';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'boss')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.can_read_reports()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'boss')
  );
$$;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "bosses read employees" on public.employees;
create policy "bosses read employees" on public.employees
for select to authenticated
using (public.can_read_reports());

drop policy if exists "bosses read work entries" on public.work_entries;
create policy "bosses read work entries" on public.work_entries
for select to authenticated
using (public.can_read_reports());

drop policy if exists "bosses read payments" on public.payments;
create policy "bosses read payments" on public.payments
for select to authenticated
using (public.can_read_reports());

drop policy if exists "bosses read expenses" on public.expenses;
create policy "bosses read expenses" on public.expenses
for select to authenticated
using (public.can_read_reports());

revoke execute on function public.get_public_report(text, date, date) from anon;
