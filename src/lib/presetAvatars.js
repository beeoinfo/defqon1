const avatarModules = import.meta.glob('../assets/avatars/*.png', {
  eager: true,
  import: 'default',
});

const extractAvatarNumber = (path) => {
  const match = path.match(/\/(\d+)\.png$/);
  return match ? Number(match[1]) : 9999;
};

export const presetAvatarUrls = Object.entries(avatarModules)
  .sort((a, b) => extractAvatarNumber(a[0]) - extractAvatarNumber(b[0]))
  .map(([, url]) => url);

export function clampPresetAvatarIndex(index) {
  const count = presetAvatarUrls.length;

  if (count === 0) {
    return 1;
  }

  const numericIndex = Number(index);

  if (!Number.isInteger(numericIndex) || numericIndex < 1 || numericIndex > count) {
    return 1;
  }

  return numericIndex;
}

export function getPresetAvatarUrl(index) {
  const safeIndex = clampPresetAvatarIndex(index);
  return presetAvatarUrls[safeIndex - 1] ?? presetAvatarUrls[0] ?? '';
}

export function getRandomPresetAvatarIndex(excludeIndex = null) {
  const count = presetAvatarUrls.length;

  if (count <= 1) {
    return 1;
  }

  const safeExcludeIndex = clampPresetAvatarIndex(excludeIndex);

  let nextIndex = safeExcludeIndex;

  while (nextIndex === safeExcludeIndex) {
    nextIndex = Math.floor(Math.random() * count) + 1;
  }

  return nextIndex;
}

export function resolveProfileAvatarUrl(profile) {
  if (profile?.avatar_kind === 'upload' && profile?.avatar_url) {
    return profile.avatar_url;
  }

  return getPresetAvatarUrl(profile?.avatar_preset ?? 1);
}