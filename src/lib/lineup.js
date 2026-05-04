import { activeSite } from '@/sites/siteDefinitions';
import { getCanonicalStageName } from './stageThemes';

const SITE_STORAGE_PREFIX = activeSite.slug;

export const FAVORITES_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-favorites`;
export const VIEW_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-view`;
export const HIDE_PAST_EVENTS_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-hidePastEvents`;
export const HIDE_UNDATED_EVENTS_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-hideUndatedEvents`;
export const IGNORE_SMALL_CONFLICTS_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-ignoreSmallConflicts`;
export const BETA_FEATURES_STORAGE_KEY = `${SITE_STORAGE_PREFIX}-beta-features`;

export const REVIEW_SECTION_MESSAGE =
  'Some saved favorites seem to have moved around. We kept your previous schedule below and checked the latest lineup for tag-based suggestions.';

const DAY_LABELS = {
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DAY_ORDERS = {
  thursday: 1,
  friday: 2,
  saturday: 3,
  sunday: 4,
};
const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function slugifyValue(value) {
  return normalizeText(value)
    .replace(/['".,()!:+/\\]/g, ' ')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function normalizeComparableValue(value) {
  return normalizeText(value).replace(/\s+/g, ' ');
}

function valuesMatch(leftValue, rightValue) {
  return normalizeComparableValue(leftValue) === normalizeComparableValue(rightValue);
}

function slugsMatch(leftValue, rightValue) {
  return slugifyValue(leftValue) === slugifyValue(rightValue);
}

function getComparableStageName(stage) {
  return normalizeComparableValue(getCanonicalStageName(stage));
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function dedupeBy(items, getKey) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function compareLineupEntries(leftEntry, rightEntry) {
  return (
    (leftEntry.dayOrder ?? 999) - (rightEntry.dayOrder ?? 999) ||
    (leftEntry.stageOrder ?? 999) - (rightEntry.stageOrder ?? 999) ||
    String(leftEntry.stage ?? '').localeCompare(String(rightEntry.stage ?? '')) ||
    (leftEntry.artistOrder ?? 999) - (rightEntry.artistOrder ?? 999) ||
    String(leftEntry.startAt ?? '').localeCompare(String(rightEntry.startAt ?? '')) ||
    getEntryDisplayName(leftEntry).localeCompare(getEntryDisplayName(rightEntry))
  );
}

function buildLegacyStageSlug(stage) {
  return slugifyValue(stage).replace(/^u-v$/, 'uv');
}

function prettifySlug(slug) {
  return String(slug ?? '')
    .split('-')
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 3) {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function buildFavoriteKeyFromSnapshot(snapshot) {
  return (
    snapshot.favoriteKey ??
    `fav:${snapshot.hash ?? snapshot.id ?? `${snapshot.daySlug}-${snapshot.stageSlug}-${snapshot.artistSlug}`}`
  );
}

function sanitizeArtistTags(item) {
  if (Array.isArray(item.artistTags)) {
    return uniqueStrings(item.artistTags.map((tag) => String(tag).trim()));
  }

  if (Array.isArray(item.artists)) {
    return uniqueStrings(item.artists.map((tag) => String(tag).trim()));
  }

  if (item.artistRaw) {
    return [String(item.artistRaw).trim()];
  }

  if (item.artistName) {
    return [String(item.artistName).trim()];
  }

  return [];
}

function sanitizeArtistTokens(item, artistTags) {
  if (Array.isArray(item.artistTokens)) {
    return uniqueStrings(item.artistTokens.map((token) => String(token).trim().toLowerCase()));
  }

  return uniqueStrings(
    artistTags
      .map((tag) => slugifyValue(tag))
      .filter(Boolean)
  );
}

function buildSnapshotFromEntry(entry, overrides = {}) {
  const artistTags = sanitizeArtistTags(entry);
  const artistTokens = sanitizeArtistTokens(entry, artistTags);
  const snapshot = {
    favoriteKey: overrides.favoriteKey,
    legacyId: overrides.legacyId ?? null,
    id: entry.id ?? null,
    hash: entry.hash ?? null,
    daySlug: entry.daySlug ?? slugifyValue(entry.day),
    dayOrder: entry.dayOrder ?? DAY_ORDERS[entry.daySlug] ?? null,
    stage: entry.stage ?? 'Unknown stage',
    stageSlug: entry.stageSlug ?? buildLegacyStageSlug(entry.stage),
    stageOrder: entry.stageOrder ?? null,
    stageCanonical:
      entry.stageCanonical ??
      getCanonicalStageName(entry.stage ?? ''),
    stageColor: entry.stageColor ?? null,
    artistName: entry.artistName ?? entry.artistRaw ?? entry.rawName ?? '',
    artistRaw: entry.artistRaw ?? entry.artistName ?? entry.rawName ?? '',
    artistSlug: entry.artistSlug ?? slugifyValue(entry.artistName ?? entry.artistRaw ?? entry.rawName),
    artistOrder: entry.artistOrder ?? null,
    artistTags,
    artistTokens,
    startAt: entry.startAt ?? null,
    endAt: entry.endAt ?? null,
    timeLabel: entry.timeLabel ?? null,
    savedAt: overrides.savedAt ?? entry.savedAt ?? new Date().toISOString(),
  };

  snapshot.favoriteKey = buildFavoriteKeyFromSnapshot(snapshot);
  return snapshot;
}

function buildCompactFavoriteSnapshot(item, overrides = {}) {
  return {
    favoriteKey: item.favoriteKey ?? overrides.favoriteKey,
    id: item.id ?? null,
    artistName: item.artistName ?? item.artistRaw ?? '',
    artistTokens: Array.isArray(overrides.artistTokens)
      ? overrides.artistTokens
      : Array.isArray(item.artistTokens)
        ? item.artistTokens
        : [],
    stageColor: item.stageColor ?? overrides.stageColor ?? null,
    startAt: overrides.startAt ?? item.startAt ?? null,
    endAt: overrides.endAt ?? item.endAt ?? null,
    savedAt: overrides.savedAt ?? item.savedAt ?? new Date().toISOString(),
  };
}

function buildStageMetaIndex(entries) {
  const index = new Map();

  entries.forEach((entry) => {
    const stageSlug = buildLegacyStageSlug(entry.stage);

    if (!index.has(stageSlug)) {
      index.set(stageSlug, {
        stage: entry.stage,
        stageCanonical:
          entry.stageCanonical ?? getCanonicalStageName(entry.stage),
      });
    }
  });

  return index;
}

function parseLegacyFavoriteId(legacyId, entries) {
  if (typeof legacyId !== 'string') {
    return null;
  }

  const firstDashIndex = legacyId.indexOf('-');

  if (firstDashIndex === -1) {
    return null;
  }

  const daySlug = legacyId.slice(0, firstDashIndex);
  const rest = legacyId.slice(firstDashIndex + 1);

  if (!DAY_LABELS[daySlug] || !rest) {
    return null;
  }

  const stageIndex = buildStageMetaIndex(entries);
  const stageSlugs = Array.from(stageIndex.keys()).sort((a, b) => b.length - a.length);

  const matchedStageSlug = stageSlugs.find(
    (stageSlug) => rest === stageSlug || rest.startsWith(`${stageSlug}-`)
  );

  if (!matchedStageSlug) {
    return {
      legacyId,
      daySlug,
      stageSlug: null,
      stage: 'Unknown stage',
      stageCanonical: null,
      artistSlug: rest,
      artistRaw: prettifySlug(rest),
      artistTags: [prettifySlug(rest)],
      artistTokens: uniqueStrings(rest.split('-').filter(Boolean)),
      timeLabel: null,
    };
  }

  const stageMeta = stageIndex.get(matchedStageSlug);
  const artistSlug = rest.slice(matchedStageSlug.length + 1);

  return {
    legacyId,
    daySlug,
    stageSlug: matchedStageSlug,
    stage: stageMeta.stage,
    stageCanonical: stageMeta.stageCanonical,
    artistSlug,
    artistRaw: prettifySlug(artistSlug),
    artistTags: [prettifySlug(artistSlug)],
    artistTokens: uniqueStrings(artistSlug.split('-').filter(Boolean)),
    timeLabel: null,
  };
}

function findEntryForLegacyId(legacyId, entries) {
  const parsed = parseLegacyFavoriteId(legacyId, entries);

  if (!parsed) {
    return null;
  }

  return (
    entries.find((entry) => {
      const entryStageSlug = buildLegacyStageSlug(entry.stage);

      return (
        slugsMatch(entry.daySlug, parsed.daySlug) &&
        slugsMatch(entryStageSlug, parsed.stageSlug) &&
        slugsMatch(entry.artistSlug, parsed.artistSlug)
      );
    }) ?? null
  );
}

function buildLegacySnapshot(legacyId, previousEntries, currentEntries) {
  const previousMatch = findEntryForLegacyId(legacyId, previousEntries);

  if (previousMatch) {
    return buildSnapshotFromEntry(previousMatch, {
      favoriteKey: `legacy:${legacyId}`,
      legacyId,
    });
  }

  const currentMatch = findEntryForLegacyId(legacyId, currentEntries);

  if (currentMatch) {
    return buildSnapshotFromEntry(currentMatch, {
      favoriteKey: `legacy:${legacyId}`,
      legacyId,
    });
  }

  const parsed = parseLegacyFavoriteId(legacyId, [...previousEntries, ...currentEntries]);

  if (!parsed) {
    return null;
  }

  return buildSnapshotFromEntry(
    {
      id: null,
      hash: null,
      daySlug: parsed.daySlug,
      dayOrder: DAY_ORDERS[parsed.daySlug] ?? null,
      stage: parsed.stage,
      stageSlug: parsed.stageSlug ?? slugifyValue(parsed.stage),
      stageCanonical: parsed.stageCanonical,
      artistRaw: parsed.artistRaw,
      artistSlug: parsed.artistSlug,
      artistTags: parsed.artistTags,
      artistTokens: parsed.artistTokens,
      startAt: null,
      endAt: null,
      timeLabel: parsed.timeLabel,
    },
    {
      favoriteKey: `legacy:${legacyId}`,
      legacyId,
    }
  );
}

function normalizeStoredSnapshot(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const artistTags = sanitizeArtistTags(item);
  const artistTokens = sanitizeArtistTokens(item, artistTags);

  const snapshot = {
    favoriteKey: item.favoriteKey,
    legacyId: item.legacyId ?? null,
    id: item.id ?? null,
    hash: item.hash ?? null,
    daySlug: item.daySlug ?? slugifyValue(item.day),
    dayOrder:
      item.dayOrder ??
      DAY_ORDERS[item.daySlug ?? slugifyValue(item.day)] ??
      null,
    stage: item.stage ?? 'Unknown stage',
    stageSlug: item.stageSlug ?? buildLegacyStageSlug(item.stage),
    stageOrder: item.stageOrder ?? null,
    stageCanonical:
      item.stageCanonical ??
      (item.stage ? getCanonicalStageName(item.stage) : null),
    stageColor: item.stageColor ?? null,
    artistName: item.artistName ?? item.artistRaw ?? item.rawName ?? '',
    artistRaw: item.artistRaw ?? item.artistName ?? item.rawName ?? '',
    artistSlug: item.artistSlug ?? slugifyValue(item.artistName ?? item.artistRaw ?? item.rawName),
    artistOrder: item.artistOrder ?? null,
    artistTags,
    artistTokens,
    startAt: item.startAt ?? null,
    endAt: item.endAt ?? null,
    timeLabel: item.timeLabel ?? null,
    savedAt: item.savedAt ?? new Date().toISOString(),
  };

  snapshot.favoriteKey = buildFavoriteKeyFromSnapshot(snapshot);
  return snapshot;
}

function extractRawFavoriteItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.ids) || Array.isArray(payload?.legacy)) {
    return [...(payload.ids ?? []), ...(payload.legacy ?? [])];
  }

  return [];
}

function normalizeFavoriteItems(rawItems, currentEntries, previousEntries) {
  const normalized = rawItems
    .map((item) => {
      if (typeof item === 'string') {
        const currentExactMatch = currentEntries.find((entry) => entry.id === item);

        if (currentExactMatch) {
          return buildSnapshotFromEntry(currentExactMatch);
        }

        return buildLegacySnapshot(item, previousEntries, currentEntries);
      }

      return normalizeStoredSnapshot(item);
    })
    .filter(Boolean);

  return dedupeBy(normalized, (item) => item.favoriteKey);
}

function buildSavedTokenSet(snapshot) {
  return new Set((snapshot.artistTokens ?? []).map((token) => String(token).toLowerCase()));
}

function buildSavedTagSet(snapshot) {
  return new Set((snapshot.artistTags ?? []).map((tag) => normalizeText(tag)));
}

export function getReviewSuggestions(savedFavorite, entries) {
  const savedTokens = buildSavedTokenSet(savedFavorite);
  const savedTags = buildSavedTagSet(savedFavorite);

  return entries
    .map((entry) => {
      const tokenOverlap = entry.artistTokens.filter((token) =>
        savedTokens.has(String(token).toLowerCase())
      ).length;

      const tagOverlap = entry.artistTags.filter((tag) =>
        savedTags.has(normalizeText(tag))
      ).length;

      if (tokenOverlap === 0 && tagOverlap === 0) {
        return null;
      }

      const score =
        tokenOverlap * 100 +
        tagOverlap * 25 +
        (savedFavorite.stageCanonical &&
        getComparableStageName(entry.stageCanonical) === getComparableStageName(savedFavorite.stageCanonical)
          ? 5
          : 0) +
        (savedFavorite.daySlug && slugsMatch(entry.daySlug, savedFavorite.daySlug) ? 2 : 0);

      return { entry, score };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score ||
        compareLineupEntries(a.entry, b.entry)
    )
    .slice(0, 5)
    .map(({ entry }) => entry);
}

export function validateLineupPayload(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Lineup entries must be a non-empty array.');
  }

  payload.forEach((entry, index) => {
    if (!entry.id || typeof entry.id !== 'string') {
      throw new Error(`Invalid entry id at index ${index}.`);
    }

    if (!entry.hash || typeof entry.hash !== 'string') {
      throw new Error(`Invalid entry hash for ${entry.id}.`);
    }

    if (!entry.daySlug || typeof entry.daySlug !== 'string') {
      throw new Error(`Invalid entry daySlug for ${entry.id}.`);
    }

    if (!entry.stage || typeof entry.stage !== 'string') {
      throw new Error(`Invalid entry stage for ${entry.id}.`);
    }

    if (!entry.stageCanonical || typeof entry.stageCanonical !== 'string') {
      throw new Error(`Invalid entry stageCanonical for ${entry.id}.`);
    }

    if (!getEntryDisplayName(entry)) {
      throw new Error(`Invalid entry artistName for ${entry.id}.`);
    }

    if (!entry.artistSlug || typeof entry.artistSlug !== 'string') {
      throw new Error(`Invalid entry artistSlug for ${entry.id}.`);
    }

    if (!Array.isArray(entry.artistTags)) {
      throw new Error(`Invalid artistTags array for ${entry.id}.`);
    }

    if (!Array.isArray(entry.artistTokens)) {
      throw new Error(`Invalid artistTokens array for ${entry.id}.`);
    }
  });

  return true;
}

export function getDayLabel(daySlug) {
  return DAY_LABELS[daySlug] ?? String(daySlug ?? '');
}

export function getEntryDayLabel(entry) {
  return getDayLabel(entry.daySlug);
}

export function getEntryDisplayName(entry) {
  return entry.artistName ?? entry.artistRaw ?? '';
}

export function getEntryMetaLabel(entry) {
  const parts = [entry.stage, getEntryDayLabel(entry)];
  const timeLabel = getEntryTimeLabel(entry);

  if (timeLabel) {
    parts.push(timeLabel);
  }

  return parts.filter(Boolean).join(' • ');
}

export function getSavedFavoritePreviousLabel(savedFavorite) {
  const parts = [getDayLabel(savedFavorite.daySlug), savedFavorite.stage];

  if (savedFavorite.timeLabel) {
    parts.push(savedFavorite.timeLabel);
  }

  return parts.filter(Boolean).join(' • ');
}

export function getDays(entries) {
  const orderedDaySlugs = dedupeBy(
    entries
      .slice()
      .sort((a, b) => (a.dayOrder ?? 999) - (b.dayOrder ?? 999)),
    (entry) => entry.daySlug
  ).map((entry) => entry.daySlug);

  return orderedDaySlugs.map((daySlug) => getDayLabel(daySlug));
}

export function getDefaultDay(entries) {
  const days = getDays(entries);
  return days[0] || 'Thursday';
}

export function getStages(entries, dayFilter = 'All days') {
  const filtered =
    dayFilter === 'All days'
      ? entries
      : entries.filter((entry) => valuesMatch(getEntryDayLabel(entry), dayFilter));

  const stagesByKey = new Map();

  filtered.slice().sort(compareLineupEntries).forEach((entry) => {
    const stageName = entry.stageCanonical ?? entry.stage;
    const canonicalStageName = getCanonicalStageName(stageName);
    const stageKey = getComparableStageName(canonicalStageName);

    if (stageKey && !stagesByKey.has(stageKey)) {
      stagesByKey.set(stageKey, canonicalStageName);
    }
  });

  return Array.from(stagesByKey.values());
}

export function matchesSelectedStage(entryStage, selectedStage) {
  if (selectedStage === 'All stages') {
    return true;
  }

  return getComparableStageName(entryStage) === getComparableStageName(selectedStage);
}

function parseEntryDateTime(value) {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getEntryTimeLabel(entry) {
  if (entry?.timeLabel) {
    return entry.timeLabel;
  }

  const startTimestamp = parseEntryDateTime(entry?.startAt);
  const endTimestamp = parseEntryDateTime(entry?.endAt);

  if (startTimestamp !== null && endTimestamp !== null) {
    return `${TIME_FORMATTER.format(new Date(startTimestamp))} - ${TIME_FORMATTER.format(new Date(endTimestamp))}`;
  }

  if (startTimestamp !== null) {
    return TIME_FORMATTER.format(new Date(startTimestamp));
  }

  if (endTimestamp !== null) {
    return TIME_FORMATTER.format(new Date(endTimestamp));
  }

  return null;
}

export function isPastScheduledItem(item, referenceTime = Date.now()) {
  const endTimestamp = parseEntryDateTime(item?.endAt);
  if (endTimestamp !== null) {
    return endTimestamp < referenceTime;
  }
  const startTimestamp = parseEntryDateTime(item?.startAt);
  if (startTimestamp !== null) {
    return startTimestamp < referenceTime;
  }
  return false;
}

export function filterExpiredEntries(entries, referenceTime = Date.now()) {
  return entries.filter((entry) => !isPastScheduledItem(entry, referenceTime));
}

export function hasScheduledDate(item) {
  return parseEntryDateTime(item?.startAt) !== null || parseEntryDateTime(item?.endAt) !== null;
}

export function hasCompleteSchedule(item) {
  return parseEntryDateTime(item?.startAt) !== null && parseEntryDateTime(item?.endAt) !== null;
}

function hasScheduleChange(savedFavorite, currentEntry) {
  if (!hasScheduledDate(savedFavorite)) {
    return false;
  }

  return (
    parseEntryDateTime(savedFavorite.startAt) !== parseEntryDateTime(currentEntry.startAt) ||
    parseEntryDateTime(savedFavorite.endAt) !== parseEntryDateTime(currentEntry.endAt)
  );
}

export function filterUndatedEntries(entries) {
  return entries.filter((entry) => hasScheduledDate(entry));
}

export function filterEntries(entries, { query, day, stage }) {
  let result = entries;

  if (day !== 'All days') {
    result = result.filter((entry) => valuesMatch(getEntryDayLabel(entry), day));
  }

  if (stage !== 'All stages') {
    result = result.filter((entry) =>
      matchesSelectedStage(entry.stageCanonical ?? entry.stage, stage)
    );
  }

  const normalizedQuery = normalizeText(query);

  if (normalizedQuery) {
    result = result.filter((entry) => {
      return (
        normalizeText(getEntryDisplayName(entry)).includes(normalizedQuery) ||
        entry.artistTags.some((tag) => normalizeText(tag).includes(normalizedQuery)) ||
        entry.artistTokens.some((token) => normalizeText(token).includes(normalizedQuery))
      );
    });
  }

  return result;
}

export function filterReviewFavorites(reviewFavorites, { query, day, stage }) {
  let result = reviewFavorites;

  if (day !== 'All days') {
    result = result.filter((favorite) => valuesMatch(getDayLabel(favorite.daySlug), day));
  }

  if (stage !== 'All stages') {
    result = result.filter(
      (favorite) =>
        getComparableStageName(favorite.stageCanonical ?? favorite.stage) ===
        getComparableStageName(selectedStageToCanonical(stage, favorite.stage))
    );
  }

  const normalizedQuery = normalizeText(query);

  if (normalizedQuery) {
    result = result.filter((favorite) => {
      return (
        normalizeText(getEntryDisplayName(favorite)).includes(normalizedQuery) ||
        favorite.artistTags.some((tag) => normalizeText(tag).includes(normalizedQuery)) ||
        favorite.artistTokens.some((token) => normalizeText(token).includes(normalizedQuery))
      );
    });
  }

  return result;
}

export function filterExpiredReviewFavorites(reviewFavorites, referenceTime = Date.now()) {
  return reviewFavorites.filter((favorite) => !isPastScheduledItem(favorite, referenceTime));
}

export function filterUndatedReviewFavorites(reviewFavorites) {
  return reviewFavorites.filter((favorite) => hasScheduledDate(favorite));
}

function selectedStageToCanonical(selectedStage, fallbackStage) {
  return selectedStage === 'All stages'
    ? null
    : getCanonicalStageName(selectedStage || fallbackStage || '');
}

export function groupEntriesByDayAndStage(entries) {
  return entries.slice().sort(compareLineupEntries).reduce((acc, entry) => {
    const dayLabel = getEntryDayLabel(entry);
    const stageLabel = entry.stageCanonical ?? getCanonicalStageName(entry.stage);

    if (!acc[dayLabel]) {
      acc[dayLabel] = {};
    }

    if (!acc[dayLabel][stageLabel]) {
      acc[dayLabel][stageLabel] = [];
    }

    acc[dayLabel][stageLabel].push(entry);
    return acc;
  }, {});
}

export function groupFavoritesByDayAndStage(favoriteEntries) {
  return groupEntriesByDayAndStage(favoriteEntries);
}

export function loadFavorites(currentEntries, previousEntries = []) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    const rawItems = extractRawFavoriteItems(parsed);

    return normalizeFavoriteItems(rawItems, currentEntries, previousEntries);
  } catch {
    return [];
  }
}

export function saveFavorites(favoriteItems) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializedItems = favoriteItems.map((item) => ({
      favoriteKey: item.favoriteKey,
      legacyId: item.legacyId ?? null,
      id: item.id ?? null,
      hash: item.hash ?? null,
      daySlug: item.daySlug ?? null,
      dayOrder: item.dayOrder ?? null,
      stage: item.stage ?? '',
      stageSlug: item.stageSlug ?? null,
      stageOrder: item.stageOrder ?? null,
      stageCanonical: item.stageCanonical ?? null,
      stageColor: item.stageColor ?? null,
      artistName: item.artistName ?? item.artistRaw ?? '',
      artistRaw: item.artistRaw ?? '',
      artistSlug: item.artistSlug ?? null,
      artistOrder: item.artistOrder ?? null,
      artistTags: item.artistTags ?? [],
      artistTokens: item.artistTokens ?? [],
      startAt: item.startAt ?? null,
      endAt: item.endAt ?? null,
      timeLabel: item.timeLabel ?? null,
      savedAt: item.savedAt ?? null,
    }));

    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({
        version: 3,
        items: serializedItems,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function resolveFavoriteItems(entries, favoriteItems) {
  const currentEntriesById = new Map(entries.map((entry) => [entry.id, entry]));

  const matchedEntries = [];
  const reviewItems = [];

  favoriteItems.forEach((favorite) => {
    let matchedEntry = null;

    if (favorite.id && currentEntriesById.has(favorite.id)) {
      matchedEntry = currentEntriesById.get(favorite.id);

      if (hasScheduleChange(favorite, matchedEntry)) {
        reviewItems.push({
          ...favorite,
          suggestions: [matchedEntry, ...getReviewSuggestions(favorite, entries)]
            .filter(Boolean)
            .filter((entry, index, list) => list.findIndex((item) => item.id === entry.id) === index),
        });
        return;
      }
    }

    if (matchedEntry) {
      matchedEntries.push(matchedEntry);
      return;
    }

    reviewItems.push({
      ...favorite,
      suggestions: getReviewSuggestions(favorite, entries),
    });
  });

  const dedupedMatchedEntries = dedupeBy(matchedEntries, (entry) => entry.id);
  const dedupedReviewItems = dedupeBy(reviewItems, (item) => item.favoriteKey);

  return {
    ids: dedupedMatchedEntries.map((entry) => entry.id),
    entries: dedupedMatchedEntries,
    reviewItems: dedupedReviewItems,
  };
}

export function reconcileFavoriteItemsWithEntries(entries, favoriteItems) {
  const currentEntriesById = new Map(entries.map((entry) => [entry.id, entry]));
  let didChange = false;

  const nextItems = favoriteItems.map((favorite) => {
    if (!favorite.id || !currentEntriesById.has(favorite.id)) {
      return favorite;
    }

    const currentEntry = currentEntriesById.get(favorite.id);
    const missingStageColor = !favorite.stageColor && currentEntry.stageColor;
    const missingArtistTokens = !Array.isArray(favorite.artistTokens) || favorite.artistTokens.length === 0;

    if (
      !hasScheduledDate(favorite) &&
      hasScheduledDate(currentEntry)
    ) {
      didChange = true;
      return buildCompactFavoriteSnapshot(currentEntry, {
        favoriteKey: favorite.favoriteKey,
        savedAt: favorite.savedAt,
      });
    }

    if (missingStageColor || missingArtistTokens) {
      didChange = true;
      return buildCompactFavoriteSnapshot(favorite, {
        stageColor: currentEntry.stageColor,
        artistTokens: currentEntry.artistTokens,
      });
    }

    return favorite;
  });

  return didChange ? dedupeBy(nextItems, (item) => item.favoriteKey) : favoriteItems;
}

export function upsertFavoriteEntry(favoriteItems, entry) {
  const nextSnapshot = buildSnapshotFromEntry(entry);

  const filteredItems = favoriteItems.filter((item) => {
    if (item.id && item.id === nextSnapshot.id) {
      return false;
    }

    if (item.hash && nextSnapshot.hash && item.hash === nextSnapshot.hash) {
      return false;
    }

    return true;
  });

  return [...filteredItems, nextSnapshot];
}

export function removeFavoriteByEntryId(favoriteItems, entryId, entryHash = null) {
  return favoriteItems.filter((item) => {
    if (item.id && item.id === entryId) {
      return false;
    }

    if (entryHash && item.hash && item.hash === entryHash) {
      return false;
    }

    return true;
  });
}

export function removeFavoriteByKey(favoriteItems, favoriteKey) {
  return favoriteItems.filter((item) => item.favoriteKey !== favoriteKey);
}

export function loadViewPreferences() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadHidePastEventsPreference() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return JSON.parse(window.localStorage.getItem(HIDE_PAST_EVENTS_STORAGE_KEY) ?? 'true');
  } catch {
    return true;
  }
}

export function saveHidePastEventsPreference(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.localStorage.removeItem(HIDE_PAST_EVENTS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(HIDE_PAST_EVENTS_STORAGE_KEY, JSON.stringify(false));
  } catch {
    // Ignore storage errors
  }
}

export function loadHideUndatedEventsPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return JSON.parse(window.localStorage.getItem(HIDE_UNDATED_EVENTS_STORAGE_KEY) ?? 'false');
  } catch {
    return false;
  }
}

export function saveHideUndatedEventsPreference(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(HIDE_UNDATED_EVENTS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(HIDE_UNDATED_EVENTS_STORAGE_KEY, JSON.stringify(true));
  } catch {
    // Ignore storage errors
  }
}

export function loadIgnoreSmallConflictsPreference() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return JSON.parse(window.localStorage.getItem(IGNORE_SMALL_CONFLICTS_STORAGE_KEY) ?? 'true');
  } catch {
    return true;
  }
}

export function saveIgnoreSmallConflictsPreference(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.localStorage.removeItem(IGNORE_SMALL_CONFLICTS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(IGNORE_SMALL_CONFLICTS_STORAGE_KEY, JSON.stringify(false));
  } catch {
    // Ignore storage errors
  }
}

export function loadBetaFeaturesPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return JSON.parse(window.localStorage.getItem(BETA_FEATURES_STORAGE_KEY) ?? 'false');
  } catch {
    return false;
  }
}

export function saveBetaFeaturesPreference(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!value) {
      window.localStorage.removeItem(BETA_FEATURES_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(BETA_FEATURES_STORAGE_KEY, JSON.stringify(true));
  } catch {
    // Ignore storage errors
  }
}

export function saveViewPreferences(preferences) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors
  }
}

export function getFavoriteEntries(entries, favoriteIds) {
  const favoriteSet = new Set(favoriteIds);
  return entries.filter((entry) => favoriteSet.has(entry.id));
}

export function findAlternativeEntries(targetEntry, allEntries) {
  const targetTokens = new Set(targetEntry.artistTokens);

  return allEntries
    .filter((entry) => {
      if (entry.id === targetEntry.id) {
        return false;
      }

      return entry.artistTokens.some((token) => targetTokens.has(token));
    })
    .sort(
      (a, b) =>
        compareLineupEntries(a, b)
    );
}

export function countVisibleStages(entries) {
  return new Set(
    entries.map((entry) => `${getEntryDayLabel(entry)}__${entry.stage}`)
  ).size;
}
