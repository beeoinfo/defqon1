import { getCanonicalStageName } from "./stageThemes";

export const FAVORITES_STORAGE_KEY = "defqon1-favorites";
export const VIEW_STORAGE_KEY = "defqon1-view";

export function validateLineupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid lineup payload.");
  }

  if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
    throw new Error("Lineup entries must be a non-empty array.");
  }

  payload.entries.forEach((entry, index) => {
    if (!entry.id || typeof entry.id !== "string") {
      throw new Error(`Invalid entry id at index ${index}.`);
    }

    if (!entry.day || typeof entry.day !== "string") {
      throw new Error(`Invalid entry day for ${entry.id}.`);
    }

    if (!entry.stage || typeof entry.stage !== "string") {
      throw new Error(`Invalid entry stage for ${entry.id}.`);
    }

    if (!entry.rawName || typeof entry.rawName !== "string") {
      throw new Error(`Invalid entry rawName for ${entry.id}.`);
    }

    if (!Array.isArray(entry.artists)) {
      throw new Error(`Invalid artists array for ${entry.id}.`);
    }

    if (!Array.isArray(entry.artistTokens)) {
      throw new Error(`Invalid artistTokens array for ${entry.id}.`);
    }
  });

  return true;
}

export function getDays(entries) {
  const daysMap = new Map();

  entries
    .slice()
    .sort((a, b) => (a.dayOrder ?? 999) - (b.dayOrder ?? 999))
    .forEach((entry) => {
      if (!daysMap.has(entry.day)) {
        daysMap.set(entry.day, entry.day);
      }
    });

  return Array.from(daysMap.values());
}

export function getDefaultDay(entries) {
  const days = getDays(entries);
  return days[0] || "Thursday";
}

/**
 * Returns only canonical stage badges.
 * Example:
 * - BLUE
 * - BLUE Night
 * => only BLUE badge
 */
export function getStages(entries, dayFilter = "All days") {
  const filtered =
    dayFilter === "All days"
      ? entries
      : entries.filter((entry) => entry.day === dayFilter);

  return Array.from(
    new Set(filtered.map((entry) => getCanonicalStageName(entry.stage)))
  );
}

export function matchesSelectedStage(entryStage, selectedStage) {
  if (selectedStage === "All stages") {
    return true;
  }

  return getCanonicalStageName(entryStage) === selectedStage;
}

export function filterEntries(entries, { query, day, stage }) {
  let result = entries;

  if (day !== "All days") {
    result = result.filter((entry) => entry.day === day);
  }

  if (stage !== "All stages") {
    result = result.filter((entry) =>
      matchesSelectedStage(entry.stage, stage)
    );
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery) {
    result = result.filter((entry) => {
      return (
        entry.rawName.toLowerCase().includes(normalizedQuery) ||
        entry.displayName.toLowerCase().includes(normalizedQuery) ||
        entry.artists.some((artist) =>
          artist.toLowerCase().includes(normalizedQuery)
        ) ||
        entry.artistTokens.some((token) => token.includes(normalizedQuery))
      );
    });
  }

  return result;
}

/**
 * Important:
 * Group by the REAL stage name, not the canonical one.
 * That way:
 * - selecting BLUE badge
 * - still shows two cards:
 *   - BLUE
 *   - BLUE Night
 */
export function groupEntriesByDayAndStage(entries) {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = {};
    }

    if (!acc[entry.day][entry.stage]) {
      acc[entry.day][entry.stage] = [];
    }

    acc[entry.day][entry.stage].push(entry);
    return acc;
  }, {});
}

export function groupFavoritesByDayAndStage(favoriteEntries) {
  return favoriteEntries.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = {};
    }

    if (!acc[entry.day][entry.stage]) {
      acc[entry.day][entry.stage] = [];
    }

    acc[entry.day][entry.stage].push(entry);
    return acc;
  }, {});
}

export function loadFavorites() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites)
    );
  } catch {
    // Ignore storage errors
  }
}

export function loadViewPreferences() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveViewPreferences(preferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify(preferences)
    );
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
        (a.dayOrder ?? 999) - (b.dayOrder ?? 999) ||
        a.stage.localeCompare(b.stage)
    );
}

export function getAlternativeMatchSummary(targetEntry, alternativeEntry) {
  const targetTokens = new Set(targetEntry.artistTokens);

  return alternativeEntry.artists.filter((artist, index) =>
    targetTokens.has(alternativeEntry.artistTokens[index])
  );
}

/**
 * Count real visible stage cards, not canonical stage badges.
 * Example:
 * if BLUE + BLUE Night are both visible, count = 2
 */
export function countVisibleStages(entries) {
  return new Set(entries.map((entry) => `${entry.day}__${entry.stage}`)).size;
}