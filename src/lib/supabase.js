import { processLock } from '@supabase/auth-js';
import { createClient } from '@supabase/supabase-js';
import { getRandomPresetAvatarIndex } from './presetAvatars';

// Initialise the Supabase client if the URL and anon key are provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const COMPACT_FAVORITE_SNAPSHOT_KEYS = new Set([
  'id',
  'artistName',
  'artistTokens',
  'stageColor',
  'startAt',
  'endAt',
  'savedAt',
]);

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
  if (item?.favoriteKey || item?.hash || item?.id) {
    return item.favoriteKey ?? item.hash ?? item.id;
  }

  if (item?.daySlug || item?.stageSlug || item?.artistSlug) {
    return `${item.daySlug}-${item.stageSlug}-${item.artistSlug}`;
  }

  return null;
}

function compactFavoriteSnapshot(item, { resetSchedule = false } = {}) {
  return {
    id: item?.id ?? null,
    artistName: item?.artistName ?? item?.artistRaw ?? null,
    artistTokens: Array.isArray(item?.artistTokens) ? item.artistTokens : [],
    stageColor: item?.stageColor ?? null,
    startAt: resetSchedule ? null : item?.startAt ?? null,
    endAt: resetSchedule ? null : item?.endAt ?? null,
    savedAt: item?.savedAt ?? new Date().toISOString(),
  };
}

function isLegacyFavoriteSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return true;
  }

  return Object.keys(snapshot).some((key) => !COMPACT_FAVORITE_SNAPSHOT_KEYS.has(key));
}

function normalizeRemoteFavoriteRows(rows) {
  let hasLegacySnapshots = false;
  const items = (rows ?? []).map((row) => {
    const snapshot = row.snapshot ?? {};
    const shouldResetSchedule = isLegacyFavoriteSnapshot(snapshot);

    if (shouldResetSchedule) {
      hasLegacySnapshots = true;
    }

    return {
      ...compactFavoriteSnapshot(snapshot, { resetSchedule: shouldResetSchedule }),
      favoriteKey: row.favorite_key,
    };
  });

  return { items, hasLegacySnapshots };
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
    avatar_preset: getRandomPresetAvatarIndex(),
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
    .eq('user_id', userId);
  const [profileResult, favoritesResult] = await Promise.all([profilePromise, favoritesPromise]);
  const profile = authUser ? profileResult : profileResult.data ?? null;
  const { data: favorites, error: favoritesError } = favoritesResult;
  if (favoritesError) {
    throw favoritesError;
  }
  const { items: favoriteItems, hasLegacySnapshots } = normalizeRemoteFavoriteRows(favorites);

  if (hasLegacySnapshots && favoriteItems.length > 0) {
    const rows = favoriteItems.map((item) => ({
      user_id: userId,
      favorite_key: item.favoriteKey,
      snapshot: compactFavoriteSnapshot(item),
    }));
    const { error: migrationError } = await client
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id,favorite_key' });

    if (migrationError) {
      throw migrationError;
    }
  }

  return {
    profile,
    favorites: favoriteItems,
  };
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
    .eq('user_id', userId);
  if (existingError) {
    throw existingError;
  }
  if (cleanItems.length > 0) {
    const rows = cleanItems.map((item) => ({
      user_id: userId,
      favorite_key: getFavoriteItemKey(item),
      snapshot: compactFavoriteSnapshot(item),
    }));
    const { error: upsertError } = await client
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id,favorite_key' });
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
          .in('user_id', memberUserIds),
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
