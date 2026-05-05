-- =============================================================
-- Vidura Studios — Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  email      text not null default '',
  role       text not null default 'Course Director',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─── Projects ────────────────────────────────────────────────
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  title      text not null,
  subject    text default '',
  pdf_url    text,
  status     text default 'processing',
  progress   integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Modules ─────────────────────────────────────────────────
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade not null,
  title       text not null,
  order_index integer default 0,
  created_at  timestamptz default now()
);

alter table public.modules enable row level security;

create policy "Users can CRUD modules for own projects"
  on public.modules for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = modules.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ─── Topics ──────────────────────────────────────────────────
create table if not exists public.topics (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid references public.modules(id) on delete cascade not null,
  title        text not null,
  content_type text default 'Video',
  duration     text default '10m',
  order_index  integer default 0,
  created_at   timestamptz default now()
);

alter table public.topics enable row level security;

create policy "Users can CRUD topics for own modules"
  on public.topics for all
  using (
    exists (
      select 1 from public.modules
      join public.projects on projects.id = modules.project_id
      where modules.id = topics.module_id
        and projects.user_id = auth.uid()
    )
  );

-- ─── Scenes ──────────────────────────────────────────────────
create table if not exists public.scenes (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid references public.modules(id) on delete cascade not null,
  project_id   uuid references public.projects(id) on delete cascade not null,
  scene_number integer not null,
  title        text not null default '',
  visual_cue   text not null default '',
  script_text  text not null default '',
  is_locked    boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.scenes enable row level security;

create policy "Users can CRUD own scenes"
  on public.scenes for all
  using (
    auth.uid() = (
      select user_id from public.projects where id = scenes.project_id
    )
  );

-- ─── Auto-create profile on signup ───────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'Course Director'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Storage bucket (run separately or via Supabase Dashboard) ──
-- Go to Storage in your Supabase Dashboard and create a bucket named "pdfs"
-- Set it to Public so uploaded PDFs can be accessed by URL.
-- Then add these storage policies in the SQL editor:
--
-- insert into storage.buckets (id, name, public)
-- values ('pdfs', 'pdfs', true)
-- on conflict (id) do nothing;
--
-- create policy "Authenticated users can upload PDFs"
--   on storage.objects for insert
--   with check (bucket_id = 'pdfs' and auth.role() = 'authenticated');
--
-- create policy "PDFs are publicly accessible"
--   on storage.objects for select
--   using (bucket_id = 'pdfs');
