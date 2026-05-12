-- Patch: add global user language preference.
-- Safe to run multiple times on an existing Supabase project.

alter table public.profiles
  add column if not exists preferred_language text default 'en';

update public.profiles
set preferred_language = case
  when lower(trim(coalesce(preferred_language, ''))) in ('en', 'fr')
    then lower(trim(preferred_language))
  else 'en'
end
where preferred_language is null
  or preferred_language not in ('en', 'fr')
  or preferred_language is distinct from lower(trim(coalesce(preferred_language, '')));

alter table public.profiles
  alter column preferred_language set default 'en';

alter table public.profiles
  alter column preferred_language set not null;

alter table public.profiles
  drop constraint if exists profiles_preferred_language_check;

alter table public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('en', 'fr'));

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
    avatar_preset,
    preferred_language
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
    1,
    case
      when lower(trim(coalesce(new.raw_user_meta_data ->> 'preferred_language', ''))) in ('en', 'fr')
        then lower(trim(new.raw_user_meta_data ->> 'preferred_language'))
      else 'en'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

insert into public.profiles (
  id,
  auth_email,
  first_name,
  last_name,
  username,
  avatar_kind,
  avatar_preset,
  preferred_language
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
  end,
  case
    when lower(trim(coalesce(p.preferred_language, ''))) in ('en', 'fr')
      then lower(trim(p.preferred_language))
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'preferred_language', ''))) in ('en', 'fr')
      then lower(trim(u.raw_user_meta_data ->> 'preferred_language'))
    else 'en'
  end
from auth.users u
left join public.profiles p
  on p.id = u.id
on conflict (id) do update
set
  preferred_language = case
    when public.profiles.preferred_language in ('en', 'fr') then public.profiles.preferred_language
    else excluded.preferred_language
  end;
