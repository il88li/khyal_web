-- Khiyal Supabase Schema
-- Run this in Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  prompts_count int default 0,
  followers_count int default 0,
  following_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  original text not null,
  enhanced text not null,
  category text not null,
  tone text not null,
  detail_level text not null,
  language text not null,
  images text[] default '{}',
  likes_count int default 0,
  comments_count int default 0,
  saves_count int default 0,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, prompt_id)
);

create table if not exists public.saves (
  user_id uuid references public.profiles(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, prompt_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  count int default 0,
  model_used text,
  unique (user_id, date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text default 'android',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.usage enable row level security;
alter table public.notifications enable row level security;
alter table public.fcm_tokens enable row level security;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "prompts_select" on public.prompts for select using (is_public = true or auth.uid() = user_id);
create policy "prompts_insert" on public.prompts for insert with check (auth.uid() = user_id);
create policy "prompts_update" on public.prompts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "prompts_delete" on public.prompts for delete using (auth.uid() = user_id);

create policy "likes_all" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saves_all" on public.saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

create policy "usage_own" on public.usage for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fcm_own" on public.fcm_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'مستخدم خيال')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper RPCs for like counts (optional, can also use triggers)
create or replace function public.increment_likes(prompt_id uuid)
returns void as $$
  update public.prompts set likes_count = likes_count + 1 where id = prompt_id;
$$ language sql security definer;

create or replace function public.decrement_likes(prompt_id uuid)
returns void as $$
  update public.prompts set likes_count = greatest(0, likes_count - 1) where id = prompt_id;
$$ language sql security definer;

-- Storage bucket (run in Supabase Dashboard > Storage or via API)
-- Create private bucket named "prompts"
-- Policies:
-- INSERT: authenticated users, path starts with their uid
-- SELECT: authenticated (or use signed URLs only)

-- Example policy SQL (after creating bucket):
-- create policy "upload_own" on storage.objects for insert
--   with check (bucket_id = 'prompts' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "read_signed" on storage.objects for select
--   using (bucket_id = 'prompts');

-- Feature flags
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean default false,
  updated_at timestamptz default now()
);

insert into public.feature_flags (key, enabled) values
  ('enhancer_enabled', true),
  ('realtime_feed', true),
  ('image_upload', true),
  ('comments', true)
on conflict (key) do nothing;

alter table public.feature_flags enable row level security;
create policy "flags_select" on public.feature_flags for select using (true);
-- writes only via service role / admin server actions

-- Audit log
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;
-- no public policies — server/admin only

-- Comments count RPC
create or replace function public.increment_comments(prompt_id uuid)
returns void as $$
  update public.prompts set comments_count = comments_count + 1 where id = prompt_id;
$$ language sql security definer;
