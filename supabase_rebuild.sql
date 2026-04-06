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
  favorite_key text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, favorite_key)
);

alter table public.user_favorites
  add column if not exists snapshot jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.user_favorites
  alter column created_at set default now(),
  alter column updated_at set default now();

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

create unique index if not exists tribe_members_one_owner_per_tribe_idx
  on public.tribe_members (tribe_id)
  where role = 'owner';

-- This partial unique index guarantees at most one owner per tribe.

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
    when coalesce(avatar_preset, 0) between 1 and 34 then avatar_preset
    else floor(random() * 34 + 1)::int
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
  or coalesce(avatar_preset, 0) not between 1 and 34
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
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  created_at is null
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
  alter column snapshot set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

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
  check (avatar_preset between 1 and 34);

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
    floor(random() * 34 + 1)::int
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
    when coalesce(p.avatar_preset, 0) between 1 and 34 then p.avatar_preset
    else floor(random() * 34 + 1)::int
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
    when coalesce(public.profiles.avatar_preset, 0) between 1 and 34 then public.profiles.avatar_preset
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

-- Grants
-- Keep table privileges minimal and rely on RLS for row-level filtering.

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.tribes from public, anon, authenticated;
revoke all on table public.tribe_members from public, anon, authenticated;
revoke all on table public.user_favorites from public, anon, authenticated;
revoke all on table public.avatar_cleanup_queue from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, update on table public.tribes to authenticated;
grant select on table public.tribe_members to authenticated;
grant select, insert, update, delete on table public.user_favorites to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.tribes to service_role;
grant all on table public.tribe_members to service_role;
grant all on table public.user_favorites to service_role;
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

-- RLS
-- Members can read profiles and favorites from their own tribe, while writes
-- stay limited to each user's own rows unless stated otherwise.

alter table public.profiles enable row level security;
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.user_favorites enable row level security;

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
