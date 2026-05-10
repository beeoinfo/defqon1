begin;

-- Canonical non-destructive rebuild for the public schema used by the app.
-- Keep this file as the versioned source of truth for database evolution.
-- The script is intentionally rerunnable on an existing Supabase project.

create extension if not exists pgcrypto;

-- Tables

-- App profile mirrored from auth.users and enriched with app-specific fields.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  auth_email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  username text not null unique,
  avatar_path text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  avatar_kind text not null default 'preset',
  avatar_preset integer not null default 1
);

alter table public.profiles
  add column if not exists auth_email text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists username text,
  add column if not exists avatar_path text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists avatar_kind text default 'preset',
  add column if not exists avatar_preset integer default 1;

alter table public.profiles
  alter column first_name set default '',
  alter column last_name set default '',
  alter column avatar_kind set default 'preset',
  alter column avatar_preset set default 1,
  alter column created_at set default now(),
  alter column updated_at set default now();

create table if not exists public.tribes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text
);

alter table public.tribes
  add column if not exists code text,
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists name text;

alter table public.tribes
  alter column created_at set default now(),
  alter column updated_at set default now();

-- One row per user's tribe membership. The unique index on user_id below
-- enforces the "one tribe per user" rule.
create table if not exists public.tribe_members (
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tribe_id, user_id)
);

alter table public.tribe_members
  add column if not exists role text default 'member',
  add column if not exists created_at timestamptz default now();

alter table public.tribe_members
  alter column role set default 'member',
  alter column created_at set default now();

-- Snapshot-based favorites stored per user.
create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_slug text not null default 'defqon1',
  favorite_key text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, site_slug, favorite_key)
);

alter table public.user_favorites
  add column if not exists site_slug text default 'defqon1',
  add column if not exists snapshot jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.user_favorites
  alter column site_slug set default 'defqon1',
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Admin allowlist. Only users listed here can access admin RPCs and manage
-- runtime lineup versions.
create table if not exists public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_admins
  add column if not exists is_active boolean default true,
  add column if not exists note text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.app_admins
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Public app settings. Values in this table are runtime feature/config flags
-- readable by everyone, but only admins may change them.
create table if not exists public.app_settings (
  site_slug text not null,
  setting_key text not null,
  setting_value jsonb not null default 'false'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_slug, setting_key)
);

alter table public.app_settings
  add column if not exists site_slug text,
  add column if not exists setting_key text,
  add column if not exists setting_value jsonb default 'false'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.app_settings
  alter column setting_value set default 'false'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_settings'::regclass
      and conname = 'app_settings_pkey'
  ) then
    alter table public.app_settings
      add constraint app_settings_pkey primary key (site_slug, setting_key);
  end if;
end;
$$;

-- Runtime lineup storage. Payload intentionally stays jsonb so the app can
-- query and export the canonical lineup without opaque compression.
create table if not exists public.lineup_versions (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  status text not null default 'pending',
  version_label text,
  payload jsonb not null,
  payload_hash text not null,
  source_kind text not null default 'manual',
  source_url text,
  source_hash text,
  source_updated_at timestamptz,
  detected_changes jsonb not null default '{}'::jsonb,
  imported_by uuid references public.profiles(id) on delete set null,
  activated_by uuid references public.profiles(id) on delete set null,
  imported_at timestamptz not null default now(),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lineup_versions
  add column if not exists site_slug text,
  add column if not exists status text default 'pending',
  add column if not exists version_label text,
  add column if not exists payload jsonb,
  add column if not exists payload_hash text,
  add column if not exists source_kind text default 'manual',
  add column if not exists source_url text,
  add column if not exists source_hash text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists detected_changes jsonb default '{}'::jsonb,
  add column if not exists imported_by uuid references public.profiles(id) on delete set null,
  add column if not exists activated_by uuid references public.profiles(id) on delete set null,
  add column if not exists imported_at timestamptz default now(),
  add column if not exists activated_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.lineup_versions
  alter column status set default 'pending',
  alter column source_kind set default 'manual',
  alter column detected_changes set default '{}'::jsonb,
  alter column imported_at set default now(),
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Audit trail for automatic checks and manual degraded-mode imports.
create table if not exists public.lineup_import_runs (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  status text not null default 'pending',
  source_kind text not null default 'manual',
  source_url text,
  source_hash text,
  source_updated_at timestamptz,
  payload_hash text,
  lineup_version_id uuid references public.lineup_versions(id) on delete set null,
  change_summary jsonb not null default '{}'::jsonb,
  error_message text,
  triggered_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lineup_import_runs
  add column if not exists site_slug text,
  add column if not exists status text default 'pending',
  add column if not exists source_kind text default 'manual',
  add column if not exists source_url text,
  add column if not exists source_hash text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists payload_hash text,
  add column if not exists lineup_version_id uuid references public.lineup_versions(id) on delete set null,
  add column if not exists change_summary jsonb default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists triggered_by uuid references public.profiles(id) on delete set null,
  add column if not exists started_at timestamptz default now(),
  add column if not exists finished_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.lineup_import_runs
  alter column status set default 'pending',
  alter column source_kind set default 'manual',
  alter column change_summary set default '{}'::jsonb,
  alter column started_at set default now(),
  alter column created_at set default now(),
  alter column updated_at set default now();

-- Voluntary map pins shared inside a tribe. Each user has at most one active
-- stored position per map layer, site, and tribe. Raw map coordinates never
-- cross map layers; calibrated maps may reproject GPS metadata for display.
create table if not exists public.tribe_member_locations (
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  site_slug text not null default 'defqon1',
  map_layer_id text not null default 'default',
  longitude double precision not null,
  latitude double precision not null,
  location_kind text not null default 'manual',
  gps_longitude double precision,
  gps_latitude double precision,
  gps_accuracy_m double precision,
  expires_at timestamptz,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tribe_id, user_id, site_slug, map_layer_id)
);

alter table public.tribe_member_locations
  add column if not exists site_slug text default 'defqon1',
  add column if not exists map_layer_id text default 'default',
  add column if not exists longitude double precision,
  add column if not exists latitude double precision,
  add column if not exists location_kind text default 'manual',
  add column if not exists gps_longitude double precision,
  add column if not exists gps_latitude double precision,
  add column if not exists gps_accuracy_m double precision,
  add column if not exists expires_at timestamptz,
  add column if not exists label text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.tribe_member_locations
  alter column site_slug set default 'defqon1',
  alter column map_layer_id set default 'default',
  alter column location_kind set default 'manual',
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.tribe_member_locations
set map_layer_id = 'default'
where map_layer_id is null or btrim(map_layer_id) = '';

alter table public.tribe_member_locations
  alter column map_layer_id set not null;

alter table public.tribe_member_locations
  drop constraint if exists tribe_member_locations_pkey;

alter table public.tribe_member_locations
  add constraint tribe_member_locations_pkey
  primary key (tribe_id, user_id, site_slug, map_layer_id);

alter table public.tribe_member_locations
  drop constraint if exists tribe_member_locations_location_kind_check;

alter table public.tribe_member_locations
  add constraint tribe_member_locations_location_kind_check
  check (location_kind in ('manual', 'live'));

-- Admin-authored control points used to align a non-geographic festival map
-- with real GPS coordinates. The app only enables GPS-based location features
-- when at least three active points exist for the selected map layer.
create table if not exists public.map_calibration_points (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null default 'defqon1',
  map_layer_id text not null,
  map_longitude double precision not null,
  map_latitude double precision not null,
  gps_longitude double precision not null,
  gps_latitude double precision not null,
  gps_accuracy_m double precision,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.map_calibration_points
  add column if not exists site_slug text default 'defqon1',
  add column if not exists map_layer_id text,
  add column if not exists map_longitude double precision,
  add column if not exists map_latitude double precision,
  add column if not exists gps_longitude double precision,
  add column if not exists gps_latitude double precision,
  add column if not exists gps_accuracy_m double precision,
  add column if not exists created_by uuid references public.profiles(id) on delete cascade,
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.map_calibration_points
  alter column site_slug set default 'defqon1',
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'tribe_member_locations'
    )
  then
    alter publication supabase_realtime add table public.tribe_member_locations;
  end if;

  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'map_calibration_points'
    )
  then
    alter publication supabase_realtime add table public.map_calibration_points;
  end if;
end;
$$;

-- Queue of uploaded avatar paths that must be deleted through the Storage API.
-- This script never mutates storage.objects directly to avoid leaving billed
-- files behind in the storage provider.
create table if not exists public.avatar_cleanup_queue (
  path text primary key,
  reason text not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

create unique index if not exists tribe_members_user_id_key
  on public.tribe_members (user_id);

create unique index if not exists profiles_auth_email_key
  on public.profiles (auth_email);

create unique index if not exists profiles_username_key
  on public.profiles (username);

create unique index if not exists tribes_code_key
  on public.tribes (code);

create index if not exists tribe_members_tribe_id_idx
  on public.tribe_members (tribe_id);

create index if not exists tribe_member_locations_tribe_site_idx
  on public.tribe_member_locations (tribe_id, site_slug);

create index if not exists tribe_member_locations_tribe_site_layer_idx
  on public.tribe_member_locations (tribe_id, site_slug, map_layer_id);

create index if not exists tribe_member_locations_expires_idx
  on public.tribe_member_locations (expires_at)
  where expires_at is not null;

create index if not exists map_calibration_points_site_layer_active_idx
  on public.map_calibration_points (site_slug, map_layer_id, is_active, created_at desc);

create unique index if not exists tribe_members_one_owner_per_tribe_idx
  on public.tribe_members (tribe_id)
  where role = 'owner';

-- This partial unique index guarantees at most one owner per tribe.

create index if not exists app_admins_active_idx
  on public.app_admins (user_id)
  where is_active = true;

create unique index if not exists lineup_versions_one_active_per_site_idx
  on public.lineup_versions (site_slug)
  where status = 'active';

create unique index if not exists lineup_versions_site_payload_hash_key
  on public.lineup_versions (site_slug, payload_hash);

create index if not exists lineup_versions_site_status_created_idx
  on public.lineup_versions (site_slug, status, created_at desc);

create index if not exists lineup_import_runs_site_created_idx
  on public.lineup_import_runs (site_slug, created_at desc);

-- Normalize existing rows before constraints are tightened.
-- Each UPDATE is intentionally scoped to rows that actually need correction.

update public.profiles
set
  auth_email = lower(trim(coalesce(auth_email, ''))),
  first_name = trim(coalesce(first_name, '')),
  last_name = trim(coalesce(last_name, '')),
  username = lower(trim(coalesce(username, ''))),
  avatar_kind = case
    when lower(trim(coalesce(avatar_kind, 'preset'))) in ('preset', 'upload')
      then lower(trim(coalesce(avatar_kind, 'preset')))
    else 'preset'
  end,
  avatar_preset = case
    when coalesce(avatar_preset, 0) >= 1 then avatar_preset
    else 1
  end,
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  auth_email is distinct from lower(trim(coalesce(auth_email, '')))
  or first_name is distinct from trim(coalesce(first_name, ''))
  or last_name is distinct from trim(coalesce(last_name, ''))
  or username is distinct from lower(trim(coalesce(username, '')))
  or avatar_kind is distinct from case
    when lower(trim(coalesce(avatar_kind, 'preset'))) in ('preset', 'upload')
      then lower(trim(coalesce(avatar_kind, 'preset')))
    else 'preset'
  end
  or coalesce(avatar_preset, 0) < 1
  or created_at is null
  or updated_at is null;

update public.tribes
set
  code = upper(substr(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'), 1, 8)),
  name = nullif(trim(coalesce(name, '')), ''),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  code is distinct from upper(substr(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'), 1, 8))
  or name is distinct from nullif(trim(coalesce(name, '')), '')
  or created_at is null
  or updated_at is null;

update public.tribe_members
set
  role = case
    when lower(trim(coalesce(role, 'member'))) in ('owner', 'member')
      then lower(trim(coalesce(role, 'member')))
    else 'member'
  end,
  created_at = coalesce(created_at, now())
where
  role is distinct from case
    when lower(trim(coalesce(role, 'member'))) in ('owner', 'member')
      then lower(trim(coalesce(role, 'member')))
    else 'member'
  end
  or created_at is null;

update public.user_favorites
set
  site_slug = coalesce(nullif(trim(site_slug), ''), 'defqon1'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  nullif(trim(site_slug), '') is null
  or created_at is null
  or updated_at is null;

update public.app_admins
set
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  is_active is null
  or created_at is null
  or updated_at is null;

update public.app_settings
set
  site_slug = lower(trim(coalesce(site_slug, ''))),
  setting_key = lower(trim(coalesce(setting_key, ''))),
  setting_value = coalesce(setting_value, 'false'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  site_slug is distinct from lower(trim(coalesce(site_slug, '')))
  or setting_key is distinct from lower(trim(coalesce(setting_key, '')))
  or setting_value is null
  or created_at is null
  or updated_at is null;

update public.lineup_versions
set
  site_slug = lower(trim(coalesce(site_slug, ''))),
  status = case
    when lower(trim(coalesce(status, 'pending'))) in ('pending', 'active', 'archived')
      then lower(trim(coalesce(status, 'pending')))
    else 'pending'
  end,
  source_kind = lower(trim(coalesce(source_kind, 'manual'))),
  detected_changes = coalesce(detected_changes, '{}'::jsonb),
  imported_at = coalesce(imported_at, now()),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  site_slug is distinct from lower(trim(coalesce(site_slug, '')))
  or status not in ('pending', 'active', 'archived')
  or source_kind is distinct from lower(trim(coalesce(source_kind, 'manual')))
  or detected_changes is null
  or imported_at is null
  or created_at is null
  or updated_at is null;

update public.lineup_import_runs
set
  site_slug = lower(trim(coalesce(site_slug, ''))),
  status = case
    when lower(trim(coalesce(status, 'pending'))) in ('pending', 'no_change', 'loaded', 'failed')
      then lower(trim(coalesce(status, 'pending')))
    else 'pending'
  end,
  source_kind = lower(trim(coalesce(source_kind, 'manual'))),
  change_summary = coalesce(change_summary, '{}'::jsonb),
  started_at = coalesce(started_at, now()),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  site_slug is distinct from lower(trim(coalesce(site_slug, '')))
  or status not in ('pending', 'no_change', 'loaded', 'failed')
  or source_kind is distinct from lower(trim(coalesce(source_kind, 'manual')))
  or change_summary is null
  or started_at is null
  or created_at is null
  or updated_at is null;

update public.avatar_cleanup_queue
set
  requested_at = coalesce(requested_at, now())
where
  requested_at is null;

-- Constraints

alter table public.profiles
  alter column auth_email set not null,
  alter column first_name set not null,
  alter column last_name set not null,
  alter column username set not null,
  alter column avatar_kind set not null,
  alter column avatar_preset set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.tribes
  alter column code set not null,
  alter column owner_user_id set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.tribe_members
  alter column role set not null,
  alter column created_at set not null;

alter table public.user_favorites
  alter column site_slug set not null,
  alter column snapshot set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.app_admins
  alter column is_active set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.app_settings
  alter column site_slug set not null,
  alter column setting_key set not null,
  alter column setting_value set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.lineup_versions
  alter column site_slug set not null,
  alter column status set not null,
  alter column payload set not null,
  alter column payload_hash set not null,
  alter column source_kind set not null,
  alter column detected_changes set not null,
  alter column imported_at set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.lineup_import_runs
  alter column site_slug set not null,
  alter column status set not null,
  alter column source_kind set not null,
  alter column change_summary set not null,
  alter column started_at set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.user_favorites
  drop constraint if exists user_favorites_pkey;

alter table public.user_favorites
  add constraint user_favorites_pkey
  primary key (user_id, site_slug, favorite_key);

alter table public.avatar_cleanup_queue
  alter column reason set not null,
  alter column requested_at set not null;

alter table public.profiles
  drop constraint if exists profiles_avatar_kind_check;

alter table public.profiles
  add constraint profiles_avatar_kind_check
  check (avatar_kind in ('preset', 'upload'));

alter table public.profiles
  drop constraint if exists profiles_avatar_preset_check;

alter table public.profiles
  add constraint profiles_avatar_preset_check
  check (avatar_preset >= 1);

alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username ~ '^[a-z0-9._-]{3,30}$');

alter table public.tribes
  drop constraint if exists tribes_code_format_check;

alter table public.tribes
  add constraint tribes_code_format_check
  check (code ~ '^[A-Z0-9]{8}$');

alter table public.tribes
  drop constraint if exists tribes_name_length_check;

alter table public.tribes
  add constraint tribes_name_length_check
  check (name is null or char_length(name) <= 48);

alter table public.tribe_members
  drop constraint if exists tribe_members_role_check;

alter table public.tribe_members
  add constraint tribe_members_role_check
  check (role in ('owner', 'member'));

alter table public.lineup_versions
  drop constraint if exists lineup_versions_status_check;

alter table public.lineup_versions
  add constraint lineup_versions_status_check
  check (status in ('pending', 'active', 'archived', 'ignored'));

alter table public.lineup_versions
  drop constraint if exists lineup_versions_source_kind_check;

alter table public.lineup_versions
  add constraint lineup_versions_source_kind_check
  check (source_kind in ('endpoint', 'manual', 'seed', 'server'));

alter table public.lineup_versions
  drop constraint if exists lineup_versions_payload_object_check;

alter table public.lineup_versions
  add constraint lineup_versions_payload_object_check
  check (jsonb_typeof(payload) = 'object');

alter table public.lineup_versions
  drop constraint if exists lineup_versions_detected_changes_object_check;

alter table public.lineup_versions
  add constraint lineup_versions_detected_changes_object_check
  check (jsonb_typeof(detected_changes) = 'object');

alter table public.lineup_import_runs
  drop constraint if exists lineup_import_runs_status_check;

alter table public.lineup_import_runs
  add constraint lineup_import_runs_status_check
  check (status in ('pending', 'no_change', 'loaded', 'failed'));

alter table public.lineup_import_runs
  drop constraint if exists lineup_import_runs_source_kind_check;

alter table public.lineup_import_runs
  add constraint lineup_import_runs_source_kind_check
  check (source_kind in ('endpoint', 'manual', 'seed', 'server'));

alter table public.lineup_import_runs
  drop constraint if exists lineup_import_runs_change_summary_object_check;

alter table public.lineup_import_runs
  add constraint lineup_import_runs_change_summary_object_check
  check (jsonb_typeof(change_summary) = 'object');

-- Trigger functions

-- Shared trigger helper that keeps updated_at columns in sync.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create the app profile for every new auth user. The username is derived
  -- from auth metadata first, then from the auth email fallback.
  insert into public.profiles (
    id,
    auth_email,
    first_name,
    last_name,
    username,
    avatar_kind,
    avatar_preset
  )
  values (
    new.id,
    lower(trim(coalesce(new.raw_user_meta_data ->> 'auth_email', new.email, ''))),
    trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')),
    lower(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(new.raw_user_meta_data ->> 'auth_email', new.email, ''), '@', 1)
      )
    ),
    'preset',
    1
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.request_avatar_cleanup(path_input text, reason_input text default 'profile_avatar_removed')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_path text := nullif(trim(coalesce(path_input, '')), '');
  normalized_reason text := nullif(trim(coalesce(reason_input, '')), '');
begin
  -- Queue the path for an external cleanup worker. Re-queuing the same path
  -- resets its processing state so retries remain possible.
  if normalized_path is null then
    return;
  end if;

  insert into public.avatar_cleanup_queue (path, reason, requested_at, processed_at, last_error)
  values (normalized_path, coalesce(normalized_reason, 'profile_avatar_removed'), now(), null, null)
  on conflict (path) do update
  set
    reason = excluded.reason,
    requested_at = excluded.requested_at,
    processed_at = null,
    last_error = null;
end;
$$;

create or replace function public.queue_avatar_cleanup_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Track only uploaded avatar paths. Preset avatars are local app assets.
  if tg_op = 'DELETE' then
    perform public.request_avatar_cleanup(old.avatar_path, 'profile_deleted');
    return old;
  end if;

  if old.avatar_path is distinct from new.avatar_path then
    perform public.request_avatar_cleanup(old.avatar_path, 'avatar_replaced');
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists tribes_set_updated_at on public.tribes;
create trigger tribes_set_updated_at
before update on public.tribes
for each row
execute function public.set_updated_at();

drop trigger if exists user_favorites_set_updated_at on public.user_favorites;
create trigger user_favorites_set_updated_at
before update on public.user_favorites
for each row
execute function public.set_updated_at();

drop trigger if exists app_admins_set_updated_at on public.app_admins;
create trigger app_admins_set_updated_at
before update on public.app_admins
for each row
execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

drop trigger if exists lineup_versions_set_updated_at on public.lineup_versions;
create trigger lineup_versions_set_updated_at
before update on public.lineup_versions
for each row
execute function public.set_updated_at();

drop trigger if exists lineup_import_runs_set_updated_at on public.lineup_import_runs;
create trigger lineup_import_runs_set_updated_at
before update on public.lineup_import_runs
for each row
execute function public.set_updated_at();

drop trigger if exists tribe_member_locations_set_updated_at on public.tribe_member_locations;
create trigger tribe_member_locations_set_updated_at
before update on public.tribe_member_locations
for each row
execute function public.set_updated_at();

drop trigger if exists map_calibration_points_set_updated_at on public.map_calibration_points;
create trigger map_calibration_points_set_updated_at
before update on public.map_calibration_points
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists profiles_queue_avatar_cleanup on public.profiles;
create trigger profiles_queue_avatar_cleanup
after update or delete on public.profiles
for each row
execute function public.queue_avatar_cleanup_from_profile();

-- Backfill profiles for already existing auth.users rows.
-- This is safe to rerun and preserves non-empty profile values already chosen
-- inside the app when possible.

insert into public.profiles (
  id,
  auth_email,
  first_name,
  last_name,
  username,
  avatar_kind,
  avatar_preset
)
select
  u.id,
  lower(trim(coalesce(u.raw_user_meta_data ->> 'auth_email', u.email, ''))),
  trim(coalesce(u.raw_user_meta_data ->> 'first_name', '')),
  trim(coalesce(u.raw_user_meta_data ->> 'last_name', '')),
  lower(
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'username'), ''),
      split_part(coalesce(u.raw_user_meta_data ->> 'auth_email', u.email, ''), '@', 1)
    )
  ),
  coalesce(p.avatar_kind, 'preset'),
  case
    when coalesce(p.avatar_preset, 0) >= 1 then p.avatar_preset
    else 1
  end
from auth.users u
left join public.profiles p
  on p.id = u.id
on conflict (id) do update
set
  auth_email = excluded.auth_email,
  first_name = case
    when public.profiles.first_name = '' then excluded.first_name
    else public.profiles.first_name
  end,
  last_name = case
    when public.profiles.last_name = '' then excluded.last_name
    else public.profiles.last_name
  end,
  username = case
    when public.profiles.username = '' then excluded.username
    else public.profiles.username
  end,
  avatar_kind = coalesce(public.profiles.avatar_kind, excluded.avatar_kind, 'preset'),
  avatar_preset = case
    when coalesce(public.profiles.avatar_preset, 0) >= 1 then public.profiles.avatar_preset
    else excluded.avatar_preset
  end;

-- Secondary FKs to profiles keep the app-level model coherent if a profile is
-- manually deleted by an admin while the auth user still exists.
alter table public.tribes
  drop constraint if exists tribes_owner_user_id_profiles_fkey;

alter table public.tribes
  add constraint tribes_owner_user_id_profiles_fkey
  foreign key (owner_user_id)
  references public.profiles(id)
  on delete cascade;

alter table public.tribe_members
  drop constraint if exists tribe_members_user_id_profiles_fkey;

alter table public.tribe_members
  add constraint tribe_members_user_id_profiles_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

alter table public.user_favorites
  drop constraint if exists user_favorites_user_id_profiles_fkey;

alter table public.user_favorites
  add constraint user_favorites_user_id_profiles_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- Helper functions used by RLS and RPCs.

-- Returns whether the authenticated user belongs to the target tribe.
create or replace function public.is_member_of_tribe(target_tribe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tribe_members
    where tribe_id = target_tribe_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_current_user_member_of_tribe(target_tribe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_member_of_tribe(target_tribe_id);
$$;

create or replace function public.are_users_in_same_tribe(left_user_id uuid, right_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tribe_members me
    join public.tribe_members other
      on other.tribe_id = me.tribe_id
    where me.user_id = left_user_id
      and other.user_id = right_user_id
  );
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Central admin gate used by RLS and RPCs. Admins are explicitly allowlisted
  -- in app_admins; auth metadata claims are intentionally not trusted here.
  select exists (
    select 1
    from public.app_admins a
    where a.user_id = auth.uid()
      and a.is_active = true
  );
$$;

create or replace function public.is_username_available(username_input text)
returns boolean
language sql
security definer
set search_path = public
as $$
  -- Used during sign-up and profile edits. The current user may keep their own
  -- username, so their own row is excluded when auth.uid() is available.
  with normalized as (
    select lower(trim(coalesce(username_input, ''))) as username_value
  )
  select
    case
      when username_value = '' then false
      else not exists (
        select 1
        from public.profiles p
        where p.username = normalized.username_value
          and (auth.uid() is null or p.id <> auth.uid())
      )
    end
  from normalized;
$$;

create or replace function public.get_auth_email_for_username(username_input text)
returns text
language sql
security definer
set search_path = public
as $$
  -- Legacy compatibility helper for username-based login while auth still uses
  -- an email field under the hood.
  select lower(trim(auth_email))
  from public.profiles
  where username = lower(trim(username_input))
  limit 1;
$$;

create or replace function public.make_random_tribe_code(code_length integer default 8)
returns text
language plpgsql
as $$
declare
  -- Excludes ambiguous characters such as I, O, 0 and 1.
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..greatest(code_length, 1) loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;

  return result;
end;
$$;

create or replace function public.generate_unique_tribe_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  loop
    next_code := public.make_random_tribe_code(8);
    exit when not exists (
      select 1
      from public.tribes
      where code = next_code
    );
  end loop;

  return next_code;
end;
$$;

create or replace function public.create_current_user_tribe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
  new_tribe public.tribes%rowtype;
begin
  -- Creates both the tribe row and the matching owner membership.
  current_uid := auth.uid();

  if current_uid is null then
    raise exception 'Authentication required.';
  end if;

  if exists (
    select 1
    from public.tribe_members
    where user_id = current_uid
  ) then
    raise exception 'You are already in a tribe.';
  end if;

  insert into public.tribes (code, owner_user_id)
  values (public.generate_unique_tribe_code(), current_uid)
  returning * into new_tribe;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (new_tribe.id, current_uid, 'owner');

  return jsonb_build_object(
    'tribe_id', new_tribe.id,
    'code', new_tribe.code
  );
end;
$$;

create or replace function public.join_current_user_tribe(code_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
  normalized_code text;
  target_tribe public.tribes%rowtype;
begin
  -- A user can belong to only one tribe at a time.
  current_uid := auth.uid();

  if current_uid is null then
    raise exception 'Authentication required.';
  end if;

  if exists (
    select 1
    from public.tribe_members
    where user_id = current_uid
  ) then
    raise exception 'You are already in a tribe.';
  end if;

  normalized_code := upper(substr(regexp_replace(coalesce(code_input, ''), '[^A-Za-z0-9]', '', 'g'), 1, 8));

  if normalized_code = '' then
    raise exception 'Please enter a tribe code.';
  end if;

  select *
  into target_tribe
  from public.tribes
  where code = normalized_code
  limit 1;

  if target_tribe.id is null then
    raise exception 'This tribe code does not exist.';
  end if;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (target_tribe.id, current_uid, 'member');

  return jsonb_build_object(
    'tribe_id', target_tribe.id,
    'code', target_tribe.code
  );
end;
$$;

create or replace function public.leave_current_user_tribe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
  current_membership public.tribe_members%rowtype;
  member_total integer;
  next_owner uuid;
begin
  -- Business rule:
  -- - owner alone => delete the tribe
  -- - owner with remaining members => transfer ownership to the oldest member
  -- - regular member => remove only their membership
  current_uid := auth.uid();

  if current_uid is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into current_membership
  from public.tribe_members
  where user_id = current_uid
  limit 1;

  if current_membership.tribe_id is null then
    raise exception 'You are not in a tribe.';
  end if;

  select count(*)
  into member_total
  from public.tribe_members
  where tribe_id = current_membership.tribe_id;

  if current_membership.role = 'owner' and member_total = 1 then
    delete from public.tribes
    where id = current_membership.tribe_id;

    return jsonb_build_object(
      'action', 'deleted',
      'tribe_id', current_membership.tribe_id
    );
  end if;

  if current_membership.role = 'owner' and member_total > 1 then
    select tm.user_id
    into next_owner
    from public.tribe_members tm
    where tm.tribe_id = current_membership.tribe_id
      and tm.user_id <> current_uid
    order by tm.created_at asc, tm.user_id asc
    limit 1;

    delete from public.tribe_members
    where tribe_id = current_membership.tribe_id
      and user_id = current_uid;

    update public.tribe_members
    set role = 'owner'
    where tribe_id = current_membership.tribe_id
      and user_id = next_owner;

    update public.tribes
    set owner_user_id = next_owner
    where id = current_membership.tribe_id;

    return jsonb_build_object(
      'action', 'transferred',
      'tribe_id', current_membership.tribe_id,
      'new_owner_user_id', next_owner
    );
  end if;

  delete from public.tribe_members
  where tribe_id = current_membership.tribe_id
    and user_id = current_uid;

  return jsonb_build_object(
    'action', 'left',
    'tribe_id', current_membership.tribe_id
  );
end;
$$;

create or replace function public.load_lineup_version(
  site_slug_input text,
  payload_input jsonb,
  payload_hash_input text,
  source_kind_input text default 'manual',
  source_url_input text default null,
  source_updated_at_input timestamptz default null,
  source_hash_input text default null,
  detected_changes_input jsonb default '{}'::jsonb,
  version_label_input text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  normalized_site_slug text := lower(trim(coalesce(site_slug_input, '')));
  normalized_payload_hash text := lower(trim(coalesce(payload_hash_input, '')));
  normalized_source_kind text := lower(trim(coalesce(source_kind_input, 'manual')));
  lineup_id uuid;
  existing_lineup public.lineup_versions%rowtype;
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  if normalized_site_slug = '' then
    raise exception 'A site slug is required.';
  end if;

  if payload_input is null or jsonb_typeof(payload_input) <> 'object' then
    raise exception 'Lineup payload must be a JSON object.';
  end if;

  if normalized_payload_hash = '' then
    raise exception 'A payload hash is required.';
  end if;

  if normalized_source_kind not in ('endpoint', 'manual', 'seed', 'server') then
    raise exception 'Unsupported lineup source kind.';
  end if;

  select *
  into existing_lineup
  from public.lineup_versions
  where site_slug = normalized_site_slug
    and payload_hash = normalized_payload_hash;

  if existing_lineup.id is not null then
    insert into public.lineup_import_runs (
      site_slug,
      status,
      source_kind,
      source_url,
      source_updated_at,
      source_hash,
      payload_hash,
      lineup_version_id,
      change_summary,
      triggered_by,
      finished_at
    )
    values (
      normalized_site_slug,
      'no_change',
      normalized_source_kind,
      nullif(trim(coalesce(source_url_input, '')), ''),
      source_updated_at_input,
      nullif(trim(coalesce(source_hash_input, '')), ''),
      normalized_payload_hash,
      existing_lineup.id,
      jsonb_build_object(
        'reason', 'duplicate_payload_hash',
        'existing_status', existing_lineup.status
      ),
      current_uid,
      now()
    );

    return existing_lineup.id;
  end if;

  insert into public.lineup_versions (
    site_slug,
    status,
    version_label,
    payload,
    payload_hash,
    source_kind,
    source_url,
    source_updated_at,
    source_hash,
    detected_changes,
    imported_by,
    imported_at
  )
  values (
    normalized_site_slug,
    'pending',
    nullif(trim(coalesce(version_label_input, '')), ''),
    payload_input,
    normalized_payload_hash,
    normalized_source_kind,
    nullif(trim(coalesce(source_url_input, '')), ''),
    source_updated_at_input,
    nullif(trim(coalesce(source_hash_input, '')), ''),
    coalesce(detected_changes_input, '{}'::jsonb),
    current_uid,
    now()
  )
  returning id into lineup_id;

  insert into public.lineup_import_runs (
    site_slug,
    status,
    source_kind,
    source_url,
    source_updated_at,
    source_hash,
    payload_hash,
    lineup_version_id,
    change_summary,
    triggered_by,
    finished_at
  )
  values (
    normalized_site_slug,
    'loaded',
    normalized_source_kind,
    nullif(trim(coalesce(source_url_input, '')), ''),
    source_updated_at_input,
    nullif(trim(coalesce(source_hash_input, '')), ''),
    normalized_payload_hash,
    lineup_id,
    coalesce(detected_changes_input, '{}'::jsonb),
    current_uid,
    now()
  );

  return lineup_id;
end;
$$;

create or replace function public.activate_lineup_version(lineup_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  target_lineup public.lineup_versions%rowtype;
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into target_lineup
  from public.lineup_versions
  where id = lineup_id_input
  for update;

  if target_lineup.id is null then
    raise exception 'Lineup version not found.';
  end if;

  if target_lineup.status <> 'pending' then
    raise exception 'Only pending lineup versions can be published.';
  end if;

  update public.lineup_versions
  set
    status = 'archived'
  where site_slug = target_lineup.site_slug
    and status = 'active'
    and id <> target_lineup.id;

  update public.lineup_versions
  set
    status = 'active',
    activated_at = now(),
    activated_by = current_uid
  where id = target_lineup.id;

  insert into public.lineup_import_runs (
    site_slug,
    status,
    source_kind,
    source_url,
    source_updated_at,
    source_hash,
    payload_hash,
    lineup_version_id,
    change_summary,
    triggered_by,
    finished_at
  )
  values (
    target_lineup.site_slug,
    'loaded',
    target_lineup.source_kind,
    target_lineup.source_url,
    target_lineup.source_updated_at,
    target_lineup.source_hash,
    target_lineup.payload_hash,
    target_lineup.id,
    target_lineup.detected_changes,
    current_uid,
    now()
  );

  return target_lineup.id;
end;
$$;

create or replace function public.ignore_lineup_version(lineup_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lineup public.lineup_versions%rowtype;
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into target_lineup
  from public.lineup_versions
  where id = lineup_id_input
  for update;

  if target_lineup.id is null then
    raise exception 'Lineup version not found.';
  end if;

  if target_lineup.status <> 'pending' then
    raise exception 'Only pending lineup versions can be ignored.';
  end if;

  update public.lineup_versions
  set
    status = 'ignored',
    updated_at = now()
  where id = target_lineup.id;

  return target_lineup.id;
end;
$$;

create or replace function public.promote_latest_archived_lineup(site_slug_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_lineup_id uuid;
  replacement_lineup_id uuid;
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  select id
  into active_lineup_id
  from public.lineup_versions
  where site_slug = site_slug_input
    and status = 'active'
  limit 1;

  if active_lineup_id is not null then
    return active_lineup_id;
  end if;

  select id
  into replacement_lineup_id
  from public.lineup_versions
  where site_slug = site_slug_input
    and status = 'archived'
  order by updated_at desc, activated_at desc nulls last, created_at desc
  limit 1
  for update;

  if replacement_lineup_id is null then
    return null;
  end if;

  update public.lineup_versions
  set
    status = 'active',
    activated_at = now(),
    activated_by = auth.uid(),
    updated_at = now()
  where id = replacement_lineup_id;

  return replacement_lineup_id;
end;
$$;

create or replace function public.delete_lineup_version(lineup_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lineup public.lineup_versions%rowtype;
begin
  if auth.role() <> 'service_role' and not public.is_current_user_admin() then
    raise exception 'Admin access required.';
  end if;

  select *
  into target_lineup
  from public.lineup_versions
  where id = lineup_id_input
  for update;

  if target_lineup.id is null then
    raise exception 'Lineup version not found.';
  end if;

  delete from public.lineup_versions
  where id = target_lineup.id;

  if target_lineup.status = 'active' then
    perform public.promote_latest_archived_lineup(target_lineup.site_slug);
  end if;

  return target_lineup.id;
end;
$$;

-- Grants
-- Keep table privileges minimal and rely on RLS for row-level filtering.

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.tribes from public, anon, authenticated;
revoke all on table public.tribe_members from public, anon, authenticated;
revoke all on table public.user_favorites from public, anon, authenticated;
revoke all on table public.tribe_member_locations from public, anon, authenticated;
revoke all on table public.map_calibration_points from public, anon, authenticated;
revoke all on table public.app_admins from public, anon, authenticated;
revoke all on table public.app_settings from public, anon, authenticated;
revoke all on table public.lineup_versions from public, anon, authenticated;
revoke all on table public.lineup_import_runs from public, anon, authenticated;
revoke all on table public.avatar_cleanup_queue from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, update on table public.tribes to authenticated;
grant select on table public.tribe_members to authenticated;
grant select, insert, update, delete on table public.user_favorites to authenticated;
grant select, insert, update, delete on table public.tribe_member_locations to authenticated;
grant select on table public.map_calibration_points to anon, authenticated;
grant insert, update, delete on table public.map_calibration_points to authenticated;
grant select on table public.app_admins to authenticated;
grant select on table public.app_settings to anon, authenticated;
grant insert, update, delete on table public.app_settings to authenticated;
grant select on table public.lineup_versions to anon, authenticated;
grant select, insert, update on table public.lineup_import_runs to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.tribes to service_role;
grant all on table public.tribe_members to service_role;
grant all on table public.user_favorites to service_role;
grant all on table public.tribe_member_locations to service_role;
grant all on table public.map_calibration_points to service_role;
grant all on table public.app_admins to service_role;
grant all on table public.app_settings to service_role;
grant all on table public.lineup_versions to service_role;
grant all on table public.lineup_import_runs to service_role;
grant all on table public.avatar_cleanup_queue to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.request_avatar_cleanup(text, text) from public, anon, authenticated;
revoke all on function public.queue_avatar_cleanup_from_profile() from public, anon, authenticated;

revoke all on function public.is_member_of_tribe(uuid) from public;
revoke all on function public.is_member_of_tribe(uuid) from anon;
grant execute on function public.is_member_of_tribe(uuid) to authenticated;

revoke all on function public.is_current_user_member_of_tribe(uuid) from public;
revoke all on function public.is_current_user_member_of_tribe(uuid) from anon;
grant execute on function public.is_current_user_member_of_tribe(uuid) to authenticated;

revoke all on function public.are_users_in_same_tribe(uuid, uuid) from public;
revoke all on function public.are_users_in_same_tribe(uuid, uuid) from anon;
grant execute on function public.are_users_in_same_tribe(uuid, uuid) to authenticated;

revoke all on function public.is_current_user_admin() from public;
revoke all on function public.is_current_user_admin() from anon;
grant execute on function public.is_current_user_admin() to authenticated;

revoke all on function public.is_username_available(text) from public, anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;

revoke all on function public.get_auth_email_for_username(text) from public, anon, authenticated;
grant execute on function public.get_auth_email_for_username(text) to anon, authenticated;

revoke all on function public.make_random_tribe_code(integer) from public, anon, authenticated;
revoke all on function public.generate_unique_tribe_code() from public, anon, authenticated;

revoke all on function public.create_current_user_tribe() from public, anon, authenticated;
grant execute on function public.create_current_user_tribe() to authenticated;

revoke all on function public.join_current_user_tribe(text) from public, anon, authenticated;
grant execute on function public.join_current_user_tribe(text) to authenticated;

revoke all on function public.leave_current_user_tribe() from public, anon, authenticated;
grant execute on function public.leave_current_user_tribe() to authenticated;

drop function if exists public.create_lineup_candidate(text, jsonb, text, text, text, timestamptz, text, jsonb, text);
drop function if exists public.reject_lineup_candidate(uuid);

revoke all on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) to authenticated;
grant execute on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) to service_role;

revoke all on function public.activate_lineup_version(uuid) from public, anon, authenticated;
grant execute on function public.activate_lineup_version(uuid) to authenticated;
grant execute on function public.activate_lineup_version(uuid) to service_role;

revoke all on function public.ignore_lineup_version(uuid) from public, anon, authenticated;
grant execute on function public.ignore_lineup_version(uuid) to authenticated;
grant execute on function public.ignore_lineup_version(uuid) to service_role;

revoke all on function public.promote_latest_archived_lineup(text) from public, anon, authenticated;
grant execute on function public.promote_latest_archived_lineup(text) to authenticated;
grant execute on function public.promote_latest_archived_lineup(text) to service_role;

revoke all on function public.delete_lineup_version(uuid) from public, anon, authenticated;
grant execute on function public.delete_lineup_version(uuid) to authenticated;
grant execute on function public.delete_lineup_version(uuid) to service_role;

-- RLS
-- Members can read profiles and favorites from their own tribe, while writes
-- stay limited to each user's own rows unless stated otherwise.

alter table public.profiles enable row level security;
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.user_favorites enable row level security;
alter table public.tribe_member_locations enable row level security;
alter table public.map_calibration_points enable row level security;
alter table public.app_admins enable row level security;
alter table public.app_settings enable row level security;
alter table public.lineup_versions enable row level security;
alter table public.lineup_import_runs enable row level security;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "tribe members can read each other profiles" on public.profiles;
create policy "tribe members can read each other profiles"
on public.profiles
for select
to authenticated
using (public.are_users_in_same_tribe(auth.uid(), public.profiles.id));

drop policy if exists tribe_members_select_same_tribe on public.tribe_members;
create policy tribe_members_select_same_tribe
on public.tribe_members
for select
to authenticated
using (public.is_member_of_tribe(tribe_id));

drop policy if exists tribes_select_same_tribe on public.tribes;
create policy tribes_select_same_tribe
on public.tribes
for select
to authenticated
using (public.is_member_of_tribe(id));

drop policy if exists "tribe members can update tribe name" on public.tribes;
create policy "tribe members can update tribe name"
on public.tribes
for update
to authenticated
using (public.is_member_of_tribe(id))
with check (public.is_member_of_tribe(id));

drop policy if exists favorites_delete_own on public.user_favorites;
create policy favorites_delete_own
on public.user_favorites
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.user_favorites;
create policy favorites_insert_own
on public.user_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists favorites_select_own on public.user_favorites;
create policy favorites_select_own
on public.user_favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists favorites_update_own on public.user_favorites;
create policy favorites_update_own
on public.user_favorites
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tribe members can read each other favorites" on public.user_favorites;
create policy "tribe members can read each other favorites"
on public.user_favorites
for select
to authenticated
using (public.are_users_in_same_tribe(auth.uid(), public.user_favorites.user_id));

drop policy if exists tribe_locations_select_same_tribe on public.tribe_member_locations;
create policy tribe_locations_select_same_tribe
on public.tribe_member_locations
for select
to authenticated
using (public.is_member_of_tribe(tribe_id));

drop policy if exists tribe_locations_insert_own on public.tribe_member_locations;
create policy tribe_locations_insert_own
on public.tribe_member_locations
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_member_of_tribe(tribe_id)
);

drop policy if exists tribe_locations_update_own on public.tribe_member_locations;
create policy tribe_locations_update_own
on public.tribe_member_locations
for update
to authenticated
using (
  auth.uid() = user_id
  and public.is_member_of_tribe(tribe_id)
)
with check (
  auth.uid() = user_id
  and public.is_member_of_tribe(tribe_id)
);

drop policy if exists tribe_locations_delete_own on public.tribe_member_locations;
create policy tribe_locations_delete_own
on public.tribe_member_locations
for delete
to authenticated
using (
  auth.uid() = user_id
  and public.is_member_of_tribe(tribe_id)
);

drop policy if exists map_calibration_points_select_public on public.map_calibration_points;
create policy map_calibration_points_select_public
on public.map_calibration_points
for select
to anon, authenticated
using (is_active);

drop policy if exists map_calibration_points_insert_admin on public.map_calibration_points;
create policy map_calibration_points_insert_admin
on public.map_calibration_points
for insert
to authenticated
with check (public.is_current_user_admin() and auth.uid() = created_by);

drop policy if exists map_calibration_points_update_admin on public.map_calibration_points;
create policy map_calibration_points_update_admin
on public.map_calibration_points
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists map_calibration_points_delete_admin on public.map_calibration_points;
create policy map_calibration_points_delete_admin
on public.map_calibration_points
for delete
to authenticated
using (public.is_current_user_admin());

drop policy if exists app_admins_select_self on public.app_admins;
create policy app_admins_select_self
on public.app_admins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists app_admins_select_admin on public.app_admins;
create policy app_admins_select_admin
on public.app_admins
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists app_settings_select_public on public.app_settings;
create policy app_settings_select_public
on public.app_settings
for select
to anon, authenticated
using (true);

drop policy if exists app_settings_insert_admin on public.app_settings;
create policy app_settings_insert_admin
on public.app_settings
for insert
to authenticated
with check (public.is_current_user_admin());

drop policy if exists app_settings_update_admin on public.app_settings;
create policy app_settings_update_admin
on public.app_settings
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists app_settings_delete_admin on public.app_settings;
create policy app_settings_delete_admin
on public.app_settings
for delete
to authenticated
using (public.is_current_user_admin());

drop policy if exists lineup_versions_select_active_public on public.lineup_versions;
drop policy if exists lineup_versions_select_published_public on public.lineup_versions;
create policy lineup_versions_select_published_public
on public.lineup_versions
for select
to anon, authenticated
using (status in ('active', 'archived'));

drop policy if exists lineup_versions_select_admin on public.lineup_versions;
create policy lineup_versions_select_admin
on public.lineup_versions
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists lineup_versions_insert_admin on public.lineup_versions;
create policy lineup_versions_insert_admin
on public.lineup_versions
for insert
to authenticated
with check (public.is_current_user_admin());

drop policy if exists lineup_versions_update_admin on public.lineup_versions;
create policy lineup_versions_update_admin
on public.lineup_versions
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists lineup_import_runs_select_admin on public.lineup_import_runs;
create policy lineup_import_runs_select_admin
on public.lineup_import_runs
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists lineup_import_runs_insert_admin on public.lineup_import_runs;
create policy lineup_import_runs_insert_admin
on public.lineup_import_runs
for insert
to authenticated
with check (public.is_current_user_admin());

drop policy if exists lineup_import_runs_update_admin on public.lineup_import_runs;
create policy lineup_import_runs_update_admin
on public.lineup_import_runs
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Storage
-- Avatar files are public to read, but users may only write inside their own
-- folder prefix: {auth.uid()}/...

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';

commit;
