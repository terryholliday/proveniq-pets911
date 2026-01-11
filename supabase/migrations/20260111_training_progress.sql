-- Training progress persistence (module-level completions)

create table if not exists public.training_module_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  completed_at timestamptz not null default now(),
  score integer null,
  created_at timestamptz not null default now()
);

create unique index if not exists training_module_completions_user_module_uidx
  on public.training_module_completions(user_id, module_id);

alter table public.training_module_completions enable row level security;

drop policy if exists "training_module_completions_select_own" on public.training_module_completions;
create policy "training_module_completions_select_own"
  on public.training_module_completions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "training_module_completions_insert_own" on public.training_module_completions;
create policy "training_module_completions_insert_own"
  on public.training_module_completions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Explicitly disallow updates/deletes by authenticated users (append-only ledger)
revoke update, delete on public.training_module_completions from authenticated;
