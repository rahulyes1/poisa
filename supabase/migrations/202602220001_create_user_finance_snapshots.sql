create table if not exists public.user_finance_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_finance_snapshots enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_finance_snapshots_updated_at on public.user_finance_snapshots;
create trigger trg_user_finance_snapshots_updated_at
before update on public.user_finance_snapshots
for each row
execute function public.touch_updated_at();

drop policy if exists "user_finance_snapshots_select_own" on public.user_finance_snapshots;
create policy "user_finance_snapshots_select_own"
on public.user_finance_snapshots
for select
using (auth.uid() = user_id);

drop policy if exists "user_finance_snapshots_insert_own" on public.user_finance_snapshots;
create policy "user_finance_snapshots_insert_own"
on public.user_finance_snapshots
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_finance_snapshots_update_own" on public.user_finance_snapshots;
create policy "user_finance_snapshots_update_own"
on public.user_finance_snapshots
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_finance_snapshots_delete_own" on public.user_finance_snapshots;
create policy "user_finance_snapshots_delete_own"
on public.user_finance_snapshots
for delete
using (auth.uid() = user_id);
