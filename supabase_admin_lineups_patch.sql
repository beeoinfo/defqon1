begin;

-- Patch for existing Supabase environments.
-- Run this once, then bootstrap your admin user with:
-- insert into public.app_admins (user_id, note)
-- values ('YOUR_AUTH_USER_ID_HERE', 'Project owner')
-- on conflict (user_id) do update set is_active = true, note = excluded.note;

create extension if not exists pgcrypto;

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

update public.app_admins
set
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where is_active is null or created_at is null or updated_at is null;

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

alter table public.app_admins
  alter column is_active set not null,
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

alter table public.lineup_versions
  drop constraint if exists lineup_versions_status_check;
alter table public.lineup_versions
  add constraint lineup_versions_status_check
  check (status in ('pending', 'active', 'archived'));

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_admins_set_updated_at on public.app_admins;
create trigger app_admins_set_updated_at
before update on public.app_admins
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

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins a
    where a.user_id = auth.uid()
      and a.is_active = true
  );
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

  select * into existing_lineup
  from public.lineup_versions
  where site_slug = normalized_site_slug
    and payload_hash = normalized_payload_hash;

  if existing_lineup.id is not null then
    insert into public.lineup_import_runs (
      site_slug, status, source_kind, source_url, source_updated_at, source_hash,
      payload_hash, lineup_version_id, change_summary, triggered_by, finished_at
    )
    values (
      normalized_site_slug, 'no_change', normalized_source_kind,
      nullif(trim(coalesce(source_url_input, '')), ''), source_updated_at_input,
      nullif(trim(coalesce(source_hash_input, '')), ''), normalized_payload_hash,
      existing_lineup.id,
      jsonb_build_object(
        'reason', 'duplicate_payload_hash',
        'existing_status', existing_lineup.status
      ),
      current_uid, now()
    );

    return existing_lineup.id;
  end if;

  insert into public.lineup_versions (
    site_slug, status, version_label, payload, payload_hash, source_kind,
    source_url, source_updated_at, source_hash, detected_changes,
    imported_by, imported_at
  )
  values (
    normalized_site_slug, 'pending', nullif(trim(coalesce(version_label_input, '')), ''),
    payload_input, normalized_payload_hash, normalized_source_kind,
    nullif(trim(coalesce(source_url_input, '')), ''), source_updated_at_input,
    nullif(trim(coalesce(source_hash_input, '')), ''),
    coalesce(detected_changes_input, '{}'::jsonb), current_uid, now()
  )
  returning id into lineup_id;

  insert into public.lineup_import_runs (
    site_slug, status, source_kind, source_url, source_updated_at, source_hash,
    payload_hash, lineup_version_id, change_summary, triggered_by, finished_at
  )
  values (
    normalized_site_slug, 'loaded', normalized_source_kind,
    nullif(trim(coalesce(source_url_input, '')), ''), source_updated_at_input,
    nullif(trim(coalesce(source_hash_input, '')), ''), normalized_payload_hash,
    lineup_id, coalesce(detected_changes_input, '{}'::jsonb), current_uid, now()
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

  select * into target_lineup
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
  set status = 'archived'
  where site_slug = target_lineup.site_slug
    and status = 'active'
    and id <> target_lineup.id;

  update public.lineup_versions
  set status = 'active', activated_at = now(), activated_by = current_uid
  where id = target_lineup.id;

  insert into public.lineup_import_runs (
    site_slug, status, source_kind, source_url, source_updated_at, source_hash,
    payload_hash, lineup_version_id, change_summary, triggered_by, finished_at
  )
  values (
    target_lineup.site_slug, 'loaded', target_lineup.source_kind,
    target_lineup.source_url, target_lineup.source_updated_at, target_lineup.source_hash,
    target_lineup.payload_hash, target_lineup.id, target_lineup.detected_changes,
    current_uid, now()
  );

  return target_lineup.id;
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

  select * into target_lineup
  from public.lineup_versions
  where id = lineup_id_input
  for update;

  if target_lineup.id is null then
    raise exception 'Lineup version not found.';
  end if;

  delete from public.lineup_versions
  where id = target_lineup.id;

  return target_lineup.id;
end;
$$;

drop function if exists public.create_lineup_candidate(text, jsonb, text, text, text, timestamptz, text, jsonb, text);
drop function if exists public.reject_lineup_candidate(uuid);

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.app_admins from public, anon, authenticated;
revoke all on table public.lineup_versions from public, anon, authenticated;
revoke all on table public.lineup_import_runs from public, anon, authenticated;

grant select on table public.app_admins to authenticated;
grant select on table public.lineup_versions to anon, authenticated;
grant select, insert, update on table public.lineup_import_runs to authenticated;

grant all on table public.app_admins to service_role;
grant all on table public.lineup_versions to service_role;
grant all on table public.lineup_import_runs to service_role;

revoke all on function public.is_current_user_admin() from public;
revoke all on function public.is_current_user_admin() from anon;
grant execute on function public.is_current_user_admin() to authenticated;

revoke all on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) to authenticated;
grant execute on function public.load_lineup_version(text, jsonb, text, text, text, timestamptz, text, jsonb, text) to service_role;

revoke all on function public.activate_lineup_version(uuid) from public, anon, authenticated;
grant execute on function public.activate_lineup_version(uuid) to authenticated;
grant execute on function public.activate_lineup_version(uuid) to service_role;

revoke all on function public.delete_lineup_version(uuid) from public, anon, authenticated;
grant execute on function public.delete_lineup_version(uuid) to authenticated;
grant execute on function public.delete_lineup_version(uuid) to service_role;

alter table public.app_admins enable row level security;
alter table public.lineup_versions enable row level security;
alter table public.lineup_import_runs enable row level security;

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

notify pgrst, 'reload schema';

commit;
