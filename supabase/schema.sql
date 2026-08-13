-- ChartForge — run this in the Supabase SQL editor (once per project)
-- Auth: Authentication → Providers → Email: turn OFF "Confirm email"
-- so anyone can create an account with email + password and start immediately.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  gemini_api_key text,
  created_at timestamptz default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default 'Untitled deck',
  palette text default 'forge',
  insights jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists decks_user_updated on public.decks (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.decks enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

alter table public.profiles add column if not exists gemini_api_key text;

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "own decks" on public.decks;
create policy "own decks" on public.decks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
