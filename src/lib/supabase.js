import { processLock } from '@supabase/auth-js';
import { createClient } from '@supabase/supabase-js';
import { activeSite } from '@/sites/siteDefinitions';
import { getRandomPresetAvatarIndex } from './presetAvatars';

// Initialise the Supabase client if the URL and anon key are provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LINEUP_FUNCTION_BASE_URL = (
  import.meta.env.VITE_LINEUP_FUNCTION_BASE_URL ||
  'https://func-beeoinfo-lineup-prod-dzevggcvbpatf4h5.francecentral-01.azurewebsites.net'
).replace(/\/+$/, '');

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Use an in-process auth lock to avoid noisy browser LockManager
          // recoveries under React StrictMode during local development.
          lock: processLock,
        },
      })
    : null;

// Validation regexes for usernames and passwords
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HIDDEN_AUTH_EMAIL_DOMAIN = 'auth.beeoinfo.local';
const ACTIVE_SITE_SLUG = activeSite.slug;

const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

function dedupeFavoriteItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getFavoriteItemKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getFavoriteItemKey(item) {
  return item?.favoriteKey ?? item?.id ?? null;
}

function compactFavoriteSnapshot(item) {
  return {
    id: item?.id ?? null,
    artistName: item?.artistName ?? item?.artistRaw ?? null,
    artistTokens: Array.isArray(item?.artistTokens) ? item.artistTokens : [],
    stageColor: item?.stageColor ?? null,
    startAt: item?.startAt ?? null,
    endAt: item?.endAt ?? null,
    savedAt: item?.savedAt ?? new Date().toISOString(),
  };
}

function normalizeRemoteFavoriteRows(rows) {
  const items = (rows ?? []).map((row) => {
    const snapshot = row.snapshot ?? {};

    return {
      ...compactFavoriteSnapshot(snapshot),
      favoriteKey: row.favorite_key,
    };
  });

  return items;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image.'));
    };
    image.src = objectUrl;
  });
}

async function convertImageToWebp(file) {
  const image = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not process the selected image.');
  }
  context.drawImage(image, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (!blob) {
    throw new Error('Could not convert the selected image.');
  }
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export async function getStablePayloadHash(payload) {
  return sha256(stableStringify(payload));
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateUsername(value) {
  return USERNAME_REGEX.test(normalizeUsername(value));
}

export function validatePassword(value) {
  return PASSWORD_REGEX.test(String(value ?? ''));
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateEmail(value) {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function buildHiddenAuthEmail(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return '';
  }
  return `${normalizedUsername}@${HIDDEN_AUTH_EMAIL_DOMAIN}`;
}

export async function isUsernameAvailable(username) {
  const client = ensureSupabase();
  const normalizedUsername = normalizeUsername(username);
  const { data, error } = await client.rpc('is_username_available', {
    username_input: normalizedUsername,
  });
  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function signUpWithUsername({ firstName, lastName, username, password }) {
  const client = ensureSupabase();
  const normalizedUsername = normalizeUsername(username);
  const hiddenAuthEmail = buildHiddenAuthEmail(normalizedUsername);
  const avatarPreset = getRandomPresetAvatarIndex();
  if (!validateUsername(normalizedUsername)) {
    throw new Error(
      'Username must contain 3 to 30 characters: lowercase letters, numbers, dot, underscore or dash.'
    );
  }
  if (!validatePassword(password)) {
    throw new Error(
      'Password must contain at least 8 characters, including uppercase, lowercase, number and symbol.'
    );
  }
  const isAvailable = await isUsernameAvailable(normalizedUsername);
  if (!isAvailable) {
    throw new Error('This username is already taken.');
  }
  const { data, error } = await client.auth.signUp({
    email: hiddenAuthEmail,
    password,
    options: {
      data: {
        first_name: String(firstName ?? '').trim(),
        last_name: String(lastName ?? '').trim(),
        auth_email: hiddenAuthEmail,
        username: normalizedUsername,
        avatar_kind: 'preset',
        avatar_preset: avatarPreset,
      },
    },
  });
  if (error) {
    throw error;
  }
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    requiresEmailConfirmation: !data.session,
  };
}

export async function signInWithUsername({ username, password }) {
  const client = ensureSupabase();
  const rawIdentifier = String(username ?? '').trim();
  const normalizedUsername = normalizeUsername(rawIdentifier);
  const normalizedEmail = normalizeEmail(rawIdentifier);

  if (validateEmail(normalizedEmail)) {
    const { data: signInData, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      throw error;
    }
    return signInData.user;
  }

  if (!validateUsername(normalizedUsername)) {
    throw new Error('Enter a valid username or email address.');
  }
  let authEmail = '';
  const { data, error: lookupError } = await client.rpc('get_auth_email_for_username', {
    username_input: normalizedUsername,
  });
  if (!lookupError) {
    authEmail = String(data ?? '').trim().toLowerCase();
  } else {
    const message = String(lookupError.message ?? '').toLowerCase();
    const isMissingFunction =
      message.includes('get_auth_email_for_username') &&
      (message.includes('schema cache') || message.includes('does not exist'));

    if (!isMissingFunction) {
      throw lookupError;
    }
  }
  if (!authEmail) {
    authEmail = buildHiddenAuthEmail(normalizedUsername);
  }
  const { data: signInData, error } = await client.auth.signInWithPassword({
    email: authEmail,
    password,
  });
  if (error) {
    throw error;
  }
  return signInData.user;
}

export async function signOutCurrentUser() {
  const client = ensureSupabase();
  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const client = ensureSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    const message = String(sessionError.message || '').toLowerCase();
    if (message.includes('auth session missing')) {
      return null;
    }
    throw sessionError;
  }
  const session = sessionData?.session ?? null;
  if (!session) {
    return null;
  }
  return session.user ?? null;
}

function buildProfilePayloadFromUser(user) {
  const metadata = user?.user_metadata ?? {};
  return {
    id: user.id,
    auth_email: String(metadata.auth_email ?? user.email ?? '').trim().toLowerCase(),
    first_name: String(metadata.first_name ?? '').trim(),
    last_name: String(metadata.last_name ?? '').trim(),
    username: normalizeUsername(
      metadata.username ?? `user-${user.id.slice(0, 8)}`
    ),
    avatar_kind: 'preset',
    avatar_preset: Number(metadata.avatar_preset) || getRandomPresetAvatarIndex(),
  };
}

async function ensureProfileRow(user) {
  const client = ensureSupabase();
  const { data: existingProfile, error: existingError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (existingError) {
    throw existingError;
  }
  if (existingProfile) {
    return existingProfile;
  }
  const payload = buildProfilePayloadFromUser(user);
  const { error: insertError } = await client.from('profiles').insert(payload);
  if (insertError) {
    throw insertError;
  }
  const { data: createdProfile, error: createdProfileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (createdProfileError) {
    throw createdProfileError;
  }
  return createdProfile;
}

export async function loadAccountBundle(userId, authUser = null) {
  const client = ensureSupabase();
  const profilePromise = authUser
    ? ensureProfileRow(authUser)
    : client.from('profiles').select('*').eq('id', userId).maybeSingle();
  const favoritesPromise = client
    .from('user_favorites')
    .select('favorite_key, snapshot')
    .eq('user_id', userId)
    .eq('site_slug', ACTIVE_SITE_SLUG);
  const [profileResult, favoritesResult] = await Promise.all([profilePromise, favoritesPromise]);
  const profile = authUser ? profileResult : profileResult.data ?? null;
  const { data: favorites, error: favoritesError } = favoritesResult;
  if (favoritesError) {
    throw favoritesError;
  }
  const favoriteItems = normalizeRemoteFavoriteRows(favorites);

  return {
    profile,
    favorites: favoriteItems,
  };
}

export async function isCurrentUserAdmin() {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('is_current_user_admin');

  if (error) {
    throw error;
  }

  return Boolean(data);
}

function normalizeLineupVersion(row) {
  return {
    id: row.id,
    key: row.id,
    siteSlug: row.site_slug,
    status: row.status,
    versionLabel: row.version_label ?? null,
    payload: row.payload,
    payloadHash: row.payload_hash,
    sourceKind: row.source_kind,
    sourceUrl: row.source_url ?? null,
    sourceHash: row.source_hash ?? null,
    sourceUpdatedAt: row.source_updated_at ?? null,
    detectedChanges: row.detected_changes ?? {},
    importedAt: row.imported_at,
    activatedAt: row.activated_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadPublishedLineupVersions(siteSlug = ACTIVE_SITE_SLUG) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('lineup_versions')
    .select('*')
    .eq('site_slug', siteSlug)
    .in('status', ['active', 'archived'])
    .order('activated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeLineupVersion);
}

export async function loadAdminLineupVersions(siteSlug = ACTIVE_SITE_SLUG) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('lineup_versions')
    .select('*')
    .eq('site_slug', siteSlug)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeLineupVersion);
}

export async function loadLineupImportRuns(siteSlug = ACTIVE_SITE_SLUG) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('lineup_import_runs')
    .select('*')
    .eq('site_slug', siteSlug)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function loadLineupVersion({
  siteSlug = ACTIVE_SITE_SLUG,
  payload,
  payloadHash,
  sourceKind = 'manual',
  sourceUrl = null,
  sourceUpdatedAt = null,
  sourceHash = null,
  detectedChanges = {},
  versionLabel = null,
}) {
  const client = ensureSupabase();
  const resolvedHash = payloadHash || await getStablePayloadHash(payload);
  const { data, error } = await client.rpc('load_lineup_version', {
    site_slug_input: siteSlug,
    payload_input: payload,
    payload_hash_input: resolvedHash,
    source_kind_input: sourceKind,
    source_url_input: sourceUrl,
    source_updated_at_input: sourceUpdatedAt,
    source_hash_input: sourceHash,
    detected_changes_input: detectedChanges,
    version_label_input: versionLabel,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function activateLineupVersion(lineupId) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('activate_lineup_version', {
    lineup_id_input: lineupId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function ignoreLineupVersion(lineupId) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('ignore_lineup_version', {
    lineup_id_input: lineupId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function promoteLatestArchivedLineup(siteSlug = ACTIVE_SITE_SLUG) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('promote_latest_archived_lineup', {
    site_slug_input: siteSlug,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteLineupVersion(lineupId) {
  const client = ensureSupabase();
  const { data, error } = await client.rpc('delete_lineup_version', {
    lineup_id_input: lineupId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function runManualLineupFetch(siteSlug = ACTIVE_SITE_SLUG) {
  const client = ensureSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Authentication required.');
  }

  const url = `${LINEUP_FUNCTION_BASE_URL}/api/lineup/${siteSlug}/run`;
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
  } catch {
    throw new Error(
      `Could not reach the Azure lineup function. Check the Function App CORS allowed origins for ${window.location.origin}.`
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Could not run the lineup fetch.');
  }

  return payload;
}

export function mergeFavoriteItems(localItems, remoteItems) {
  return dedupeFavoriteItems([...(localItems ?? []), ...(remoteItems ?? [])]);
}

export async function syncFavoriteSnapshots(userId, favoriteItems) {
  const client = ensureSupabase();
  const cleanItems = dedupeFavoriteItems(favoriteItems ?? []);
  const { data: existingRows, error: existingError } = await client
    .from('user_favorites')
    .select('favorite_key')
    .eq('user_id', userId)
    .eq('site_slug', ACTIVE_SITE_SLUG);
  if (existingError) {
    throw existingError;
  }
  if (cleanItems.length > 0) {
    const rows = cleanItems.map((item) => ({
      user_id: userId,
      site_slug: ACTIVE_SITE_SLUG,
      favorite_key: getFavoriteItemKey(item),
      snapshot: compactFavoriteSnapshot(item),
    }));
    const { error: upsertError } = await client
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id,site_slug,favorite_key' });
    if (upsertError) {
      throw upsertError;
    }
  }
  const keepKeys = new Set(cleanItems.map((item) => getFavoriteItemKey(item)));
  const deleteKeys = (existingRows ?? [])
    .map((row) => row.favorite_key)
    .filter((favoriteKey) => !keepKeys.has(favoriteKey));
  if (deleteKeys.length > 0) {
    const { error: deleteError } = await client
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('site_slug', ACTIVE_SITE_SLUG)
      .in('favorite_key', deleteKeys);
    if (deleteError) {
      throw deleteError;
    }
  }
}

export async function uploadAvatar({ userId, file, currentAvatarPath }) {
  const client = ensureSupabase();
  if (!file) {
    return { avatar_path: currentAvatarPath ?? null, avatar_url: null };
  }
  if (!AVATAR_TYPES.has(file.type)) {
    throw new Error('Avatar must be a JPEG, PNG, GIF or WEBP file.');
  }
  const preparedFile =
    file.type === 'image/jpeg' || file.type === 'image/png' ? await convertImageToWebp(file) : file;
  const extension = preparedFile.type === 'image/gif' ? 'gif' : 'webp';
  const avatarPath = `${userId}/avatar.${extension}`;
  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(avatarPath, preparedFile, { upsert: true, contentType: preparedFile.type });
  if (uploadError) {
    throw uploadError;
  }
  if (currentAvatarPath && currentAvatarPath !== avatarPath) {
    await client.storage.from('avatars').remove([currentAvatarPath]);
  }
  const { data } = client.storage.from('avatars').getPublicUrl(avatarPath);
  return { avatar_path: avatarPath, avatar_url: data.publicUrl };
}

export async function updateProfileAccount({
  userId,
  currentProfile,
  firstName,
  lastName,
  username,
  avatarMode,
  avatarPreset,
  avatarFile,
}) {
  const client = ensureSupabase();
  const normalizedUsername = normalizeUsername(username);
  if (!validateUsername(normalizedUsername)) {
    throw new Error(
      'Username must contain 3 to 30 characters: lowercase letters, numbers, dot, underscore or dash.'
    );
  }
  if (currentProfile?.username && normalizeUsername(currentProfile.username) !== normalizedUsername) {
    const isAvailable = await isUsernameAvailable(normalizedUsername);
    if (!isAvailable) {
      throw new Error('This username is already taken.');
    }
  }
  let avatarPayload = {
    avatar_kind: currentProfile?.avatar_kind ?? 'preset',
    avatar_preset: currentProfile?.avatar_preset ?? 1,
    avatar_path: currentProfile?.avatar_path ?? null,
    avatar_url: currentProfile?.avatar_url ?? null,
  };
  if (avatarMode === 'upload' && avatarFile) {
    const uploadedAvatar = await uploadAvatar({ userId, file: avatarFile, currentAvatarPath: currentProfile?.avatar_path ?? null });
    avatarPayload = {
      avatar_kind: 'upload',
      avatar_preset: currentProfile?.avatar_preset ?? 1,
      avatar_path: uploadedAvatar.avatar_path ?? null,
      avatar_url: uploadedAvatar.avatar_url ?? null,
    };
  }
  if (avatarMode === 'preset') {
    if (currentProfile?.avatar_path) {
      await client.storage.from('avatars').remove([currentProfile.avatar_path]);
    }
    avatarPayload = {
      avatar_kind: 'preset',
      avatar_preset: avatarPreset,
      avatar_path: null,
      avatar_url: null,
    };
  }
  const updatePayload = {
    first_name: String(firstName ?? '').trim(),
    last_name: String(lastName ?? '').trim(),
    username: normalizedUsername,
    avatar_kind: avatarPayload.avatar_kind,
    avatar_preset: avatarPayload.avatar_preset,
    avatar_path: avatarPayload.avatar_path,
    avatar_url: avatarPayload.avatar_url,
  };
  const { error: profileError } = await client
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);
  if (profileError) {
    throw profileError;
  }
  const { error: authError } = await client.auth.updateUser({
    data: {
      first_name: updatePayload.first_name,
      last_name: updatePayload.last_name,
      username: updatePayload.username,
      avatar_kind: updatePayload.avatar_kind,
      avatar_preset: updatePayload.avatar_preset,
      avatar_url: updatePayload.avatar_url,
    },
  });
  if (authError) {
    throw authError;
  }
  const { data: refreshedProfile, error: refreshedProfileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (refreshedProfileError) {
    throw refreshedProfileError;
  }
  return refreshedProfile;
}

export function normalizeTribeCode(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export async function loadTribeBundle(userId) {
  const client = ensureSupabase();
  const { data: membership, error: membershipError } = await client
    .from('tribe_members')
    .select('tribe_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (membershipError) {
    throw membershipError;
  }
  if (!membership) {
    return null;
  }
  const { data: tribe, error: tribeError } = await client
    .from('tribes')
    .select()
    .eq('id', membership.tribe_id)
    .maybeSingle();
  if (tribeError) {
    throw tribeError;
  }
  if (!tribe) {
    return null;
  }
  const { count, error: countError } = await client
    .from('tribe_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('tribe_id', tribe.id);
  if (countError) {
    throw countError;
  }
  const { data: tribeMembers, error: tribeMembersError } = await client
    .from('tribe_members')
    .select('user_id, role')
    .eq('tribe_id', tribe.id);
  if (tribeMembersError) {
    throw tribeMembersError;
  }
  const memberUserIds = Array.from(
    new Set((tribeMembers ?? []).map((member) => member.user_id).filter(Boolean))
  );
  let memberProfiles = [];
  let memberFavorites = [];
  if (memberUserIds.length > 0) {
    const [{ data: profiles, error: profilesError }, { data: favorites, error: favoritesError }] =
      await Promise.all([
        client
          .from('profiles')
          .select(
            'id, first_name, last_name, username, avatar_kind, avatar_preset, avatar_url, avatar_path'
          )
          .in('id', memberUserIds),
        client
          .from('user_favorites')
          .select('user_id, favorite_key, snapshot')
          .in('user_id', memberUserIds)
          .eq('site_slug', ACTIVE_SITE_SLUG),
      ]);
    if (profilesError) {
      throw profilesError;
    }
    if (favoritesError) {
      throw favoritesError;
    }
    memberProfiles = profiles ?? [];
    memberFavorites = favorites ?? [];
  }
  const profilesById = new Map(memberProfiles.map((profile) => [profile.id, profile]));
  const favoritesByUserId = memberFavorites.reduce((acc, row) => {
    const current = acc.get(row.user_id) ?? [];
    current.push({
      ...compactFavoriteSnapshot(row.snapshot),
      favoriteKey: row.favorite_key,
    });
    acc.set(row.user_id, current);
    return acc;
  }, new Map());
  return {
    tribeId: tribe.id,
    name: tribe.name ?? null,
    code: tribe.code,
    ownerUserId: tribe.owner_user_id,
    createdAt: tribe.created_at,
    role: membership.role,
    isOwner: membership.role === 'owner',
    memberCount: count ?? 1,
    members: (tribeMembers ?? []).map((member) => ({
      userId: member.user_id,
      role: member.role,
      profile: profilesById.get(member.user_id) ?? null,
      favorites: favoritesByUserId.get(member.user_id) ?? [],
    })),
  };
}

function normalizeTribeLocationRow(row) {
  return {
    tribeId: row.tribe_id,
    userId: row.user_id,
    siteSlug: row.site_slug,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    label: row.label ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadTribeMemberLocations({ tribeId, siteSlug = ACTIVE_SITE_SLUG }) {
  const client = ensureSupabase();

  if (!tribeId) {
    return [];
  }

  const { data, error } = await client
    .from('tribe_member_locations')
    .select('*')
    .eq('tribe_id', tribeId)
    .eq('site_slug', siteSlug);

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeTribeLocationRow);
}

export async function upsertCurrentUserTribeLocation({
  tribeId,
  userId,
  longitude,
  latitude,
  label = null,
  siteSlug = ACTIVE_SITE_SLUG,
}) {
  const client = ensureSupabase();
  const nextLongitude = Number(longitude);
  const nextLatitude = Number(latitude);

  if (!tribeId || !userId) {
    throw new Error('A tribe is required to share a map position.');
  }

  if (
    !Number.isFinite(nextLongitude) ||
    !Number.isFinite(nextLatitude) ||
    nextLongitude < -180 ||
    nextLongitude > 180 ||
    nextLatitude < -90 ||
    nextLatitude > 90
  ) {
    throw new Error('The selected map position is invalid.');
  }

  const { data, error } = await client
    .from('tribe_member_locations')
    .upsert({
      tribe_id: tribeId,
      user_id: userId,
      site_slug: siteSlug,
      longitude: nextLongitude,
      latitude: nextLatitude,
      label: label ? String(label).trim().slice(0, 80) : null,
    }, { onConflict: 'tribe_id,user_id,site_slug' })
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeTribeLocationRow(data) : null;
}

export async function deleteCurrentUserTribeLocation({
  tribeId,
  userId,
  siteSlug = ACTIVE_SITE_SLUG,
}) {
  const client = ensureSupabase();

  if (!tribeId || !userId) {
    return;
  }

  const { error } = await client
    .from('tribe_member_locations')
    .delete()
    .eq('tribe_id', tribeId)
    .eq('user_id', userId)
    .eq('site_slug', siteSlug);

  if (error) {
    throw error;
  }
}

export function subscribeToTribeMemberLocations({
  tribeId,
  onChange,
  siteSlug = ACTIVE_SITE_SLUG,
}) {
  if (!supabase || !tribeId) {
    return null;
  }

  const channel = supabase
    .channel(`tribe-member-locations:${siteSlug}:${tribeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tribe_member_locations',
        filter: `tribe_id=eq.${tribeId}`,
      },
      (payload) => {
        if (
          payload?.new?.site_slug === siteSlug ||
          payload?.old?.site_slug === siteSlug
        ) {
          onChange?.(payload);
        }
      }
    )
    .subscribe();

  return channel;
}

export async function updateCurrentUserTribeName({ tribeId, name }) {
  const client = ensureSupabase();
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }
  const nextName = String(name ?? '').trim().slice(0, 48);
  if (!nextName) {
    throw new Error('Please enter a tribe name.');
  }
  const { data, error } = await client
    .from('tribes')
    .update({ name: nextName })
    .eq('id', tribeId)
    .select()
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Could not rename the tribe.');
  }
  return loadTribeBundle(user.id);
}

export async function createCurrentUserTribe(name) {
  const client = ensureSupabase();
  const { error } = await client.rpc('create_current_user_tribe');
  if (error) {
    throw error;
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }
  const tribe = await loadTribeBundle(user.id);
  const nextName = String(name ?? '').trim();
  if (!tribe || !nextName) {
    return tribe;
  }
  try {
    return await updateCurrentUserTribeName({ tribeId: tribe.tribeId, name: nextName });
  } catch {
    return tribe;
  }
}

export async function joinCurrentUserTribeByCode(code) {
  const client = ensureSupabase();
  const normalizedCode = normalizeTribeCode(code);
  if (!normalizedCode) {
    throw new Error('Please enter a tribe code.');
  }
  const { error } = await client.rpc('join_current_user_tribe', { code_input: normalizedCode });
  if (error) {
    throw error;
  }
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }
  return loadTribeBundle(user.id);
}

export async function leaveCurrentUserTribe() {
  const client = ensureSupabase();
  const { error } = await client.rpc('leave_current_user_tribe');
  if (error) {
    throw error;
  }
  return null;
}
