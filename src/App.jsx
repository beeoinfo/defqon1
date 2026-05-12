import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  CircleNotchIcon,
  HeartBreakIcon,
  HeartIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  MusicNoteIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import AuthModal from '@/components/AuthModal';
import BackToTop from '@/components/BackToTop';
import Box from '@/components/layout/Box';
import Modal from '@/components/layout/Modal';
import Page from '@/components/layout/Page';
import View from '@/components/layout/View';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import { DateTimeInput, SearchInput, SelectInput, TextInput } from '@/components/primitives/forms';
import useAnimatedPageStack from '@/hooks/useAnimatedPageStack';
import useDocumentScrollLock from '@/hooks/useDocumentScrollLock';
import useI18n from '@/hooks/useI18n';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import usePwaInstallPrompt from '@/hooks/usePwaInstallPrompt';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import I18nProvider from '@/i18n/I18nContext';
import { getTranslation, normalizeLanguage } from '@/i18n/translations';
import { ELECTRONIC_FESTIVAL_STYLES_DB } from './data/electronicFestivalStylesDb';
import {
  entriesHaveMeaningfulConflict,
  filterExpiredEntries,
  filterExpiredReviewFavorites,
  filterEntries,
  filterUndatedEntries,
  filterUndatedReviewFavorites,
  getActiveTimetableConflictCount,
  getDays,
  getDefaultFestivalDay,
  getEntryMetaLabel,
  getStableEntryId,
  getStages,
  groupEntriesByDayAndStage,
  hasCompleteSchedule,
  loadHidePastEventsPreference,
  loadHideUndatedEventsPreference,
  loadIgnoreSmallConflictsPreference,
  loadShowStyleTagsPreference,
  loadViewPreferences,
  reconcileFavoriteItemsWithEntries,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveHidePastEventsPreference,
  saveHideUndatedEventsPreference,
  saveIgnoreSmallConflictsPreference,
  saveShowStyleTagsPreference,
  saveViewPreferences,
  toggleReviewSuggestionFavorite,
  upsertFavoriteEntry,
  validateLineupPayload,
} from './lib/lineup';
import {
  buildMapCalibrationTransform,
  getGpsDistanceMeters,
  projectGpsToMap,
  projectMapToGps,
} from './lib/mapCalibration';
import {
  commitPageHistoryState,
  getHistoryPageStack,
  replaceHistoryPageStackState,
  syncPageStackIdRef,
} from './lib/pageHistory';
import {
  getNextPageStackOnOpen,
  getNextPageStackOnClose,
} from './lib/pageStack';
import { getPresetAvatarUrl, presetAvatarUrls, resolveProfileAvatarUrl } from './lib/presetAvatars';
import {
  createCurrentUserTribe,
  deleteCurrentUserTribeLocation,
  deleteMapCalibrationPoint,
  getStablePayloadHash,
  getCurrentUser,
  addMapCalibrationPoint,
  isCurrentUserAdmin,
  isSupabaseConfigured,
  joinCurrentUserTribeByCode,
  leaveCurrentUserTribe,
  loadAccountBundle,
  loadAppSettings,
  loadAdminLineupVersions,
  loadPublishedLineupVersions,
  loadMapCalibrationPoints,
  loadTribeBundle,
  loadTribeMemberLocations,
  normalizeTribeCode,
  resetMapCalibrationPoints,
  setJokeLineupEnabled,
  subscribeToAppSettings,
  subscribeToTribeMemberLocations,
  supabase,
  syncFavoriteSnapshots,
  updateProfileLanguage,
  updateCurrentUserTribeName,
  upsertCurrentUserTribeLocation,
} from './lib/supabase';
import { getCanonicalStageName, getStageTheme } from './lib/stageThemes';
import { PAGE_DEFINITIONS } from './page/pageDefinitions';
import {
  APP_DOCUMENT_TITLE,
  formatDocumentTitle,
  getTitleForView,
  getUrlForView,
  resolveRoute,
} from './routes/AppRoutes';
import { activeSiteAssets } from './sites/siteAssets';
import { activeSite } from './sites/siteDefinitions';
import UiThemeScope from './theme/UiThemeScope';
import LineUpView from './views/LineUpView';
import MapsView from './views/MapsView';
import ReviewsView from './views/ReviewsView';
import StorybookView from './views/StorybookView';
import TimetableView from './views/TimetableView';
import './App.css';

const VIEW_COMPONENTS = {
  lineup: LineUpView,
  maps: MapsView,
  reviews: ReviewsView,
  search: LineUpView,
  timetable: TimetableView,
};

const SITE_MAP_IMAGE_MODULES = import.meta.glob('./data/*/maps/*.{avif,gif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
});

const getHeaderModeForView = (view) => (view === 'search' ? 'search' : 'default');
const getSiteFaviconHref = () => `/${activeSite.slug}/${activeSite.assets.favicon}?site=${activeSite.slug}`;
const getComparableLabel = (value) => String(value ?? '').trim().toLowerCase();
const getCleanStyleTag = (value) => String(value ?? '').trim();
const TEMP_LINEUP_SOURCE_KEY = 'temp:manual-lineup-edit';
const MAP_CALIBRATION_MIN_DISTANCE_M = 200;
const JOKE_LINEUP_SEARCH_TERMS = new Set(['charlottebtrnd', 'lineup']);
const LIVE_LOCATION_DURATION_MS = 30 * 60 * 1000;
const LIVE_LOCATION_MIN_UPDATE_DISTANCE_M = 10;
const LIVE_LOCATION_REFRESH_MS = 8000;
const LIVE_LOCATION_REMAINING_TICK_MS = 30 * 1000;
const DEFAULT_FESTIVAL_DAY_START_HOUR = 6;
const DEFAULT_FESTIVAL_DAY_END_HOUR = 6;
const MAPBOX_GL_ASSET_URLS = [
  'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js',
  'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css',
];
const MAP_IMAGE_CACHE_NAME = 'beeoinfo-map-images-v1';
const normalizeLineupText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[øØ]/g, 'o')
  .toLowerCase()
  .trim();
const slugifyLineupValue = (value) => normalizeLineupText(value)
  .replace(/['".,()!:+/\\]/g, ' ')
  .replace(/&/g, ' ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-+/g, '-');
const getArtistTagsFromName = (artistName) => (
  String(artistName ?? '')
    .split(/\s+(?:B2B|F2F)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
);
const getDateInputValue = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
const getTimeInputValue = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
const getIsoFromDateAndTime = ({ date, time }) => {
  const timestamp = new Date(`${date}T${time}`).getTime();

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
};
const getLocalDateTimeTimestamp = ({ date, time }) => {
  const timestamp = new Date(`${date}T${time}`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};
const getDateInputValueFromTimestamp = (timestamp) => (
  Number.isFinite(timestamp) ? getDateInputValue(new Date(timestamp).toISOString()) : ''
);
const getDateAtHourTimestamp = (dateValue, hour, dayOffset = 0) => {
  const date = new Date(`${dateValue}T00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);

  return date.getTime();
};
const getLineupDayFromPayload = (payload, daySlug) => (
  Array.isArray(payload?.lineup)
    ? payload.lineup.find((lineupDay) => String(lineupDay.daySlug ?? '') === String(daySlug ?? ''))
    : null
);
const getConfiguredDayStartDate = (daySlug) => (
  activeSite.schedule?.dayStartDates?.[String(daySlug ?? '').trim().toLowerCase()] ?? ''
);
const getFestivalDayRange = (payload, daySlug) => {
  const day = getLineupDayFromPayload(payload, daySlug);
  const explicitStartTimestamp = day?.dayStart ? new Date(day.dayStart).getTime() : Number.NaN;
  const explicitEndTimestamp = day?.dayEnd ? new Date(day.dayEnd).getTime() : Number.NaN;
  const baseDate =
    getDateInputValue(day?.dayStart) ||
    getDateInputValue(day?.dayEnd) ||
    String(day?.dayStartDate ?? '').trim() ||
    getConfiguredDayStartDate(daySlug);
  const fallbackStartTimestamp = baseDate
    ? getDateAtHourTimestamp(baseDate, DEFAULT_FESTIVAL_DAY_START_HOUR)
    : null;
  const fallbackEndTimestamp = baseDate
    ? getDateAtHourTimestamp(
        baseDate,
        DEFAULT_FESTIVAL_DAY_END_HOUR,
        DEFAULT_FESTIVAL_DAY_END_HOUR <= DEFAULT_FESTIVAL_DAY_START_HOUR ? 1 : 0
      )
    : null;
  const startTimestamp = Number.isNaN(explicitStartTimestamp)
    ? fallbackStartTimestamp
    : explicitStartTimestamp;
  const endTimestamp = Number.isNaN(explicitEndTimestamp)
    ? fallbackEndTimestamp
    : explicitEndTimestamp;

  return {
    startTimestamp,
    endTimestamp,
    startDate: getDateInputValueFromTimestamp(startTimestamp),
    endDate: getDateInputValueFromTimestamp(endTimestamp),
  };
};
const getFestivalDateForTime = ({ payload, daySlug, time, referenceTimestamp = null }) => {
  if (!time) {
    return '';
  }

  const range = getFestivalDayRange(payload, daySlug);

  if (!range.startDate) {
    return '';
  }

  const startDateTimestamp = getLocalDateTimeTimestamp({ date: range.startDate, time });
  const endDateTimestamp = range.endDate
    ? getLocalDateTimeTimestamp({ date: range.endDate, time })
    : null;
  const candidates = [startDateTimestamp, endDateTimestamp]
    .filter((timestamp) => timestamp !== null)
    .filter((timestamp) => {
      if (range.startTimestamp === null || range.endTimestamp === null) {
        return true;
      }

      return timestamp >= range.startTimestamp && timestamp <= range.endTimestamp;
    });

  if (candidates.length === 0) {
    return range.startDate;
  }

  const bestTimestamp = referenceTimestamp === null
    ? candidates[0]
    : candidates.reduce((bestCandidate, candidate) => (
        Math.abs(candidate - referenceTimestamp) < Math.abs(bestCandidate - referenceTimestamp)
          ? candidate
          : bestCandidate
      ));

  return getDateInputValueFromTimestamp(bestTimestamp);
};
const getFestivalScheduleDates = ({ payload, daySlug, startTime, endTime }) => {
  const startDate = getFestivalDateForTime({ payload, daySlug, time: startTime });
  const startTimestamp = startDate
    ? getLocalDateTimeTimestamp({ date: startDate, time: startTime })
    : null;
  let endDate = getFestivalDateForTime({
    payload,
    daySlug,
    time: endTime,
    referenceTimestamp: startTimestamp,
  });
  let endTimestamp = endDate
    ? getLocalDateTimeTimestamp({ date: endDate, time: endTime })
    : null;

  if (
    startTimestamp !== null &&
    endTimestamp !== null &&
    endTimestamp <= startTimestamp
  ) {
    const nextDate = new Date(startTimestamp);
    nextDate.setDate(nextDate.getDate() + 1);
    endDate = getDateInputValue(nextDate.toISOString());
    endTimestamp = getLocalDateTimeTimestamp({ date: endDate, time: endTime });
  }

  return {
    startDate,
    endDate,
  };
};
const getScheduleValuesWithFestivalDates = ({ payload, values }) => {
  const scheduleDates = getFestivalScheduleDates({
    payload,
    daySlug: values.daySlug,
    startTime: values.startTime,
    endTime: values.endTime,
  });

  return {
    ...values,
    ...scheduleDates,
  };
};
const getScheduleTokenFromDateTime = ({ startDate, startTime, endTime }) => (
  `${startDate.replace(/-/g, '')}-${startTime.replace(':', '')}-${endTime.replace(':', '')}`
);
const areSameEntryEditValues = ({ entry, artistName, daySlug, stageSlug, startAt, endAt }) => (
  normalizeLineupText(entry?.artistName) === normalizeLineupText(artistName) &&
  String(entry?.daySlug ?? '') === String(daySlug ?? '') &&
  String(entry?.stageSlug ?? '') === String(stageSlug ?? '') &&
  String(entry?.startAt ?? '') === String(startAt ?? '') &&
  String(entry?.endAt ?? '') === String(endAt ?? '')
);
const getPerformanceEditFieldErrors = (editState, t = (value) => value) => {
  if (!editState) {
    return {};
  }

  const values = editState.values ?? {};
  const fieldErrors = {};

  if (!String(values.artistName ?? '').trim()) {
    fieldErrors.artistName = t('Required.');
  }

  if (!String(values.daySlug ?? '').trim()) {
    fieldErrors.daySlug = t('Required.');
  }

  if (!String(values.stageSlug ?? '').trim()) {
    fieldErrors.stageSlug = t('Required.');
  }

  if (!values.startDate) {
    fieldErrors.startDate = t('Required.');
  }

  if (!values.startTime) {
    fieldErrors.startTime = t('Required.');
  }

  if (!values.endDate) {
    fieldErrors.endDate = t('Required.');
  }

  if (!values.endTime) {
    fieldErrors.endTime = t('Required.');
  }

  return fieldErrors;
};
const hasPerformanceEditChanges = (editState) => {
  if (!editState) {
    return false;
  }

  if (editState.mode === 'create') {
    return Object.values(editState.values ?? {}).some((value) => String(value ?? '').trim());
  }

  const values = editState.values ?? {};

  return (
    normalizeLineupText(values.artistName) !== normalizeLineupText(editState.entry?.artistName) ||
    values.daySlug !== (editState.entry?.daySlug ?? '') ||
    values.stageSlug !== (editState.entry?.stageSlug ?? '') ||
    values.startDate !== getDateInputValue(editState.entry?.startAt) ||
    values.startTime !== getTimeInputValue(editState.entry?.startAt) ||
    values.endDate !== getDateInputValue(editState.entry?.endAt) ||
    values.endTime !== getTimeInputValue(editState.entry?.endAt)
  );
};
const sortArtistsBySchedule = (artists) => {
  if (!Array.isArray(artists)) {
    return;
  }

  artists.sort((firstArtist, secondArtist) => {
    const firstTime = new Date(firstArtist?.startAt ?? 0).getTime();
    const secondTime = new Date(secondArtist?.startAt ?? 0).getTime();
    const safeFirstTime = Number.isNaN(firstTime) ? Number.MAX_SAFE_INTEGER : firstTime;
    const safeSecondTime = Number.isNaN(secondTime) ? Number.MAX_SAFE_INTEGER : secondTime;

    return safeFirstTime - safeSecondTime;
  });

  artists.forEach((artist, index) => {
    artist.artistOrder = index + 1;
  });
};
const getLineupDayOptionsFromPayload = (payload) => (
  Array.isArray(payload?.lineup)
    ? payload.lineup
        .map((day) => ({
          value: String(day.daySlug ?? '').trim(),
          label: day.dayName || day.daySlug || 'Untitled day',
          dayStartDate: day.dayStartDate ?? null,
          dayStart: day.dayStart ?? null,
          dayEnd: day.dayEnd ?? null,
          stages: Array.isArray(day.stages) ? day.stages : [],
        }))
        .filter((day) => day.value && day.stages.length > 0)
    : []
);
const getLineupStageOptionsForDay = (payload, daySlug) => {
  const day = Array.isArray(payload?.lineup)
    ? payload.lineup.find((lineupDay) => String(lineupDay.daySlug ?? '') === String(daySlug ?? ''))
    : null;

  return (day?.stages ?? [])
    .map((stage) => ({
      value: String(stage.stageSlug ?? '').trim(),
      label: stage.stageName || stage.stageSlug || 'Untitled stage',
    }))
    .filter((stage) => stage.value);
};
const getMapLayerLabelFromFileName = (fileName) => (
  String(fileName ?? '')
    .replace(/\.[^.]+$/u, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
);
const normalizeMapLayerDay = (value) => (
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
);
const getDefaultMapLayerIdForDay = (mapLayers, selectedDay) => {
  const normalizedSelectedDay = normalizeMapLayerDay(selectedDay);

  if (!normalizedSelectedDay) {
    return mapLayers[0]?.id ?? '';
  }

  return mapLayers.find((layer) => {
    const candidates = [
      layer.id,
      layer.day,
      layer.daySlug,
      layer.label,
      layer.name,
    ];

    return candidates.some((candidate) => (
      normalizeMapLayerDay(candidate) === normalizedSelectedDay
    ));
  })?.id ?? mapLayers[0]?.id ?? '';
};
const hasGpsLocation = (location) => (
  Number.isFinite(location?.gpsLongitude) &&
  Number.isFinite(location?.gpsLatitude)
);
const sortMapCalibrationPoints = (points) => (
  [...(points ?? [])].sort((leftPoint, rightPoint) => (
    new Date(leftPoint.createdAt ?? leftPoint.updatedAt ?? 0).getTime() -
    new Date(rightPoint.createdAt ?? rightPoint.updatedAt ?? 0).getTime()
  ))
);
const getCalibratedMapLayerTransforms = (mapLayers, calibrationPoints) => (
  mapLayers
    .map((layer) => {
      const transform = buildMapCalibrationTransform(
        calibrationPoints.filter((point) => point.mapLayerId === layer.id)
      );

      return transform ? { mapLayerId: layer.id, transform } : null;
    })
    .filter(Boolean)
);
const getMapLayerIdsThatLostCalibration = (previousTransforms, nextTransforms) => {
  const nextMapLayerIds = new Set(nextTransforms.map((item) => item.mapLayerId));

  return previousTransforms
    .map((item) => item.mapLayerId)
    .filter((mapLayerId) => !nextMapLayerIds.has(mapLayerId));
};
const getFallbackMapImageLayers = (siteSlug) => (
  Object.entries(SITE_MAP_IMAGE_MODULES)
    .map(([path, imageUrl]) => {
      const match = path.match(/^\.\/data\/([^/]+)\/maps\/([^/]+)$/u);

      if (!match || match[1] !== siteSlug) {
        return null;
      }

      const fileName = match[2];
      const fileSlug = fileName
        .replace(/\.[^.]+$/u, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const label = getMapLayerLabelFromFileName(fileName);

      return {
        id: `${siteSlug}-image-map-${fileSlug}`,
        type: 'image',
        label,
        name: label,
        imageUrl,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label))
);

const cacheAssetUrl = async (cache, cacheUrl) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  try {
    const response = await fetch(cacheUrl);

    if (response && response.status < 400) {
      await cache.put(cacheUrl, response.clone());
      return;
    }
  } catch {
    // Retry below with no-cors for public third-party images such as uploaded avatars.
  }

  try {
    const response = await fetch(cacheUrl, { mode: 'no-cors' });

    if (response) {
      await cache.put(cacheUrl, response.clone());
    }
  } catch {
    // Ignore assets that cannot be cached from this browser context.
  }
};

const cacheMapLayerImages = async (mapLayers, extraUrls = []) => {
  if (typeof window === 'undefined' || !window.caches) {
    return;
  }

  const cacheUrls = Array.from(new Set(
    [
      ...MAPBOX_GL_ASSET_URLS,
      activeSiteAssets.logoSrc,
      ...presetAvatarUrls,
      ...extraUrls,
      ...mapLayers
        .filter((layer) => layer?.type === 'image' && layer.imageUrl)
        .map((layer) => layer.imageUrl),
    ]
      .filter(Boolean)
  ));

  if (cacheUrls.length === 0) {
    return;
  }

  const cache = await window.caches.open(MAP_IMAGE_CACHE_NAME);
  await Promise.allSettled(cacheUrls.map((cacheUrl) => cacheAssetUrl(cache, cacheUrl)));
};

const getEntryTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};
const scrollViewportToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const getStyleTagItemsFromRecord = (record) => [
  ...(Array.isArray(record?.mainTags)
    ? record.mainTags.map((tag) => ({ label: tag, kind: 'main' }))
    : []),
  ...(record?.additionalTag ? [{ label: record.additionalTag, kind: 'additional' }] : []),
].map((item) => ({
  ...item,
  label: getCleanStyleTag(item.label),
})).filter((item) => item.label);

const addUniqueStyleTag = (styleTags, tag) => {
  const cleanTag = getCleanStyleTag(tag);
  const comparableTag = getComparableLabel(cleanTag);

  if (!cleanTag || styleTags.has(comparableTag)) {
    return;
  }

  styleTags.set(comparableTag, cleanTag);
};

const addUniqueStyleTagItem = (styleTagItems, item) => {
  const cleanLabel = getCleanStyleTag(item?.label);
  const comparableTag = getComparableLabel(cleanLabel);

  if (!cleanLabel || styleTagItems.has(comparableTag)) {
    return;
  }

  styleTagItems.set(comparableTag, {
    label: cleanLabel,
    kind: item?.kind === 'additional' ? 'additional' : 'main',
  });
};

const getStyleOptionsFromEntries = (entries, styleTagsByArtistToken, styleTagsByArtistName) => {
  const stylesByKey = new Map();

  entries.forEach((entry) => {
    getEntryStyleTags(
      entry,
      styleTagsByArtistToken,
      styleTagsByArtistName
    ).forEach((tag) => addUniqueStyleTag(stylesByKey, tag));
  });

  return Array.from(stylesByKey.values())
    .sort((leftTag, rightTag) => leftTag.localeCompare(rightTag))
    .map((tag) => ({
      value: tag,
      label: tag,
      labelTranslate: 'no',
    }));
};

const getEntryStyleTags = (entry, styleTagsByArtistToken, styleTagsByArtistName) => {
  return getEntryStyleTagItems(entry, styleTagsByArtistToken, styleTagsByArtistName)
    .map((item) => item.label);
};

const getEntryStyleTagItems = (entry, styleTagsByArtistToken, styleTagsByArtistName) => {
  const styleTagItems = new Map();
  const addRecordTags = (recordTags) => {
    recordTags?.forEach((item) => addUniqueStyleTagItem(styleTagItems, item));
  };

  entry.artistTokens?.forEach((token) => {
    addRecordTags(styleTagsByArtistToken.get(getComparableLabel(token)));
  });

  entry.artistTags?.forEach((artistTag) => {
    addRecordTags(styleTagsByArtistName.get(getComparableLabel(artistTag)));
  });

  addRecordTags(styleTagsByArtistName.get(getComparableLabel(entry.artistName)));
  addRecordTags(styleTagsByArtistName.get(getComparableLabel(entry.artistRaw)));

  return Array.from(styleTagItems.values());
};

const entryMatchesSelectedStyles = (
  entry,
  selectedStyleSet,
  styleTagsByArtistToken,
  styleTagsByArtistName
) => {
  if (selectedStyleSet.size === 0) {
    return true;
  }

  return getEntryStyleTags(entry, styleTagsByArtistToken, styleTagsByArtistName)
    .some((tag) => selectedStyleSet.has(getComparableLabel(tag)));
};

const getConflictingFavoriteEntryIds = (entries, favoriteIdSet, ignoreSmallConflicts) => {
  const scheduledFavorites = entries
    .filter((entry) => favoriteIdSet.has(entry.id))
    .map((entry) => ({
      entry,
      startTimestamp: getEntryTimestamp(entry.startAt),
      endTimestamp: getEntryTimestamp(entry.endAt),
    }))
    .filter((item) => (
      item.startTimestamp !== null &&
      item.endTimestamp !== null &&
      item.endTimestamp > item.startTimestamp
    ))
    .sort((leftItem, rightItem) => leftItem.startTimestamp - rightItem.startTimestamp);
  const conflictingIds = new Set();

  scheduledFavorites.forEach((currentItem, currentIndex) => {
    for (let index = currentIndex + 1; index < scheduledFavorites.length; index += 1) {
      const candidateItem = scheduledFavorites[index];

      if (candidateItem.startTimestamp >= currentItem.endTimestamp) {
        break;
      }

      if (entriesHaveMeaningfulConflict(currentItem.entry, candidateItem.entry, ignoreSmallConflicts)) {
        conflictingIds.add(currentItem.entry.id);
        conflictingIds.add(candidateItem.entry.id);
      }
    }
  });

  return conflictingIds;
};

const getFavoriteConflictPairCount = (entries, favoriteIdSet, ignoreSmallConflicts) => {
  const scheduledFavorites = entries
    .filter((entry) => favoriteIdSet.has(entry.id))
    .map((entry) => ({
      entry,
      startTimestamp: getEntryTimestamp(entry.startAt),
      endTimestamp: getEntryTimestamp(entry.endAt),
    }))
    .filter((item) => (
      item.startTimestamp !== null &&
      item.endTimestamp !== null &&
      item.endTimestamp > item.startTimestamp
    ))
    .sort((leftItem, rightItem) => leftItem.startTimestamp - rightItem.startTimestamp);
  let conflictCount = 0;

  scheduledFavorites.forEach((currentItem, currentIndex) => {
    for (let index = currentIndex + 1; index < scheduledFavorites.length; index += 1) {
      const candidateItem = scheduledFavorites[index];

      if (candidateItem.startTimestamp >= currentItem.endTimestamp) {
        break;
      }

      if (entriesHaveMeaningfulConflict(currentItem.entry, candidateItem.entry, ignoreSmallConflicts)) {
        conflictCount += 1;
      }
    }
  });

  return conflictCount;
};

const ACCOUNT_CACHE_KEY_PREFIX = `account-cache:v1:${activeSite.slug}:`;
const LINEUP_VERSIONS_CACHE_KEY = `lineup-versions-cache:v1:${activeSite.slug}`;
const MAP_CALIBRATION_CACHE_KEY = `map-calibration-cache:v1:${activeSite.slug}`;
const LAST_AUTHENTICATED_USER_ID_KEY = 'last-authenticated-user-id:v1';
const PENDING_TRIBE_INVITE_KEY = 'pending-tribe-invite:v1';
const LIVE_LOCATION_SESSION_KEY = `live-location-session:v1:${activeSite.slug}`;

const getAccountCacheKey = (userId) => `${ACCOUNT_CACHE_KEY_PREFIX}${userId}`;

const readLiveLocationSession = () => {
  try {
    const rawValue = localStorage.getItem(LIVE_LOCATION_SESSION_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    const expiresAt = String(parsed?.expiresAt ?? '');

    if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(LIVE_LOCATION_SESSION_KEY);
      return null;
    }

    return {
      userId: String(parsed?.userId ?? ''),
      tribeId: String(parsed?.tribeId ?? ''),
      siteSlug: String(parsed?.siteSlug ?? activeSite.slug),
      mapLayerId: String(parsed?.mapLayerId ?? ''),
      expiresAt,
    };
  } catch {
    return null;
  }
};

const writeLiveLocationSession = ({ userId, tribeId, mapLayerId, expiresAt }) => {
  try {
    localStorage.setItem(LIVE_LOCATION_SESSION_KEY, JSON.stringify({
      userId,
      tribeId,
      siteSlug: activeSite.slug,
      mapLayerId,
      expiresAt,
    }));
  } catch {
    // Ignore storage errors.
  }
};

const clearLiveLocationSession = () => {
  try {
    localStorage.removeItem(LIVE_LOCATION_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
};

const sanitizeCachedTribe = (tribe) => {
  if (!tribe) {
    return null;
  }

  return {
    tribeId: tribe.tribeId ?? null,
    name: tribe.name ?? null,
    code: tribe.code ?? null,
    ownerUserId: tribe.ownerUserId ?? null,
    createdAt: tribe.createdAt ?? null,
    role: tribe.role ?? null,
    isOwner: Boolean(tribe.isOwner),
    memberCount: tribe.memberCount ?? 0,
    members: Array.isArray(tribe.members)
      ? tribe.members.map((member) => ({
          userId: member.userId ?? null,
          role: member.role ?? null,
          profile: member.profile ?? null,
          favorites: Array.isArray(member.favorites) ? member.favorites : [],
        }))
      : [],
  };
};

const readPendingTribeInviteCode = () => {
  try {
    return normalizeTribeCode(sessionStorage.getItem(PENDING_TRIBE_INVITE_KEY));
  } catch {
    return '';
  }
};

const writePendingTribeInviteCode = (code) => {
  try {
    const normalizedCode = normalizeTribeCode(code);

    if (!normalizedCode) {
      sessionStorage.removeItem(PENDING_TRIBE_INVITE_KEY);
      return '';
    }

    sessionStorage.setItem(PENDING_TRIBE_INVITE_KEY, normalizedCode);
    return normalizedCode;
  } catch {
    return '';
  }
};

const buildCachedAccountPayload = (account) => ({
  profile: account?.profile ?? null,
  favorites: Array.isArray(account?.favorites) ? account.favorites : [],
  tribe: sanitizeCachedTribe(account?.tribe ?? null),
});

const readCachedAccount = (userId) => {
  if (!userId) {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(getAccountCacheKey(userId));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return buildCachedAccountPayload(parsed);
  } catch {
    return null;
  }
};

const writeCachedAccount = (userId, account) => {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(getAccountCacheKey(userId), JSON.stringify(buildCachedAccountPayload(account)));
  } catch {
    // Ignore storage errors.
  }
};

const clearCachedAccount = (userId) => {
  if (!userId) {
    return;
  }

  try {
    localStorage.removeItem(getAccountCacheKey(userId));
  } catch {
    // Ignore storage errors.
  }
};

const serializeFavoriteItems = (items) => JSON.stringify(items ?? []);

const readLastAuthenticatedUserId = () => {
  try {
    return localStorage.getItem(LAST_AUTHENTICATED_USER_ID_KEY) || null;
  } catch {
    return null;
  }
};

const writeLastAuthenticatedUserId = (userId) => {
  try {
    if (!userId) {
      localStorage.removeItem(LAST_AUTHENTICATED_USER_ID_KEY);
      return;
    }

    localStorage.setItem(LAST_AUTHENTICATED_USER_ID_KEY, userId);
  } catch {
    // Ignore storage errors.
  }
};

const readCachedMapCalibrationPoints = () => {
  try {
    const rawValue = localStorage.getItem(MAP_CALIBRATION_CACHE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return sortMapCalibrationPoints(Array.isArray(parsed?.points) ? parsed.points : []);
  } catch {
    return [];
  }
};

const writeCachedMapCalibrationPoints = (points) => {
  try {
    localStorage.setItem(MAP_CALIBRATION_CACHE_KEY, JSON.stringify({
      cachedAt: new Date().toISOString(),
      points: Array.isArray(points) ? sortMapCalibrationPoints(points) : [],
    }));
  } catch {
    // Ignore storage errors.
  }
};

const getProfileDisplayName = (profileRecord) => {
  const firstName = String(profileRecord?.first_name ?? '').trim();
  const lastName = String(profileRecord?.last_name ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || String(profileRecord?.username ?? '').trim() || 'Tribe member';
};

const getBootAccountState = () => {
  const userId = readLastAuthenticatedUserId();
  const account = readCachedAccount(userId);
  return { userId, account };
};

const buildOptimisticProfile = (authUser) => {
  if (!authUser) {
    return null;
  }

  const metadata = authUser.user_metadata ?? {};
  const username = String(metadata.username ?? '').trim().toLowerCase();
  const firstName = String(metadata.first_name ?? '').trim();
  const lastName = String(metadata.last_name ?? '').trim();
  const avatarKind = String(metadata.avatar_kind ?? 'preset').trim() || 'preset';
  const avatarPreset = Number(metadata.avatar_preset ?? 1) || 1;
  const avatarUrl = String(metadata.avatar_url ?? '').trim() || null;

  if (!username && !firstName && !lastName && !avatarUrl) {
    return null;
  }

  return {
    id: authUser.id,
    username,
    first_name: firstName,
    last_name: lastName,
    avatar_kind: avatarKind,
    avatar_preset: avatarPreset,
    avatar_url: avatarUrl,
    avatar_path: null,
  };
};

const extractLineupEntries = (moduleValue) => {
  const payload = moduleValue?.default ?? moduleValue ?? null;

  if (Array.isArray(payload)) {
    return payload.filter((entry) => !entry.host);
  }

  if (Array.isArray(payload?.entries)) {
    return payload.entries.filter((entry) => !entry.host);
  }

  if (Array.isArray(payload?.lineup)) {
    return payload.lineup.flatMap((day) =>
      (day.stages ?? []).flatMap((stage, stageIndex) =>
        (stage.artists ?? []).map((artist, artistIndex) => {
          const artistName = artist.artistName ?? artist.artistRaw ?? '';
          const stageName = stage.stageName ?? stage.stage ?? 'Unknown stage';
          const stageCanonical = getCanonicalStageName(stage.stageCanonical ?? stageName);

          return {
            ...artist,
            daySlug: String(day.daySlug ?? '').trim().toLowerCase(),
            dayOrder: day.dayOrder,
            dayStartDate: day.dayStartDate ?? null,
            dayStart: day.dayStart ?? null,
            dayEnd: day.dayEnd ?? null,
            stageOrder: stage.stageOrder ?? stageIndex + 1,
            stage: stageName,
            stageSlug: stage.stageSlug,
            stageCanonical,
            stageColor: stage.stageColor ?? artist.stageColor ?? null,
            artistOrder: artist.artistOrder ?? artistIndex + 1,
            artistName,
            artistRaw: artist.artistRaw ?? artistName,
          };
        })
      )
    ).filter((entry) => !entry.host);
  }

  return [];
};

const extractLineupMapLayers = (moduleValue) => {
  const payload = moduleValue?.default ?? moduleValue ?? null;
  return Array.isArray(payload?.mapboxLayers) ? payload.mapboxLayers : [];
};

const buildLineupSourcesFromVersions = (versions) => (
  versions.map((version) => ({
    key: version.id,
    label: version.payload?.eventEditionName || version.versionLabel || `${version.status === 'active' ? 'Active' : 'Archived'} lineup`,
    entries: extractLineupEntries(version.payload),
    mapLayers: extractLineupMapLayers(version.payload),
    isLatest: version.status === 'active',
    status: version.status,
    payload: version.payload,
    eventEditionName: version.payload?.eventEditionName ?? version.versionLabel ?? null,
    payloadUpdatedAt: version.payload?.updatedAt ?? null,
    lastPublishedAt: version.activatedAt ?? null,
    versionLabel: version.versionLabel ?? null,
    source: 'supabase',
    payloadHash: version.payloadHash,
  }))
);

const readCachedLineupSources = () => {
  try {
    const rawValue = localStorage.getItem(LINEUP_VERSIONS_CACHE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    const cachedVersions = Array.isArray(parsed?.versions) ? parsed.versions : [];
    const cachedSources = buildLineupSourcesFromVersions(cachedVersions);

    cachedSources.forEach((lineupSource) => {
      if (lineupSource.entries.length > 0) {
        validateLineupPayload(lineupSource.entries);
      }
    });

    return cachedSources;
  } catch {
    return [];
  }
};

const writeCachedLineupVersions = (versions) => {
  try {
    localStorage.setItem(LINEUP_VERSIONS_CACHE_KEY, JSON.stringify({
      cachedAt: new Date().toISOString(),
      versions: Array.isArray(versions) ? versions : [],
    }));
  } catch {
    // Ignore storage errors.
  }
};

const getLineupStageFromPayload = (payload, daySlug, stageSlug) => {
  const day = getLineupDayFromPayload(payload, daySlug);
  const stage = day?.stages?.find((lineupStage) => String(lineupStage.stageSlug ?? '') === stageSlug) ?? null;

  return { day, stage };
};

const updateLineupPayloadEntry = ({ payload, entry, editValues }) => {
  const nextPayload = JSON.parse(JSON.stringify(payload));
  const artistName = editValues.artistName.trim();
  const daySlug = String(editValues.daySlug ?? '').trim();
  const stageSlug = String(editValues.stageSlug ?? '').trim();
  const startAt = getIsoFromDateAndTime({
    date: editValues.startDate,
    time: editValues.startTime,
  });
  const endAt = getIsoFromDateAndTime({
    date: editValues.endDate,
    time: editValues.endTime,
  });

  if (!artistName || !daySlug || !stageSlug || !startAt || !endAt) {
    throw new Error('Artist name, day, stage, start and end are required.');
  }

  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error('End time must be after start time.');
  }

  const { stage: targetStage } = getLineupStageFromPayload(nextPayload, daySlug, stageSlug);

  if (Array.isArray(nextPayload.lineup) && !targetStage) {
    throw new Error('Could not find the selected day and stage in the source lineup payload.');
  }

  const artistTags = getArtistTagsFromName(artistName);
  const artistTokens = artistTags.map((tag) => slugifyLineupValue(tag)).filter(Boolean);
  const artistSlug = slugifyLineupValue(artistName);
  const shouldKeepId = areSameEntryEditValues({ entry, artistName, daySlug, stageSlug, startAt, endAt });
  const nextId = shouldKeepId
    ? entry.id
    : `${daySlug}_${stageSlug}_${artistSlug}_${getScheduleTokenFromDateTime(editValues)}`;

  const buildEditedArtist = (artist) => ({
    ...artist,
    id: nextId,
    artistName,
    artistSlug,
    artistTags: artistTags.length > 0 ? artistTags : [artistName],
    artistTokens: artistTokens.length > 0 ? artistTokens : [artistSlug],
    startAt,
    endAt,
    ...(!shouldKeepId ? { artistId: null } : {}),
  });

  if (Array.isArray(nextPayload.lineup)) {
    let editedArtist = null;
    let sourceStage = null;

    nextPayload.lineup.forEach((day) => {
      day.stages?.forEach((stage) => {
        if (editedArtist || !Array.isArray(stage.artists)) {
          return;
        }

        const artistIndex = stage.artists.findIndex((artist) => artist?.id === entry.id);

        if (artistIndex >= 0) {
          editedArtist = buildEditedArtist(stage.artists[artistIndex]);
          stage.artists.splice(artistIndex, 1);
          sourceStage = stage;
        }
      });
    });

    if (!editedArtist) {
      throw new Error('Could not find this show in the source lineup payload.');
    }

    targetStage.artists = Array.isArray(targetStage.artists) ? targetStage.artists : [];
    targetStage.artists.push(editedArtist);
    sortArtistsBySchedule(targetStage.artists);

    if (sourceStage && sourceStage !== targetStage) {
      sortArtistsBySchedule(sourceStage.artists);
    }
  } else {
    const visitArtists = (artists) => {
      if (!Array.isArray(artists)) {
        return false;
      }

      const artistIndex = artists.findIndex((artist) => artist?.id === entry.id);

      if (artistIndex < 0) {
        return false;
      }

      artists[artistIndex] = {
        ...buildEditedArtist(artists[artistIndex]),
        daySlug,
        stageSlug,
      };
      sortArtistsBySchedule(artists);
      return true;
    };

    const didUpdate = visitArtists(nextPayload.entries) || (Array.isArray(nextPayload) && visitArtists(nextPayload));

    if (!didUpdate) {
      throw new Error('Could not find this show in the source lineup payload.');
    }
  }

  nextPayload.updatedAt = new Date().toISOString();

  return nextPayload;
};

const addLineupPayloadEntry = ({ payload, editValues }) => {
  const nextPayload = JSON.parse(JSON.stringify(payload));
  const artistName = editValues.artistName.trim();
  const daySlug = String(editValues.daySlug ?? '').trim();
  const stageSlug = String(editValues.stageSlug ?? '').trim();
  const startAt = getIsoFromDateAndTime({
    date: editValues.startDate,
    time: editValues.startTime,
  });
  const endAt = getIsoFromDateAndTime({
    date: editValues.endDate,
    time: editValues.endTime,
  });

  if (!artistName || !daySlug || !stageSlug || !startAt || !endAt) {
    throw new Error('Artist name, day, stage, start and end are required.');
  }

  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error('End time must be after start time.');
  }

  const { day, stage } = getLineupStageFromPayload(nextPayload, daySlug, stageSlug);

  if (!day || !stage) {
    throw new Error('Could not find the selected day and stage in the source lineup payload.');
  }

  const artistTags = getArtistTagsFromName(artistName);
  const artistTokens = artistTags.map((tag) => slugifyLineupValue(tag)).filter(Boolean);
  const artistSlug = slugifyLineupValue(artistName);
  const nextEntry = {
    id: `${daySlug}_${stageSlug}_${artistSlug}_${getScheduleTokenFromDateTime(editValues)}`,
    artistName,
    artistSlug,
    artistId: null,
    startAt,
    endAt,
    host: false,
    live: false,
    featured: false,
    artistTags: artistTags.length > 0 ? artistTags : [artistName],
    artistTokens: artistTokens.length > 0 ? artistTokens : [artistSlug],
    artistOrder: (stage.artists?.length ?? 0) + 1,
  };

  stage.artists = Array.isArray(stage.artists) ? stage.artists : [];
  stage.artists.push(nextEntry);
  sortArtistsBySchedule(stage.artists);

  nextPayload.updatedAt = new Date().toISOString();

  return nextPayload;
};

const AppBaseView = memo(({
  activeView,
  viewRefreshKey,
  viewPropsByView,
  navbarItems,
  onOpenView,
  onOpenSearch,
  onOpenHome,
  onOpenSettings,
  headerContent,
  wideHeaderContent,
  hideHeaderBrand,
  hideDesktopNavbar,
  hideHeaderProfile,
  keepMobileNavbarVisible,
  inlineHeaderCloseButton,
  onCloseHeaderContent,
  headerTransitionState,
  isOffline,
  isHidden,
  profileName,
  profileSubtitle,
  profileImageSrc,
  profileBadge,
  brandLogoSrc,
}) => {
  const { t } = useI18n();
  const ActiveViewComponent = VIEW_COMPONENTS[activeView];

  if (!ActiveViewComponent) {
    return null;
  }

  return (
    <View
      navbar={navbarItems}
      brandTitle={APP_DOCUMENT_TITLE}
      brandLogoSrc={brandLogoSrc}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileImageSrc={profileImageSrc}
      profileBadge={profileBadge}
      activeView={activeView}
      onOpenView={onOpenView}
      onOpenSearch={onOpenSearch}
      onBrandClick={onOpenHome}
      onUserClick={onOpenSettings}
      headerContent={headerContent}
      wideHeaderContent={wideHeaderContent}
      hideHeaderBrand={hideHeaderBrand}
      hideDesktopNavbar={hideDesktopNavbar}
      hideHeaderProfile={hideHeaderProfile}
      keepMobileNavbarVisible={keepMobileNavbarVisible}
      inlineHeaderCloseButton={inlineHeaderCloseButton}
      closeHeaderButtonAriaLabel={t('Close search')}
      onCloseHeaderContent={onCloseHeaderContent}
      headerTransitionState={headerTransitionState}
      isOffline={isOffline}
      isHidden={isHidden}
      className={`dq-app-view--${activeView}`}
    >
      <ActiveViewComponent
        key={`${activeView}-${viewRefreshKey}`}
        {...(viewPropsByView[activeView] ?? {})}
      />
    </View>
  );
});

AppBaseView.displayName = 'AppBaseView';

const AppPageLayer = memo(({
  page,
  layerIndex,
  onClosePage,
  onOpenPage,
  onOpenView,
  isOffline,
  isHidden,
  transitionState,
  pagePropsByType,
}) => {
  const { t } = useI18n();
  const pageDefinition = PAGE_DEFINITIONS[page.type];

  if (!pageDefinition) {
    return null;
  }

  const PageContent = pageDefinition.Component;
  const HeaderContent = pageDefinition.HeaderContentComponent;
  const pageProps = pagePropsByType[page.type] ?? {};

  return (
    <Page
      title={t(pageDefinition.title)}
      brandTitle={APP_DOCUMENT_TITLE}
      brandLogoSrc={activeSiteAssets.logoSrc}
      onClose={() => onClosePage(page.id)}
      onOpenPage={onOpenPage}
      onOpenView={onOpenView}
      headerContent={HeaderContent ? <HeaderContent {...pageProps} onClosePage={() => onClosePage(page.id)} /> : null}
      showFooter={pageDefinition.showFooter !== false}
      wideHeaderContent={pageDefinition.wideHeaderContent === true}
      hideHeaderBrand={pageDefinition.hideHeaderBrand === true}
      showCloseButton={pageDefinition.showCloseButton !== false}
      inlineCloseButton={pageDefinition.inlineCloseButton === true}
      isOffline={isOffline}
      isHidden={isHidden}
      transitionState={transitionState}
      layerIndex={layerIndex}
    >
      <PageContent {...pageProps} onOpenPage={onOpenPage} onOpenView={onOpenView} />
    </Page>
  );
});

AppPageLayer.displayName = 'AppPageLayer';

const App = () => {
  const bootStateRef = useRef(null);

  if (!bootStateRef.current) {
    bootStateRef.current = getBootAccountState();
  }

  const bootUserId = bootStateRef.current.userId;
  const bootAccount = bootStateRef.current.account;
  const initialRoute = useMemo(
    () => resolveRoute(window.location.pathname, window.location.search),
    []
  );
  const pageIdRef = useRef(0);
  const initialPageStack = useMemo(
    () => getHistoryPageStack({
      historyState: window.history.state,
      pageDefinitions: PAGE_DEFINITIONS,
    }),
    []
  );
  const pageStackRef = useRef(initialPageStack);
  const closedPageTypesRef = useRef(new Set());
  const [activeView, setActiveView] = useState(initialRoute.view);
  const [viewRefreshKey, setViewRefreshKey] = useState(0);
  const [lineupSources, setLineupSources] = useState(() => readCachedLineupSources());
  const [tempLineupSource, setTempLineupSource] = useState(null);
  const [isManualLineupEditAllowed, setIsManualLineupEditAllowed] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [hasTriedPerformanceEditSubmit, setHasTriedPerformanceEditSubmit] = useState(false);
  const previousSearchViewRef = useRef(initialRoute.view === 'search' ? null : initialRoute.view);
  const [searchHeaderQuery, setSearchHeaderQuery] = useState('');
  const [headerMode, setHeaderMode] = useState(() => getHeaderModeForView(initialRoute.view));
  const headerModeRef = useRef(headerMode);
  const headerModeTransitionTimeoutRef = useRef(null);
  const headerModeOpenTimeoutRef = useRef(null);
  const [headerModeTransitionState, setHeaderModeTransitionState] = useState('open');
  const [pageStack, setPageStack] = useState(initialPageStack);
  const {
    renderedPageStack,
    hasRenderedPages,
    shouldHideBaseView,
    topPageTransitionState,
    getIsPageHidden,
  } = useAnimatedPageStack(pageStack);
  const [selectedLineupKey, setSelectedLineupKey] = useState(null);
  const [selectedDay, setSelectedDay] = useState(
    () => loadViewPreferences()?.selectedDay || 'All days'
  );
  const [selectedStage, setSelectedStage] = useState(
    () => loadViewPreferences()?.selectedStage || 'All stages'
  );
  const [selectedTimetableDay, setSelectedTimetableDay] = useState(
    () => loadViewPreferences()?.selectedTimetableDay || ''
  );
  const [selectedStyles, setSelectedStyles] = useState(
    () => loadViewPreferences()?.selectedStyles ?? []
  );
  const [hidePastEvents, setHidePastEvents] = useState(() => loadHidePastEventsPreference());
  const [hideUndatedEvents, setHideUndatedEvents] = useState(() => loadHideUndatedEventsPreference());
  const [ignoreSmallConflicts, setIgnoreSmallConflicts] = useState(() =>
    loadIgnoreSmallConflictsPreference()
  );
  const [showStyleTags, setShowStyleTags] = useState(() => loadShowStyleTagsPreference());
  const [isJokeLineupEnabled, setIsJokeLineupEnabled] = useState(false);
  const [isJokeLineupSaving, setIsJokeLineupSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [favoriteItems, setFavoriteItems] = useState(() => bootAccount?.favorites ?? []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTribeOnly, setShowTribeOnly] = useState(false);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [ignoredReviewConflictIds, setIgnoredReviewConflictIds] = useState(() => new Set());
  const activeHydrationIdRef = useRef(0);
  const authHydrationTimeoutRef = useRef(0);
  const lastAuthenticatedUserIdRef = useRef(bootUserId);
  const hasRemoteAccountBundleRef = useRef(false);
  const hasPendingFavoriteSyncRef = useRef(false);
  const lastSyncedFavoritesRef = useRef(serializeFavoriteItems(bootAccount?.favorites ?? []));
  const favoriteItemsRef = useRef(bootAccount?.favorites ?? []);
  const lastHydratedAuthKeyRef = useRef(bootUserId ? `user:${bootUserId}` : 'guest');
  const hydrateAccountRef = useRef(null);
  const [authUser, setAuthUser] = useState(() => (bootUserId ? { id: bootUserId } : null));
  const [profile, setProfile] = useState(() => bootAccount?.profile ?? null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingLineupCount, setPendingLineupCount] = useState(0);
  const [tribe, setTribe] = useState(() => bootAccount?.tribe ?? null);
  const [tribeMemberLocations, setTribeMemberLocations] = useState([]);
  const [focusedTribeLocationUserId, setFocusedTribeLocationUserId] = useState(null);
  const [focusedTribeLocationMapLayerId, setFocusedTribeLocationMapLayerId] = useState(null);
  const [mapCalibrationPoints, setMapCalibrationPoints] = useState(() => readCachedMapCalibrationPoints());
  const [isMapCalibrationMode, setIsMapCalibrationMode] = useState(false);
  const [mapCalibrationMessage, setMapCalibrationMessage] = useState('');
  const [isLiveLocationSharing, setIsLiveLocationSharing] = useState(false);
  const [liveLocationRemainingMinutes, setLiveLocationRemainingMinutes] = useState(null);
  const liveLocationWatchIdRef = useRef(null);
  const liveLocationTimeoutIdRef = useRef(0);
  const liveLocationRefreshIntervalIdRef = useRef(0);
  const liveLocationExpiresAtRef = useRef(null);
  const lastLiveLocationGpsRef = useRef(null);
  const lastLiveMapLocationRef = useRef(null);
  const lastCalibrationLocationSyncKeyRef = useRef('');
  const calibratedMapLayerTransformsRef = useRef([]);
  const [isTribeReady, setIsTribeReady] = useState(() => bootAccount !== null);
  const [isCurrentTribeChecked, setIsCurrentTribeChecked] = useState(() => !isSupabaseConfigured());
  const [isTribeBusy, setIsTribeBusy] = useState(false);
  const [pendingTribeInviteCode, setPendingTribeInviteCode] = useState(() =>
    readPendingTribeInviteCode()
  );
  const [tribeInviteAlert, setTribeInviteAlert] = useState('');
  const [isAccountReady, setIsAccountReady] = useState(() => bootAccount !== null || !isSupabaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  const [pendingAction, setPendingAction] = useState(null);
  const attemptedInviteJoinKeyRef = useRef('');
  const promptedTribeInviteAuthRef = useRef(false);
  const pwaInstall = usePwaInstallPrompt();
  const isOnline = useOnlineStatus();
  const isOffline = !isOnline;

  useDocumentScrollLock(hasRenderedPages);

  useEffect(() => {
    const rootElement = document.documentElement;
    let animationFrameId = 0;

    const updateViewportHeight = () => {
      animationFrameId = 0;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

      if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
        rootElement.style.setProperty('--dq-viewport-height', `${Math.round(viewportHeight)}px`);
      }
    };

    const scheduleViewportHeightUpdate = () => {
      if (animationFrameId !== 0) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateViewportHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', scheduleViewportHeightUpdate);
    window.addEventListener('orientationchange', scheduleViewportHeightUpdate);
    window.visualViewport?.addEventListener('resize', scheduleViewportHeightUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleViewportHeightUpdate);

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener('resize', scheduleViewportHeightUpdate);
      window.removeEventListener('orientationchange', scheduleViewportHeightUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleViewportHeightUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleViewportHeightUpdate);
      rootElement.style.removeProperty('--dq-viewport-height');
    };
  }, []);

  const refreshLineupSources = useCallback(async ({ selectLatest = false } = {}) => {
    if (!isSupabaseConfigured()) {
      const cachedSources = readCachedLineupSources();
      setLineupSources(cachedSources);
      setSelectedLineupKey((currentKey) => (
        !selectLatest && cachedSources.some((lineup) => lineup.key === currentKey)
          ? currentKey
          : cachedSources[0]?.key ?? null
      ));
      return cachedSources;
    }

    const versions = await loadPublishedLineupVersions(activeSite.slug);
    const nextSources = buildLineupSourcesFromVersions(versions);
    const resolvedSources = nextSources;

    for (const lineupSource of resolvedSources) {
      if (lineupSource.entries.length > 0) {
        validateLineupPayload(lineupSource.entries);
      }
    }

    writeCachedLineupVersions(versions);
    setLineupSources(resolvedSources);
    setSelectedLineupKey((currentKey) => (
      !selectLatest && tempLineupSource && currentKey === tempLineupSource.key
        ? currentKey
        :
      !selectLatest && resolvedSources.some((lineup) => lineup.key === currentKey)
        ? currentKey
        : resolvedSources[0]?.key ?? null
    ));

    return resolvedSources;
  }, [tempLineupSource]);

  const refreshPendingLineupCount = useCallback(async () => {
    if (!isSupabaseConfigured() || !isAdmin) {
      setPendingLineupCount(0);
      return 0;
    }

    const versions = await loadAdminLineupVersions(activeSite.slug);
    const nextPendingLineupCount = versions.filter((lineup) => lineup.status === 'pending').length;

    setPendingLineupCount(nextPendingLineupCount);

    return nextPendingLineupCount;
  }, [isAdmin]);

  const handlePullRefresh = useCallback(async () => {
    startTransition(() => {
      setCurrentTime(Date.now());
      setViewRefreshKey((currentKey) => currentKey + 1);
    });

    await Promise.allSettled([
      refreshLineupSources({ selectLatest: true }),
      refreshPendingLineupCount(),
    ]);

    if (isSupabaseConfigured()) {
      await hydrateAccountRef.current?.(authUser ?? null, { hasUserOverride: Boolean(authUser) })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [authUser, refreshLineupSources, refreshPendingLineupCount]);

  const {
    pullDistance,
    pullProgress,
    refreshState,
    isDragging,
    isPullVisible,
  } = usePullToRefresh({
    disabled: hasRenderedPages || activeView === 'maps',
    onRefresh: handlePullRefresh,
  });

  useEffect(() => {
    const topPage = pageStack.at(-1);
    const pageTitle = topPage ? PAGE_DEFINITIONS[topPage.type]?.title : null;

    document.title = formatDocumentTitle(pageTitle ?? getTitleForView(activeView));
  }, [activeView, pageStack]);

  useEffect(() => {
    const faviconHref = getSiteFaviconHref();
    const faviconType = activeSite.assets.favicon.endsWith('.ico') ? 'image/x-icon' : 'image/svg+xml';
    const existingIcons = Array.from(document.querySelectorAll('link[rel="icon"]'));
    const faviconLink = existingIcons[0] ?? document.createElement('link');

    faviconLink.setAttribute('rel', 'icon');
    faviconLink.setAttribute('href', faviconHref);
    faviconLink.setAttribute('type', faviconType);

    if (!faviconLink.parentNode) {
      document.head.appendChild(faviconLink);
    }

    existingIcons.slice(1).forEach((iconLink) => iconLink.remove());
  }, []);

  useEffect(() => {
    refreshLineupSources().catch((error) => {
      console.error(error);
    });
  }, [refreshLineupSources]);

  useEffect(() => {
    if (!authUser || !isSupabaseConfigured()) {
      setIsAdmin(false);
      setPendingLineupCount(0);
      return;
    }

    let isActive = true;

    isCurrentUserAdmin()
      .then((nextIsAdmin) => {
        if (isActive) {
          setIsAdmin(nextIsAdmin);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isActive) {
          setIsAdmin(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authUser]);

  useEffect(() => {
    refreshPendingLineupCount().catch((error) => {
      console.error(error);
    });
  }, [refreshPendingLineupCount]);

  useEffect(() => () => {
    if (headerModeTransitionTimeoutRef.current) {
      window.clearTimeout(headerModeTransitionTimeoutRef.current);
    }

    if (headerModeOpenTimeoutRef.current) {
      window.clearTimeout(headerModeOpenTimeoutRef.current);
    }
  }, []);

  const availableLineupSources = useMemo(() => (
    tempLineupSource
      ? [
          tempLineupSource,
          ...lineupSources.filter((lineup) => lineup.key !== tempLineupSource.key),
        ]
      : lineupSources
  ), [lineupSources, tempLineupSource]);
  const selectedLineup = useMemo(
    () => availableLineupSources.find((lineup) => lineup.key === selectedLineupKey) ?? availableLineupSources[0] ?? null,
    [availableLineupSources, selectedLineupKey]
  );
  const activePublishedLineup = useMemo(
    () => lineupSources.find((lineup) => lineup.status === 'active') ?? null,
    [lineupSources]
  );
  const hasPublishedLineup = Boolean(activePublishedLineup);
  const canEditSelectedLineup = (
    isAdmin &&
    isManualLineupEditAllowed &&
    hasPublishedLineup &&
    Boolean(selectedLineup?.payload) &&
    (selectedLineup?.status === 'active' || selectedLineup?.status === 'temp')
  );
  const manualLineupEditSource = tempLineupSource ?? activePublishedLineup;
  const selectedEntries = useMemo(() => selectedLineup?.entries ?? [], [selectedLineup]);
  const hasTimetableView = useMemo(
    () => selectedEntries.some((entry) => hasCompleteSchedule(entry)),
    [selectedEntries]
  );
  const defaultScheduleView = hasTimetableView ? 'timetable' : 'lineup';
  const fallbackMapLayers = useMemo(
    () => getFallbackMapImageLayers(activeSite.slug),
    []
  );
  const selectedMapLayers = useMemo(() => {
    const lineupMapLayers = selectedLineup?.mapLayers ?? [];

    return lineupMapLayers.length > 0 ? lineupMapLayers : fallbackMapLayers;
  }, [fallbackMapLayers, selectedLineup]);
  const hasMapsView = useMemo(
    () => selectedMapLayers.length > 0,
    [selectedMapLayers]
  );

  useEffect(() => {
    cacheMapLayerImages(selectedMapLayers).catch(() => {});
  }, [selectedMapLayers]);

  const hasLineup = Boolean(selectedLineup);
  const isLatestLineupSelected = selectedLineup?.isLatest ?? false;
  const isPreviewLineupSelected = selectedLineup?.status === 'preview' || selectedLineup?.status === 'temp';
  const shouldHidePastEvents = hidePastEvents && isLatestLineupSelected;
  const favoritesReadOnly = hasLineup && !isLatestLineupSelected;
  const readOnlyLineupNotice = isPreviewLineupSelected
    ? 'You are previewing a pending lineup in read-only mode. Favorites and reviews are shown for checking only, and nothing is saved.'
    : 'You are browsing an older lineup snapshot in read-only mode, so favorites cannot be added, removed or updated here. Switch back to the latest snapshot in Settings to edit them again.';
  const readOnlyLineupNoticeTitle = isPreviewLineupSelected
    ? 'Lineup preview'
    : 'Archived lineup snapshot';
  const entriesById = useMemo(
    () => {
      const nextEntriesById = new Map();

      selectedEntries.forEach((entry) => {
        if (!entry?.id) {
          return;
        }

        nextEntriesById.set(entry.id, entry);
        nextEntriesById.set(getStableEntryId(entry.id), entry);
      });

      return nextEntriesById;
    },
    [selectedEntries]
  );

  useEffect(() => {
    if (!hasPublishedLineup && isManualLineupEditAllowed) {
      setIsManualLineupEditAllowed(false);
    }
  }, [hasPublishedLineup, isManualLineupEditAllowed]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    loadMapCalibrationPoints()
      .then((points) => {
        const nextPoints = sortMapCalibrationPoints(points);
        setMapCalibrationPoints(nextPoints);
        writeCachedMapCalibrationPoints(nextPoints);
      })
      .catch(() => {
        setMapCalibrationPoints((currentPoints) => (
          currentPoints.length > 0 ? currentPoints : readCachedMapCalibrationPoints()
        ));
      });
  }, [selectedLineupKey]);

  useEffect(() => () => {
    if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
    }

    window.clearTimeout(liveLocationTimeoutIdRef.current);
    window.clearInterval(liveLocationRefreshIntervalIdRef.current);
    liveLocationRefreshIntervalIdRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isLiveLocationSharing || !liveLocationExpiresAtRef.current) {
      setLiveLocationRemainingMinutes(null);
      return undefined;
    }

    const updateRemainingMinutes = () => {
      const remainingMs = new Date(liveLocationExpiresAtRef.current).getTime() - Date.now();
      setLiveLocationRemainingMinutes(Math.max(0, Math.ceil(remainingMs / 60000)));
    };

    updateRemainingMinutes();
    const intervalId = window.setInterval(updateRemainingMinutes, LIVE_LOCATION_REMAINING_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isLiveLocationSharing]);

  const deferredFavoriteItems = useDeferredValue(favoriteItems);

  useEffect(() => {
    favoriteItemsRef.current = favoriteItems;
  }, [favoriteItems]);

  const favoriteResolution = useMemo(
    () => resolveFavoriteItems(selectedEntries, deferredFavoriteItems),
    [selectedEntries, deferredFavoriteItems]
  );
  const favoriteIdSet = useMemo(
    () => new Set([
      ...favoriteResolution.ids,
      ...deferredFavoriteItems.map((item) => item.favoriteKey).filter(Boolean),
    ]),
    [deferredFavoriteItems, favoriteResolution]
  );
  const reviewFavorites = favoriteResolution.reviewItems;
  const baseVisibleReviewFavorites = useMemo(
    () => (hideUndatedEvents ? filterUndatedReviewFavorites(reviewFavorites) : reviewFavorites),
    [hideUndatedEvents, reviewFavorites]
  );
  const visibleReviewFavorites = useMemo(
    () =>
      shouldHidePastEvents
        ? filterExpiredReviewFavorites(baseVisibleReviewFavorites, currentTime)
        : baseVisibleReviewFavorites,
    [baseVisibleReviewFavorites, currentTime, shouldHidePastEvents]
  );
  const baseBrowseableEntries = useMemo(
    () => (hideUndatedEvents ? filterUndatedEntries(selectedEntries) : selectedEntries),
    [hideUndatedEvents, selectedEntries]
  );
  const browseableEntries = useMemo(
    () =>
      shouldHidePastEvents
        ? filterExpiredEntries(baseBrowseableEntries, currentTime)
        : baseBrowseableEntries,
    [baseBrowseableEntries, currentTime, shouldHidePastEvents]
  );
  const activeProfile = profile ?? buildOptimisticProfile(authUser);
  const language = normalizeLanguage(activeProfile?.preferred_language, activeSite.defaultLanguage);
  const t = useCallback((message, replacements = {}) => (
    getTranslation(language, message, replacements)
  ), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.translate = false;
  }, [language]);

  useEffect(() => {
    if (!isLatestLineupSelected) {
      return;
    }

    setFavoriteItems((previousItems) => {
      const reconciledItems = reconcileFavoriteItemsWithEntries(selectedEntries, previousItems);
      return reconciledItems === previousItems ? previousItems : reconciledItems;
    });
  }, [favoriteItems, isLatestLineupSelected, selectedEntries]);

  const tribeLikesByEntryId = useMemo(() => {
    if (!tribe?.members?.length) {
      return new Map();
    }

    const likesByEntryId = new Map();

    tribe.members.forEach((member) => {
      const profileRecord = member.profile ?? {};
      const avatarUrl =
        resolveProfileAvatarUrl(profileRecord) ||
        getPresetAvatarUrl(profileRecord?.avatar_preset ?? 1);
      const username = String(profileRecord.username ?? '').trim();
      const firstName = String(profileRecord.first_name ?? '').trim() || profileRecord.username || 'Tribe';
      const lastName = String(profileRecord.last_name ?? '').trim() || 'member';
      const seenEntryIds = new Set();

      (member.favorites ?? []).forEach((favorite) => {
        let matchedEntry = null;

        if (favorite.id && entriesById.has(favorite.id)) {
          matchedEntry = entriesById.get(favorite.id);
        }

        if (!matchedEntry || seenEntryIds.has(matchedEntry.id)) {
          return;
        }

        seenEntryIds.add(matchedEntry.id);
        const currentLikes = likesByEntryId.get(matchedEntry.id) ?? [];
        currentLikes.push({
          userId: member.userId,
          firstName,
          lastName,
          username,
          avatarUrl,
          isCurrentUser: member.userId === authUser?.id,
        });
        likesByEntryId.set(matchedEntry.id, currentLikes);
      });
    });

    return likesByEntryId;
  }, [authUser, entriesById, tribe]);

  const tribeLikedEntryIds = useMemo(
    () => new Set(
      Array.from(tribeLikesByEntryId.entries())
        .filter(([, likes]) => likes.some((member) => !member.isCurrentUser))
        .map(([entryId]) => entryId)
    ),
    [tribeLikesByEntryId]
  );
  const mapTribeLocations = useMemo(() => {
    if (!tribe?.members?.length || tribeMemberLocations.length === 0) {
      return [];
    }

    const membersById = new Map(tribe.members.map((member) => [member.userId, member]));

    return tribeMemberLocations
      .filter((location) => (
        !location.expiresAt ||
        new Date(location.expiresAt).getTime() > Date.now()
      ))
      .map((location) => {
        const member = membersById.get(location.userId);
        const profileRecord = member?.profile ?? {};
        const avatarUrl =
          resolveProfileAvatarUrl(profileRecord) ||
          getPresetAvatarUrl(profileRecord?.avatar_preset ?? 1);

        return {
          ...location,
          member,
          profile: profileRecord,
          displayName: getProfileDisplayName(profileRecord),
          username: String(profileRecord.username ?? '').trim(),
          avatarUrl,
          isCurrentUser: location.userId === authUser?.id,
        };
      })
      .filter((location) => (
        Number.isFinite(location.longitude) &&
        Number.isFinite(location.latitude) &&
        location.member
      ));
  }, [authUser?.id, tribe, tribeMemberLocations]);

  const tribeFilterEntryIds = useMemo(
    () => new Set([...tribeLikedEntryIds, ...favoriteIdSet]),
    [favoriteIdSet, tribeLikedEntryIds]
  );
  const styleLookups = useMemo(() => {
    const styleTagsByArtistToken = new Map();
    const styleTagsByArtistName = new Map();

    ELECTRONIC_FESTIVAL_STYLES_DB.forEach((record) => {
      const recordTags = getStyleTagItemsFromRecord(record);

      if (recordTags.length === 0) {
        return;
      }

      const artistToken = getComparableLabel(record.artistToken);
      const artistName = getComparableLabel(record.artistName);

      if (artistToken) {
        styleTagsByArtistToken.set(artistToken, recordTags);
      }

      if (artistName) {
        styleTagsByArtistName.set(artistName, recordTags);
      }
    });

    return {
      styleTagsByArtistName,
      styleTagsByArtistToken,
    };
  }, []);
  const selectedStyleSet = useMemo(
    () => new Set(selectedStyles.map(getComparableLabel).filter(Boolean)),
    [selectedStyles]
  );
  const styleTagsByEntryId = useMemo(
    () => new Map(
      selectedEntries.map((entry) => [
        entry.id,
        getEntryStyleTagItems(
          entry,
          styleLookups.styleTagsByArtistToken,
          styleLookups.styleTagsByArtistName
        ),
      ])
    ),
    [selectedEntries, styleLookups]
  );
  const days = useMemo(() => getDays(browseableEntries), [browseableEntries]);
  const defaultBrowseDay = useMemo(
    () => getDefaultFestivalDay(browseableEntries, currentTime),
    [browseableEntries, currentTime]
  );
  const calibratedMapLayerTransforms = useMemo(
    () => getCalibratedMapLayerTransforms(selectedMapLayers, mapCalibrationPoints),
    [mapCalibrationPoints, selectedMapLayers]
  );
  useEffect(() => {
    calibratedMapLayerTransformsRef.current = calibratedMapLayerTransforms;
  }, [calibratedMapLayerTransforms]);
  const calibratedMapLayerIds = useMemo(
    () => new Set(calibratedMapLayerTransforms.map((item) => item.mapLayerId)),
    [calibratedMapLayerTransforms]
  );
  const calibrationSyncSignature = useMemo(() => (
    mapCalibrationPoints
      .filter((point) => point?.isActive !== false)
      .map((point) => [
        point.mapLayerId,
        point.id,
        point.mapLongitude,
        point.mapLatitude,
        point.gpsLongitude,
        point.gpsLatitude,
        point.updatedAt,
      ].join(':'))
      .sort()
      .join('|')
  ), [mapCalibrationPoints]);
  const settingsTribeLocations = useMemo(() => {
    if (!mapTribeLocations.length || selectedMapLayers.length === 0) {
      return [];
    }

    const preferredMapLayerId = getDefaultMapLayerIdForDay(selectedMapLayers, defaultBrowseDay);
    const selectedMapLayerIds = new Set(selectedMapLayers.map((layer) => layer.id));
    const locationsByUserId = new Map();

    mapTribeLocations.forEach((location) => {
      const exactMapLayerId = location.mapLayerId ?? '';
      const canShowOnPreferredMap =
        exactMapLayerId === preferredMapLayerId ||
        (hasGpsLocation(location) && calibratedMapLayerIds.has(preferredMapLayerId));
      const resolvedMapLayerId = canShowOnPreferredMap
        ? preferredMapLayerId
        : exactMapLayerId;

      if (!resolvedMapLayerId || !selectedMapLayerIds.has(resolvedMapLayerId)) {
        return;
      }

      const currentLocation = locationsByUserId.get(location.userId);
      const nextLocation = {
        ...location,
        targetMapLayerId: resolvedMapLayerId,
      };

      if (!currentLocation) {
        locationsByUserId.set(location.userId, nextLocation);
        return;
      }

      const currentIsPreferred = currentLocation.targetMapLayerId === preferredMapLayerId;
      const nextIsPreferred = nextLocation.targetMapLayerId === preferredMapLayerId;
      const currentIsLive = currentLocation.locationKind === 'live';
      const nextIsLive = nextLocation.locationKind === 'live';

      if (
        (nextIsPreferred && !currentIsPreferred) ||
        (nextIsPreferred === currentIsPreferred && nextIsLive && !currentIsLive) ||
        (
          nextIsPreferred === currentIsPreferred &&
          nextIsLive === currentIsLive &&
          new Date(nextLocation.updatedAt ?? 0).getTime() > new Date(currentLocation.updatedAt ?? 0).getTime()
        )
      ) {
        locationsByUserId.set(location.userId, nextLocation);
      }
    });

    return Array.from(locationsByUserId.values());
  }, [calibratedMapLayerIds, defaultBrowseDay, mapTribeLocations, selectedMapLayers]);
  const timetableDays = useMemo(
    () => getDays(browseableEntries.filter((entry) => hasCompleteSchedule(entry))),
    [browseableEntries]
  );
  const defaultTimetableDay = useMemo(() => {
    if (!timetableDays.length) {
      return '';
    }

    return timetableDays.some((day) => getComparableLabel(day) === getComparableLabel(defaultBrowseDay))
      ? defaultBrowseDay
      : timetableDays[0];
  }, [defaultBrowseDay, timetableDays]);
  useEffect(() => {
    if (timetableDays.length === 0) {
      if (selectedTimetableDay) {
        setSelectedTimetableDay('');
      }

      return;
    }

    if (!timetableDays.some((day) => getComparableLabel(day) === getComparableLabel(selectedTimetableDay))) {
      setSelectedTimetableDay(defaultTimetableDay);
    }
  }, [defaultTimetableDay, selectedTimetableDay, timetableDays]);
  const stages = useMemo(
    () => getStages(browseableEntries, selectedDay),
    [browseableEntries, selectedDay]
  );
  const stageColorsByName = useMemo(() => {
    const colorsByName = new Map();

    browseableEntries.forEach((entry) => {
      const stageName = getCanonicalStageName(entry.stageCanonical ?? entry.stage);
      const stageKey = getComparableLabel(stageName);

      if (stageKey && entry.stageColor && !colorsByName.has(stageKey)) {
        colorsByName.set(stageKey, entry.stageColor);
      }
    });

    return colorsByName;
  }, [browseableEntries]);
  const baseFilteredEntriesBeforeStyles = useMemo(
    () =>
      filterEntries(browseableEntries, {
        query: '',
        day: selectedDay,
        stage: selectedStage,
      }),
    [browseableEntries, selectedDay, selectedStage]
  );
  const baseFilteredEntries = useMemo(
    () =>
      baseFilteredEntriesBeforeStyles.filter((entry) =>
        entryMatchesSelectedStyles(
          entry,
          selectedStyleSet,
          styleLookups.styleTagsByArtistToken,
          styleLookups.styleTagsByArtistName
        )
      ),
    [baseFilteredEntriesBeforeStyles, selectedStyleSet, styleLookups]
  );
  const lineupStyleOptionEntries = useMemo(() => {
    let nextEntries = baseFilteredEntriesBeforeStyles;

    if (showTribeOnly) {
      nextEntries = nextEntries.filter((entry) => tribeFilterEntryIds.has(entry.id));
    }

    if (showFavoritesOnly) {
      nextEntries = nextEntries.filter((entry) => favoriteIdSet.has(entry.id));
    }

    return nextEntries;
  }, [
    baseFilteredEntriesBeforeStyles,
    favoriteIdSet,
    showFavoritesOnly,
    showTribeOnly,
    tribeFilterEntryIds,
  ]);
  const visibleEntries = useMemo(() => {
    let nextEntries = baseFilteredEntries;

    if (showTribeOnly) {
      nextEntries = nextEntries.filter((entry) => tribeFilterEntryIds.has(entry.id));
    }

    if (showFavoritesOnly) {
      nextEntries = nextEntries.filter((entry) => favoriteIdSet.has(entry.id));
    }

    return nextEntries;
  }, [
    baseFilteredEntries,
    favoriteIdSet,
    showFavoritesOnly,
    showTribeOnly,
    tribeFilterEntryIds,
  ]);
  const lineupStyleOptions = useMemo(
    () => getStyleOptionsFromEntries(
      lineupStyleOptionEntries,
      styleLookups.styleTagsByArtistToken,
      styleLookups.styleTagsByArtistName
    ),
    [lineupStyleOptionEntries, styleLookups]
  );
  const groupedVisibleEntries = useMemo(
    () => groupEntriesByDayAndStage(visibleEntries),
    [visibleEntries]
  );
  const searchVisibleEntries = useMemo(
    () =>
      searchHeaderQuery.trim()
        ? filterEntries(visibleEntries, {
            query: searchHeaderQuery,
            day: 'All days',
            stage: 'All stages',
          })
        : visibleEntries,
    [searchHeaderQuery, visibleEntries]
  );
  const groupedSearchVisibleEntries = useMemo(
    () => groupEntriesByDayAndStage(searchVisibleEntries),
    [searchVisibleEntries]
  );
  const jokeLineupSearchKey = useMemo(
    () => normalizeLineupText(searchHeaderQuery),
    [searchHeaderQuery]
  );
  const isJokeLineupSearchActive = (
    isJokeLineupEnabled &&
    JOKE_LINEUP_SEARCH_TERMS.has(jokeLineupSearchKey)
  );
  const selectedTimetableDayLabel = selectedTimetableDay || defaultTimetableDay;
  const favoriteTimetableConflictEntries = useMemo(() => {
    const timetableEntries = browseableEntries.filter((entry) => hasCompleteSchedule(entry));
    const conflictIds = getConflictingFavoriteEntryIds(
      timetableEntries,
      favoriteIdSet,
      ignoreSmallConflicts
    );

    return timetableEntries.filter((entry) => conflictIds.has(entry.id));
  }, [browseableEntries, favoriteIdSet, ignoreSmallConflicts]);
  const favoriteTimetableConflictCount = useMemo(
    () => getActiveTimetableConflictCount(
      favoriteTimetableConflictEntries,
      ignoreSmallConflicts,
      ignoredReviewConflictIds
    ),
    [favoriteTimetableConflictEntries, ignoredReviewConflictIds, ignoreSmallConflicts]
  );
  const reviewCount = isLatestLineupSelected
    ? visibleReviewFavorites.length + favoriteTimetableConflictCount
    : 0;
  const baseTimetableEntriesBeforeStyles = useMemo(
    () =>
      selectedTimetableDayLabel
        ? filterEntries(browseableEntries.filter((entry) => hasCompleteSchedule(entry)), {
            query: '',
            day: selectedTimetableDayLabel,
            stage: 'All stages',
          })
        : [],
    [browseableEntries, selectedTimetableDayLabel]
  );
  const baseTimetableEntries = useMemo(
    () =>
      baseTimetableEntriesBeforeStyles.filter((entry) =>
        entryMatchesSelectedStyles(
          entry,
          selectedStyleSet,
          styleLookups.styleTagsByArtistToken,
          styleLookups.styleTagsByArtistName
        )
      ),
    [baseTimetableEntriesBeforeStyles, selectedStyleSet, styleLookups]
  );
  const conflictingFavoriteEntryIds = useMemo(
    () => getConflictingFavoriteEntryIds(baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts),
    [baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts]
  );
  const conflictCount = useMemo(
    () => getFavoriteConflictPairCount(baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts),
    [baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts]
  );
  const conflictingFavoriteEntryIdsBeforeStyles = useMemo(
    () => getConflictingFavoriteEntryIds(
      baseTimetableEntriesBeforeStyles,
      favoriteIdSet,
      ignoreSmallConflicts
    ),
    [baseTimetableEntriesBeforeStyles, favoriteIdSet, ignoreSmallConflicts]
  );
  const timetableStyleOptionEntries = useMemo(() => {
    let nextEntries = baseTimetableEntriesBeforeStyles;

    if (showConflictsOnly) {
      return nextEntries.filter((entry) => conflictingFavoriteEntryIdsBeforeStyles.has(entry.id));
    }

    if (showTribeOnly) {
      nextEntries = nextEntries.filter((entry) => tribeFilterEntryIds.has(entry.id));
    }

    if (showFavoritesOnly) {
      nextEntries = nextEntries.filter((entry) => favoriteIdSet.has(entry.id));
    }

    return nextEntries;
  }, [
    baseTimetableEntriesBeforeStyles,
    conflictingFavoriteEntryIdsBeforeStyles,
    favoriteIdSet,
    showConflictsOnly,
    showFavoritesOnly,
    showTribeOnly,
    tribeFilterEntryIds,
  ]);
  const visibleTimetableEntries = useMemo(() => {
    let nextEntries = baseTimetableEntries;

    if (showConflictsOnly) {
      nextEntries = nextEntries.filter((entry) => conflictingFavoriteEntryIds.has(entry.id));
      return nextEntries;
    }

    if (showTribeOnly) {
      nextEntries = nextEntries.filter((entry) => tribeFilterEntryIds.has(entry.id));
    }

    if (showFavoritesOnly) {
      nextEntries = nextEntries.filter((entry) => favoriteIdSet.has(entry.id));
    }

    return nextEntries;
  }, [
    baseTimetableEntries,
    conflictingFavoriteEntryIds,
    favoriteIdSet,
    showConflictsOnly,
    showFavoritesOnly,
    showTribeOnly,
    tribeFilterEntryIds,
  ]);
  const timetableStyleOptions = useMemo(
    () => getStyleOptionsFromEntries(
      timetableStyleOptionEntries,
      styleLookups.styleTagsByArtistToken,
      styleLookups.styleTagsByArtistName
    ),
    [styleLookups, timetableStyleOptionEntries]
  );
  const activeStyleOptions = activeView === 'timetable'
    ? timetableStyleOptions
    : lineupStyleOptions;
  useEffect(() => {
    pageStackRef.current = pageStack;
    syncPageStackIdRef({
      pageIdRef,
      pageStack,
    });
  }, [pageStack]);

  useEffect(() => {
    replaceHistoryPageStackState({
      url: `${window.location.pathname}${window.location.search}`,
      pageStack: initialPageStack,
    });
  }, [initialPageStack]);

  useEffect(() => {
    const handlePopState = (event) => {
      const nextRoute = resolveRoute(window.location.pathname, window.location.search);
      let nextPageStack = getHistoryPageStack({
        historyState: event.state,
        pageDefinitions: PAGE_DEFINITIONS,
      });

      if (closedPageTypesRef.current.size > 0) {
        nextPageStack = nextPageStack.filter((page) => !closedPageTypesRef.current.has(page.type));
        replaceHistoryPageStackState({
          url: `${window.location.pathname}${window.location.search}`,
          pageStack: nextPageStack,
        });
      }

      pageStackRef.current = nextPageStack;
      setActiveView(nextRoute.view);
      setPageStack(nextPageStack);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const nextHeaderMode = getHeaderModeForView(activeView);

    if (nextHeaderMode === headerModeRef.current) {
      return undefined;
    }

    if (headerModeTransitionTimeoutRef.current) {
      window.clearTimeout(headerModeTransitionTimeoutRef.current);
    }

    if (headerModeOpenTimeoutRef.current) {
      window.clearTimeout(headerModeOpenTimeoutRef.current);
    }

    setHeaderModeTransitionState('exiting');

    headerModeTransitionTimeoutRef.current = window.setTimeout(() => {
      headerModeRef.current = nextHeaderMode;
      setHeaderMode(nextHeaderMode);
      setHeaderModeTransitionState('entering');

      headerModeOpenTimeoutRef.current = window.setTimeout(() => {
        setHeaderModeTransitionState('open');
      }, 260);
    }, 240);

    return undefined;
  }, [activeView]);

  const replaceViewInPlace = useCallback((nextView) => {
    replaceHistoryPageStackState({
      url: getUrlForView(nextView),
      pageStack: pageStackRef.current,
    });
    setActiveView(nextView);
  }, []);

  const openPage = useCallback((type) => {
    if (!PAGE_DEFINITIONS[type]) {
      return;
    }

    const nextStack = getNextPageStackOnOpen({
      currentStack: pageStackRef.current,
      nextType: type,
      pageDefinitions: PAGE_DEFINITIONS,
      createPageId: (pageType) => {
        pageIdRef.current += 1;
        return `${pageType}-${pageIdRef.current}`;
      },
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    closedPageTypesRef.current.delete(type);

    commitPageHistoryState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
      mode: 'auto',
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const closePage = useCallback((pageId) => {
    const closedPage = pageStackRef.current.find((page) => page.id === pageId);

    if (!closedPage) {
      return;
    }

    const nextStack = getNextPageStackOnClose({
      currentStack: pageStackRef.current,
      pageId,
    });
    closedPageTypesRef.current.add(closedPage.type);

    commitPageHistoryState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
      mode: 'replace',
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const openView = useCallback((view) => {
    if (view === activeView && pageStack.length === 0) {
      return;
    }

    commitPageHistoryState({
      url: getUrlForView(view),
      pageStack: [],
      mode: 'push',
    });

    pageStackRef.current = [];
    setPageStack([]);
    setActiveView(view);
  }, [activeView, pageStack.length]);

  const openSettings = useCallback(() => {
    openPage('settings');
  }, [openPage]);

  const requestAuth = useCallback((action, defaultTab = 'login') => {
    setPendingAction(action ?? null);
    setAuthDefaultTab(defaultTab);
    setIsAuthModalOpen(true);
  }, []);

  const resetBrowseState = useCallback(() => {
    setSearchHeaderQuery('');
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setSelectedTimetableDay(defaultTimetableDay);
    setSelectedStyles([]);
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
    setShowConflictsOnly(false);
  }, [defaultTimetableDay]);

  const openHomeView = useCallback(() => {
    startTransition(() => {
      resetBrowseState();
      setViewRefreshKey((currentKey) => currentKey + 1);
    });

    refreshLineupSources({ selectLatest: true }).catch((error) => {
      console.error(error);
    });

    commitPageHistoryState({
      url: getUrlForView(defaultScheduleView),
      pageStack: [],
      mode: activeView === defaultScheduleView && pageStackRef.current.length === 0
        ? 'replace'
        : 'push',
    });

    pageStackRef.current = [];
    setPageStack([]);
    setActiveView(defaultScheduleView);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeView, defaultScheduleView, refreshLineupSources, resetBrowseState]);

  const openSearch = useCallback(() => {
    if (activeView !== 'search') {
      previousSearchViewRef.current = activeView;
    }

    startTransition(() => {
      resetBrowseState();
    });
    openView('search');
  }, [activeView, openView, resetBrowseState]);

  const handleReturnFromSearch = useCallback(() => {
    openView(previousSearchViewRef.current ?? defaultScheduleView);
  }, [defaultScheduleView, openView]);

  const handleProfileButtonClick = useCallback(() => {
    if (!authUser) {
      requestAuth(null, 'login');
      return;
    }

    openSettings();
  }, [authUser, openSettings, requestAuth]);

  const handleLineupNav = useCallback(() => {
    startTransition(() => {
      resetBrowseState();
    });
    openView('lineup');
  }, [openView, resetBrowseState]);

  const handleTimetableNav = useCallback(() => {
    startTransition(() => {
      resetBrowseState();
    });
    openView('timetable');
  }, [openView, resetBrowseState]);

  const handleOpenTimetableConflicts = useCallback((day) => {
    if (!hasTimetableView) {
      return;
    }

    setSelectedTimetableDay(day || defaultTimetableDay);
    setShowFavoritesOnly(false);
    setShowConflictsOnly(true);
    setShowTribeOnly(false);
    openView('timetable');
  }, [defaultTimetableDay, hasTimetableView, openView]);

  const handleMapsNav = useCallback(() => {
    if (!hasMapsView) {
      return;
    }

    startTransition(() => {
      resetBrowseState();
    });
    openView('maps');
  }, [hasMapsView, openView, resetBrowseState]);

  const handleShowTribeLocationOnMap = useCallback((location) => {
    if (!hasMapsView || !location?.userId) {
      return;
    }

    setFocusedTribeLocationUserId(location.userId);
    setFocusedTribeLocationMapLayerId(location.targetMapLayerId ?? location.mapLayerId ?? null);
    startTransition(() => {
      resetBrowseState();
    });
    openView('maps');
  }, [hasMapsView, openView, resetBrowseState]);

  const handleReviewsNav = useCallback(() => {
    if (!authUser) {
      requestAuth({ type: 'open-reviews' });
      return;
    }

    startTransition(() => {
      resetBrowseState();
    });
    openView('reviews');
  }, [authUser, openView, requestAuth, resetBrowseState]);

  useEffect(() => {
    saveViewPreferences({ selectedDay, selectedStage, selectedStyles, selectedTimetableDay });
  }, [selectedDay, selectedStage, selectedStyles, selectedTimetableDay]);

  useEffect(() => {
    saveHidePastEventsPreference(hidePastEvents);
  }, [hidePastEvents]);

  useEffect(() => {
    saveHideUndatedEventsPreference(hideUndatedEvents);
  }, [hideUndatedEvents]);

  useEffect(() => {
    saveIgnoreSmallConflictsPreference(ignoreSmallConflicts);
  }, [ignoreSmallConflicts]);

  useEffect(() => {
    saveShowStyleTagsPreference(showStyleTags);
  }, [showStyleTags]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return undefined;
    }

    let isMounted = true;
    const refreshAppSettings = async () => {
      const settings = await loadAppSettings(activeSite.slug);
      const jokeLineupSetting = settings.find((setting) => (
        setting.key === 'joke_lineup_enabled'
      ));

      if (isMounted) {
        setIsJokeLineupEnabled(jokeLineupSetting?.value === true);
      }
    };

    refreshAppSettings().catch((error) => {
      console.error(error);
    });

    const channel = subscribeToAppSettings({
      siteSlug: activeSite.slug,
      onChange: () => {
        refreshAppSettings().catch((error) => {
          console.error(error);
        });
      },
    });

    return () => {
      isMounted = false;
      channel?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const shouldReplaceLineup = activeView === 'lineup' && hasTimetableView;
    const shouldReplaceTimetable = activeView === 'timetable' && !hasTimetableView;

    if (shouldReplaceLineup || shouldReplaceTimetable) {
      replaceViewInPlace(defaultScheduleView);
    }
  }, [activeView, defaultScheduleView, hasTimetableView, replaceViewInPlace]);

  useEffect(() => {
    if (!hasMapsView && activeView === 'maps') {
      replaceViewInPlace(defaultScheduleView);
    }
  }, [activeView, defaultScheduleView, hasMapsView, replaceViewInPlace]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (
      selectedDay !== 'All days' &&
      !days.some((day) => getComparableLabel(day) === getComparableLabel(selectedDay))
    ) {
      setSelectedDay('All days');
    }
  }, [days, selectedDay]);

  useEffect(() => {
    if (
      selectedStage !== 'All stages' &&
      !stages.some((stage) => getComparableLabel(stage) === getComparableLabel(selectedStage))
    ) {
      setSelectedStage('All stages');
    }
  }, [selectedStage, stages]);
  useEffect(() => {
    if (selectedStyles.length === 0) {
      return;
    }

    const availableStyleSet = new Set(activeStyleOptions.map((option) => getComparableLabel(option.value)));
    const nextSelectedStyles = selectedStyles.filter((style) =>
      availableStyleSet.has(getComparableLabel(style))
    );

    if (nextSelectedStyles.length !== selectedStyles.length) {
      setSelectedStyles(nextSelectedStyles);
    }
  }, [activeStyleOptions, selectedStyles]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const inviteCode = normalizeTribeCode(searchParams.get('tribe'));

    if (!inviteCode) {
      return;
    }

    const nextCode = writePendingTribeInviteCode(inviteCode);
    setPendingTribeInviteCode(nextCode);
    setTribeInviteAlert('');
    searchParams.delete('tribe');

    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;

    replaceHistoryPageStackState({
      url: nextUrl,
      pageStack: pageStackRef.current,
    });

    openSettings();

    if (!authUser) {
      promptedTribeInviteAuthRef.current = true;
      requestAuth({ type: 'open-tribe' }, 'login');
    }
  }, [authUser, openSettings, requestAuth]);

  useEffect(() => {
    if (
      !pendingTribeInviteCode ||
      authUser ||
      !isAccountReady ||
      promptedTribeInviteAuthRef.current
    ) {
      return;
    }

    promptedTribeInviteAuthRef.current = true;
    openSettings();
    requestAuth({ type: 'open-tribe' }, 'login');
  }, [authUser, isAccountReady, openSettings, pendingTribeInviteCode, requestAuth]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let isActive = true;

    const clearScheduledAuthHydration = () => {
      if (authHydrationTimeoutRef.current) {
        window.clearTimeout(authHydrationTimeoutRef.current);
        authHydrationTimeoutRef.current = 0;
      }
    };

    const hydrateFromAccount = async (userOverride, options = {}) => {
      const { hasUserOverride = false } = options;
      const hydrationId = activeHydrationIdRef.current + 1;

      activeHydrationIdRef.current = hydrationId;
      hasRemoteAccountBundleRef.current = false;

      try {
        const currentUser = hasUserOverride ? userOverride : await getCurrentUser();

        if (!isActive || hydrationId !== activeHydrationIdRef.current) {
          return;
        }

        if (!currentUser) {
          clearCachedAccount(lastAuthenticatedUserIdRef.current);
          writeLastAuthenticatedUserId(null);
          lastAuthenticatedUserIdRef.current = null;
          setAuthUser(null);
          setProfile(null);
          setTribe(null);
          setTribeMemberLocations([]);
          setIsTribeReady(true);
          setIsCurrentTribeChecked(true);
          setFavoriteItems([]);
          favoriteItemsRef.current = [];
          hasPendingFavoriteSyncRef.current = false;
          lastSyncedFavoritesRef.current = serializeFavoriteItems([]);
          lastHydratedAuthKeyRef.current = 'guest';
          setIsAccountReady(true);
          return;
        }

        lastAuthenticatedUserIdRef.current = currentUser.id;
        writeLastAuthenticatedUserId(currentUser.id);
        lastHydratedAuthKeyRef.current = `user:${currentUser.id}`;
        setAuthUser(currentUser);

        const cachedAccount = readCachedAccount(currentUser.id);

        if (cachedAccount) {
          setProfile(cachedAccount.profile ?? null);
          setFavoriteItems(cachedAccount.favorites ?? []);
          favoriteItemsRef.current = cachedAccount.favorites ?? [];
          setTribe(cachedAccount.tribe ?? null);
          setIsTribeReady(Boolean(cachedAccount.tribe));
          setIsCurrentTribeChecked(false);
          setIsAccountReady(true);
        } else {
          setProfile(buildOptimisticProfile(currentUser));
          setFavoriteItems([]);
          favoriteItemsRef.current = [];
          setTribe(null);
          setIsTribeReady(false);
          setIsCurrentTribeChecked(false);
          setIsAccountReady(false);
        }

        loadTribeBundle(currentUser.id)
          .then((tribeBundle) => {
            if (!isActive || hydrationId !== activeHydrationIdRef.current) {
              return;
            }

            setTribe(tribeBundle);
            setIsTribeReady(true);
            setIsCurrentTribeChecked(true);
          })
          .catch((error) => {
            console.error(error);

            if (!isActive || hydrationId !== activeHydrationIdRef.current) {
              return;
            }

            setIsTribeReady(true);
            setIsCurrentTribeChecked(true);
          });

        const bundle = await loadAccountBundle(currentUser.id, currentUser);

        if (!isActive || hydrationId !== activeHydrationIdRef.current) {
          return;
        }

        const nextFavoriteItems = hasPendingFavoriteSyncRef.current
          ? favoriteItemsRef.current
          : bundle.favorites;

        setProfile(bundle.profile);
        setFavoriteItems(nextFavoriteItems);
        favoriteItemsRef.current = nextFavoriteItems;
        lastSyncedFavoritesRef.current = serializeFavoriteItems(bundle.favorites);
        hasRemoteAccountBundleRef.current = true;
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive && hydrationId === activeHydrationIdRef.current) {
          setIsAccountReady(true);
        }
      }
    };

    hydrateAccountRef.current = hydrateFromAccount;

    const scheduleAuthHydration = (userOverride) => {
      clearScheduledAuthHydration();
      authHydrationTimeoutRef.current = window.setTimeout(() => {
        authHydrationTimeoutRef.current = 0;

        if (!isActive) {
          return;
        }

        hydrateFromAccount(userOverride ?? null, { hasUserOverride: true });
      }, 0);
    };

    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      const nextAuthKey = session?.user?.id ? `user:${session.user.id}` : 'guest';

      if (event !== 'INITIAL_SESSION' && nextAuthKey === lastHydratedAuthKeyRef.current) {
        return;
      }

      scheduleAuthHydration(session?.user ?? null);
    });

    return () => {
      isActive = false;
      hydrateAccountRef.current = null;
      clearScheduledAuthHydration();
      subscription?.data?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || !isAccountReady || !isSupabaseConfigured()) {
      return;
    }

    const nextSerializedFavorites = serializeFavoriteItems(favoriteItems);

    if (!hasRemoteAccountBundleRef.current) {
      if (nextSerializedFavorites !== lastSyncedFavoritesRef.current) {
        hasPendingFavoriteSyncRef.current = true;
      }
      return;
    }

    if (
      nextSerializedFavorites === lastSyncedFavoritesRef.current &&
      !hasPendingFavoriteSyncRef.current
    ) {
      return;
    }

    syncFavoriteSnapshots(authUser.id, favoriteItems)
      .then(() => {
        lastSyncedFavoritesRef.current = nextSerializedFavorites;
        hasPendingFavoriteSyncRef.current = false;
      })
      .catch((error) => {
        hasPendingFavoriteSyncRef.current = true;
        console.error(error);
      });
  }, [authUser, favoriteItems, isAccountReady]);

  useEffect(() => {
    if (!authUser || !tribe?.tribeId || !isSupabaseConfigured()) {
      setTribeMemberLocations([]);
      return undefined;
    }

    let isActive = true;

    const refreshTribeLocations = () => {
      loadTribeMemberLocations({ tribeId: tribe.tribeId })
        .then((locations) => {
          if (isActive) {
            setTribeMemberLocations(locations);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    };

    refreshTribeLocations();

    const channel = subscribeToTribeMemberLocations({
      tribeId: tribe.tribeId,
      onChange: refreshTribeLocations,
    });

    return () => {
      isActive = false;

      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [authUser, tribe?.tribeId]);

  useEffect(() => {
    if (!authUser || !profile) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeCachedAccount(authUser.id, {
        profile,
        favorites: favoriteItems,
        tribe,
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authUser, favoriteItems, profile, tribe]);

  useEffect(() => {
    if (!tribe && showTribeOnly) {
      setShowTribeOnly(false);
    }
  }, [showTribeOnly, tribe]);

  useEffect(() => {
    if (isLatestLineupSelected) {
      return;
    }

    setShowFavoritesOnly(false);
    setShowConflictsOnly(false);
    setShowTribeOnly(false);
  }, [isLatestLineupSelected]);

  useEffect(() => {
    if (
      !authUser ||
      !isAccountReady ||
      !isCurrentTribeChecked ||
      !pendingTribeInviteCode ||
      tribe ||
      isTribeBusy
    ) {
      return;
    }

    const attemptKey = `${authUser.id}:${pendingTribeInviteCode}`;

    if (attemptedInviteJoinKeyRef.current === attemptKey) {
      return;
    }

    attemptedInviteJoinKeyRef.current = attemptKey;
    setIsTribeBusy(true);

    joinCurrentUserTribeByCode(pendingTribeInviteCode)
      .then((nextTribe) => {
        setTribe(nextTribe);
        setTribeInviteAlert('');
        openSettings();
        writePendingTribeInviteCode('');
        setPendingTribeInviteCode('');
        promptedTribeInviteAuthRef.current = false;
      })
      .catch((error) => {
        console.error(error);
        writePendingTribeInviteCode('');
        setPendingTribeInviteCode('');
        promptedTribeInviteAuthRef.current = false;
        setTribeInviteAlert(error.message || 'Could not join this tribe invite.');
        openSettings();
      })
      .finally(() => {
        setIsTribeBusy(false);
      });
  }, [
    authUser,
    isAccountReady,
    isCurrentTribeChecked,
    isTribeBusy,
    openSettings,
    pendingTribeInviteCode,
    tribe,
  ]);

  const clearPendingTribeInvite = useCallback(() => {
    writePendingTribeInviteCode('');
    setPendingTribeInviteCode('');
    attemptedInviteJoinKeyRef.current = '';
    promptedTribeInviteAuthRef.current = false;
  }, []);

  useEffect(() => {
    if (!isCurrentTribeChecked || !pendingTribeInviteCode || !tribe) {
      return;
    }

    if (normalizeTribeCode(tribe.code) === normalizeTribeCode(pendingTribeInviteCode)) {
      clearPendingTribeInvite();
      return;
    }

    clearPendingTribeInvite();
    setTribeInviteAlert('You are already in a tribe. Leave it before joining another one.');
    openSettings();
  }, [clearPendingTribeInvite, isCurrentTribeChecked, openSettings, pendingTribeInviteCode, tribe]);

  useEffect(() => {
    if (!authUser || !isAccountReady || !pendingAction) {
      return;
    }

    if (pendingAction.type === 'open-reviews') {
      resetBrowseState();
      openView('reviews');
    }

    if (pendingAction.type === 'open-tribe') {
      resetBrowseState();
      openSettings();
    }

    if (pendingAction.type === 'toggle-favorite' && isLatestLineupSelected) {
      const entry = entriesById.get(pendingAction.entryId);

      if (entry) {
        setFavoriteItems((previousItems) => {
          const isAlreadyFavorite = previousItems.some(
            (item) => item.id === entry.id
          );

          if (isAlreadyFavorite) {
            return removeFavoriteByEntryId(previousItems, entry.id);
          }

          return upsertFavoriteEntry(previousItems, entry);
        });
      }
    }

    if (pendingAction.type === 'remove-review-favorite' && isLatestLineupSelected) {
      setFavoriteItems((previousItems) => removeFavoriteByKey(previousItems, pendingAction.favoriteKey));
    }

    setPendingAction(null);
    setIsAuthModalOpen(false);
  }, [authUser, entriesById, isAccountReady, isLatestLineupSelected, openSettings, openView, pendingAction, resetBrowseState]);

  const toggleFavorite = useCallback((entryId) => {
    if (favoritesReadOnly) {
      return;
    }

    if (!authUser) {
      requestAuth({ type: 'toggle-favorite', entryId });
      return;
    }

    const entry = entriesById.get(entryId);

    if (!entry) {
      return;
    }

    setFavoriteItems((previousItems) => {
      const isAlreadyFavorite = previousItems.some(
        (item) => item.id === entry.id
      );

      if (isAlreadyFavorite) {
        return removeFavoriteByEntryId(previousItems, entry.id);
      }

      return upsertFavoriteEntry(previousItems, entry);
    });
  }, [authUser, entriesById, favoritesReadOnly, requestAuth]);

  const handleToggleReviewSuggestionFavorite = useCallback((suggestion, reviewFavorite) => {
    if (favoritesReadOnly || !authUser) {
      return;
    }

    const entry = entriesById.get(suggestion?.id) ?? suggestion;

    if (!entry?.id) {
      return;
    }

    setFavoriteItems((previousItems) =>
      toggleReviewSuggestionFavorite(previousItems, entry, reviewFavorite)
    );
  }, [authUser, entriesById, favoritesReadOnly]);

  const handleIgnoreReviewConflict = useCallback((conflictId) => {
    setIgnoredReviewConflictIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(conflictId);
      return nextIds;
    });
  }, []);

  const handleRestoreReviewConflict = useCallback((conflictId) => {
    setIgnoredReviewConflictIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(conflictId);
      return nextIds;
    });
  }, []);

  const upsertLocalTribeLocation = useCallback((nextLocation) => {
    if (!nextLocation) {
      return;
    }

    setTribeMemberLocations((currentLocations) => {
      const nextLocations = currentLocations.filter((location) => (
        location.userId !== nextLocation.userId ||
        location.tribeId !== nextLocation.tribeId ||
        location.siteSlug !== nextLocation.siteSlug ||
        location.mapLayerId !== nextLocation.mapLayerId
      ));

      return [...nextLocations, nextLocation];
    });
  }, []);

  const upsertCurrentUserGpsLocationAcrossCalibratedMaps = useCallback(async ({
    gpsPoint,
    gpsAccuracyM = null,
    locationKind = 'manual',
    expiresAt = null,
  }) => {
    const targetTransforms = calibratedMapLayerTransformsRef.current;

    if (!authUser?.id || !tribe?.tribeId || !gpsPoint || targetTransforms.length === 0) {
      return [];
    }

    const nextLocations = (await Promise.all(targetTransforms.map((item) => {
      const mapPoint = projectGpsToMap(gpsPoint, item.transform);

      if (!mapPoint) {
        return null;
      }

      return upsertCurrentUserTribeLocation({
        tribeId: tribe.tribeId,
        userId: authUser.id,
        longitude: mapPoint.longitude,
        latitude: mapPoint.latitude,
        locationKind,
        mapLayerId: item.mapLayerId,
        gpsLongitude: gpsPoint.longitude,
        gpsLatitude: gpsPoint.latitude,
        gpsAccuracyM,
        expiresAt,
      });
    }))).filter(Boolean);

    nextLocations.forEach(upsertLocalTribeLocation);

    return nextLocations;
  }, [
    authUser?.id,
    tribe?.tribeId,
    upsertLocalTribeLocation,
  ]);

  const downgradeCurrentUserLocationsForMapLayers = useCallback(async (mapLayerIds) => {
    if (!authUser?.id || !tribe?.tribeId || !Array.isArray(mapLayerIds) || mapLayerIds.length === 0) {
      return [];
    }

    const targetMapLayerIds = new Set(mapLayerIds.filter(Boolean));
    const ownLocations = tribeMemberLocations.filter((location) => (
      location.userId === authUser.id &&
      location.tribeId === tribe.tribeId &&
      location.siteSlug === activeSite.slug &&
      targetMapLayerIds.has(location.mapLayerId)
    ));

    const nextLocations = (await Promise.all(ownLocations.map((location) => (
      upsertCurrentUserTribeLocation({
        tribeId: tribe.tribeId,
        userId: authUser.id,
        longitude: location.longitude,
        latitude: location.latitude,
        locationKind: 'manual',
        mapLayerId: location.mapLayerId,
        gpsLongitude: null,
        gpsLatitude: null,
        gpsAccuracyM: null,
        expiresAt: null,
      })
    )))).filter(Boolean);

    nextLocations.forEach(upsertLocalTribeLocation);

    return nextLocations;
  }, [
    authUser?.id,
    tribe?.tribeId,
    tribeMemberLocations,
    upsertLocalTribeLocation,
  ]);

  const stopLiveLocationRuntime = useCallback(() => {
    if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
    }

    window.clearTimeout(liveLocationTimeoutIdRef.current);
    liveLocationTimeoutIdRef.current = 0;
    window.clearInterval(liveLocationRefreshIntervalIdRef.current);
    liveLocationRefreshIntervalIdRef.current = 0;
    liveLocationWatchIdRef.current = null;
    liveLocationExpiresAtRef.current = null;
    lastLiveLocationGpsRef.current = null;
    lastLiveMapLocationRef.current = null;
    clearLiveLocationSession();
    setIsLiveLocationSharing(false);
    setLiveLocationRemainingMinutes(null);
  }, []);

  useEffect(() => {
    if (!authUser?.id || !tribe?.tribeId || calibratedMapLayerTransforms.length === 0) {
      lastCalibrationLocationSyncKeyRef.current = '';
      return;
    }

    const ownActiveLocations = tribeMemberLocations
      .filter((location) => (
        location.userId === authUser.id &&
        location.tribeId === tribe.tribeId &&
        location.siteSlug === activeSite.slug &&
        (!location.expiresAt || new Date(location.expiresAt).getTime() > Date.now())
      ))
      .sort((leftLocation, rightLocation) => (
        new Date(rightLocation.updatedAt ?? 0).getTime() -
        new Date(leftLocation.updatedAt ?? 0).getTime()
      ));
    const gpsSource =
      ownActiveLocations.find((location) => location.locationKind === 'live' && hasGpsLocation(location)) ??
      ownActiveLocations.find((location) => hasGpsLocation(location)) ??
      null;
    const rawCalibratedSource = ownActiveLocations.find((location) => (
      !hasGpsLocation(location) &&
      calibratedMapLayerIds.has(location.mapLayerId)
    ));
    const rawSourceTransform = rawCalibratedSource
      ? calibratedMapLayerTransforms.find((item) => item.mapLayerId === rawCalibratedSource.mapLayerId)
      : null;
    const gpsPoint = gpsSource
      ? {
          longitude: gpsSource.gpsLongitude,
          latitude: gpsSource.gpsLatitude,
        }
      : rawSourceTransform
        ? projectMapToGps({
            longitude: rawCalibratedSource.longitude,
            latitude: rawCalibratedSource.latitude,
          }, rawSourceTransform.transform)
        : null;

    if (!gpsPoint || !Number.isFinite(gpsPoint.longitude) || !Number.isFinite(gpsPoint.latitude)) {
      return;
    }

    const locationKind = gpsSource?.locationKind === 'live' ? 'live' : 'manual';
    const syncKey = [
      authUser.id,
      tribe.tribeId,
      calibrationSyncSignature,
      gpsPoint.longitude,
      gpsPoint.latitude,
      locationKind,
      gpsSource?.expiresAt ?? '',
    ].join(':');

    if (lastCalibrationLocationSyncKeyRef.current === syncKey) {
      return;
    }

    lastCalibrationLocationSyncKeyRef.current = syncKey;
    upsertCurrentUserGpsLocationAcrossCalibratedMaps({
      gpsPoint,
      gpsAccuracyM: gpsSource?.gpsAccuracyM ?? null,
      locationKind,
      expiresAt: locationKind === 'live' ? gpsSource?.expiresAt ?? null : null,
    }).catch(() => {
      lastCalibrationLocationSyncKeyRef.current = '';
    });
  }, [
    authUser?.id,
    calibratedMapLayerIds,
    calibratedMapLayerTransforms,
    calibrationSyncSignature,
    tribe?.tribeId,
    tribeMemberLocations,
    upsertCurrentUserGpsLocationAcrossCalibratedMaps,
  ]);

  useEffect(() => {
    if (!authUser?.id || !tribe?.tribeId) {
      return;
    }

    const expiredOwnLiveLocation = tribeMemberLocations.find((location) => (
      location.userId === authUser.id &&
      location.tribeId === tribe.tribeId &&
      location.locationKind === 'live' &&
      location.expiresAt &&
      new Date(location.expiresAt).getTime() <= Date.now()
    ));

    if (!expiredOwnLiveLocation) {
      return;
    }

    upsertCurrentUserGpsLocationAcrossCalibratedMaps({
      gpsPoint: {
        longitude: expiredOwnLiveLocation.gpsLongitude,
        latitude: expiredOwnLiveLocation.gpsLatitude,
      },
      gpsAccuracyM: expiredOwnLiveLocation.gpsAccuracyM,
      locationKind: 'manual',
      expiresAt: null,
    })
      .catch(() => {});
  }, [
    authUser?.id,
    tribe?.tribeId,
    tribeMemberLocations,
    upsertCurrentUserGpsLocationAcrossCalibratedMaps,
  ]);

  const handleSetTribeMapLocation = useCallback(async ({ longitude, latitude, mapLayerId }) => {
    if (!authUser || !tribe?.tribeId) {
      requestAuth({ type: 'open-tribe' });
      return;
    }

    const layerPoints = mapCalibrationPoints.filter((point) => point.mapLayerId === mapLayerId);
    const transform = buildMapCalibrationTransform(layerPoints);
    const gpsPoint = transform ? projectMapToGps({ longitude, latitude }, transform) : null;

    if (gpsPoint) {
      if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
      }

      window.clearTimeout(liveLocationTimeoutIdRef.current);
      liveLocationTimeoutIdRef.current = 0;
      window.clearInterval(liveLocationRefreshIntervalIdRef.current);
      liveLocationRefreshIntervalIdRef.current = 0;
      liveLocationWatchIdRef.current = null;
      liveLocationExpiresAtRef.current = null;
      lastLiveLocationGpsRef.current = null;
      lastLiveMapLocationRef.current = null;
      clearLiveLocationSession();
      setIsLiveLocationSharing(false);
      setLiveLocationRemainingMinutes(null);

      const currentOwnLiveLocations = tribeMemberLocations.filter((location) => (
        location.userId === authUser.id &&
        location.tribeId === tribe.tribeId &&
        location.siteSlug === activeSite.slug &&
        location.locationKind === 'live'
      ));

      await Promise.all(currentOwnLiveLocations.map((location) => (
        deleteCurrentUserTribeLocation({
          tribeId: tribe.tribeId,
          userId: authUser.id,
          mapLayerId: location.mapLayerId,
        })
      )));

      if (currentOwnLiveLocations.length > 0) {
        const liveLocationKeys = new Set(
          currentOwnLiveLocations.map((location) => location.mapLayerId)
        );

        setTribeMemberLocations((currentLocations) => (
          currentLocations.filter((location) => (
            location.userId !== authUser.id ||
            location.tribeId !== tribe.tribeId ||
            location.siteSlug !== activeSite.slug ||
            location.locationKind !== 'live' ||
            !liveLocationKeys.has(location.mapLayerId)
          ))
        ));
      }

      await upsertCurrentUserGpsLocationAcrossCalibratedMaps({
        gpsPoint,
        locationKind: 'manual',
        expiresAt: null,
      });

      lastLiveMapLocationRef.current = null;
      return;
    }

    const nextLocation = await upsertCurrentUserTribeLocation({
      tribeId: tribe.tribeId,
      userId: authUser.id,
      longitude,
      latitude,
      locationKind: 'manual',
      mapLayerId,
      gpsLongitude: gpsPoint?.longitude ?? null,
      gpsLatitude: gpsPoint?.latitude ?? null,
      expiresAt: null,
    });

    upsertLocalTribeLocation(nextLocation);
  }, [
    authUser,
    mapCalibrationPoints,
    requestAuth,
    tribe?.tribeId,
    tribeMemberLocations,
    upsertCurrentUserGpsLocationAcrossCalibratedMaps,
    upsertLocalTribeLocation,
  ]);

  const handleAddMapCalibrationPoint = useCallback(async ({ mapLayerIds = [], mapLongitude, mapLatitude }) => {
    if (!authUser || !isAdmin) {
      return;
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not available on this device.');
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
    const candidateGps = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    };
    const targetMapLayerIds = Array.from(new Set(mapLayerIds.filter(Boolean)));

    if (targetMapLayerIds.length === 0) {
      return;
    }

    targetMapLayerIds.forEach((targetMapLayerId) => {
      const layerPoints = mapCalibrationPoints.filter((point) => point.mapLayerId === targetMapLayerId);
      const isTooClose = layerPoints.some((point) => (
        getGpsDistanceMeters(candidateGps, {
          longitude: point.gpsLongitude,
          latitude: point.gpsLatitude,
        }) < MAP_CALIBRATION_MIN_DISTANCE_M
      ));

      if (isTooClose) {
        throw new Error(`Calibration points must be at least ${MAP_CALIBRATION_MIN_DISTANCE_M}m apart.`);
      }
    });

    const nextPoints = (await Promise.all(targetMapLayerIds.map((targetMapLayerId) => (
      addMapCalibrationPoint({
        userId: authUser.id,
        mapLayerId: targetMapLayerId,
        mapLongitude,
        mapLatitude,
        gpsLongitude: position.coords.longitude,
        gpsLatitude: position.coords.latitude,
        gpsAccuracyM: position.coords.accuracy,
      })
    )))).filter(Boolean);

    if (nextPoints.length > 0) {
      lastCalibrationLocationSyncKeyRef.current = '';
      setMapCalibrationPoints((currentPoints) => {
        const updatedPoints = sortMapCalibrationPoints([...currentPoints, ...nextPoints]);
        writeCachedMapCalibrationPoints(updatedPoints);
        return updatedPoints;
      });
      setMapCalibrationMessage(
        targetMapLayerIds.length > 1
          ? 'Calibration point saved on all maps.'
          : 'Calibration point saved.'
      );
    }
  }, [authUser, isAdmin, mapCalibrationPoints]);

  const handleRemoveMapCalibrationPoint = useCallback(async (pointId) => {
    if (!isAdmin || !pointId) {
      return;
    }

    const previousTransforms = calibratedMapLayerTransformsRef.current;
    const deletedPointId = await deleteMapCalibrationPoint(pointId);
    const nextCalibrationPoints = sortMapCalibrationPoints(
      mapCalibrationPoints.filter((point) => String(point.id) !== String(deletedPointId))
    );
    const nextTransforms = getCalibratedMapLayerTransforms(selectedMapLayers, nextCalibrationPoints);
    const lostCalibrationMapLayerIds = getMapLayerIdsThatLostCalibration(previousTransforms, nextTransforms);

    calibratedMapLayerTransformsRef.current = nextTransforms;
    lastCalibrationLocationSyncKeyRef.current = '';
    setMapCalibrationPoints(nextCalibrationPoints);
    writeCachedMapCalibrationPoints(nextCalibrationPoints);

    if (lostCalibrationMapLayerIds.length > 0) {
      await downgradeCurrentUserLocationsForMapLayers(lostCalibrationMapLayerIds);
    }

    const liveSession = readLiveLocationSession();
    if (liveSession && lostCalibrationMapLayerIds.includes(liveSession.mapLayerId)) {
      if (nextTransforms.length > 0 && liveLocationExpiresAtRef.current) {
        writeLiveLocationSession({
          userId: liveSession.userId,
          tribeId: liveSession.tribeId,
          mapLayerId: nextTransforms[0].mapLayerId,
          expiresAt: liveLocationExpiresAtRef.current,
        });
      } else {
        stopLiveLocationRuntime();
      }
    }

    setMapCalibrationMessage('Calibration point removed.');
  }, [
    downgradeCurrentUserLocationsForMapLayers,
    isAdmin,
    mapCalibrationPoints,
    selectedMapLayers,
    stopLiveLocationRuntime,
  ]);

  const handleResetMapCalibration = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    const previousTransforms = calibratedMapLayerTransformsRef.current;
    const previousCalibratedMapLayerIds = previousTransforms.map((item) => item.mapLayerId);

    await resetMapCalibrationPoints(activeSite.slug);
    calibratedMapLayerTransformsRef.current = [];
    lastCalibrationLocationSyncKeyRef.current = '';
    setMapCalibrationPoints([]);
    writeCachedMapCalibrationPoints([]);

    if (previousCalibratedMapLayerIds.length > 0) {
      await downgradeCurrentUserLocationsForMapLayers(previousCalibratedMapLayerIds);
    }

    stopLiveLocationRuntime();
    setMapCalibrationMessage('Map calibration reset.');
  }, [
    downgradeCurrentUserLocationsForMapLayers,
    isAdmin,
    stopLiveLocationRuntime,
  ]);

  const handleStartMapCalibration = useCallback(async () => {
    if (!isAdmin || !hasMapsView) {
      return;
    }

    if (isLiveLocationSharing || liveLocationWatchIdRef.current !== null) {
      const lastLocation = lastLiveMapLocationRef.current;

      stopLiveLocationRuntime();

      if (authUser && tribe?.tribeId && lastLocation && hasGpsLocation(lastLocation)) {
        await upsertCurrentUserGpsLocationAcrossCalibratedMaps({
          gpsPoint: {
            longitude: lastLocation.gpsLongitude,
            latitude: lastLocation.gpsLatitude,
          },
          gpsAccuracyM: lastLocation.gpsAccuracyM,
          locationKind: 'manual',
          expiresAt: null,
        });
      }
    }

    setIsMapCalibrationMode(true);
    setMapCalibrationMessage('Place a calibration point where you are standing, then save it with GPS.');
    openView('maps');
  }, [
    authUser,
    hasMapsView,
    isAdmin,
    isLiveLocationSharing,
    openView,
    stopLiveLocationRuntime,
    tribe?.tribeId,
    upsertCurrentUserGpsLocationAcrossCalibratedMaps,
  ]);

  const handleStopMapCalibration = useCallback(() => {
    setIsMapCalibrationMode(false);
    setMapCalibrationMessage('');
  }, []);

  const handleStopLiveLocationSharing = useCallback(async ({
    preserveLastKnown = true,
    message = 'Live position stopped. Last known position is still shared.',
  } = {}) => {
    if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
    }

    window.clearTimeout(liveLocationTimeoutIdRef.current);
    liveLocationTimeoutIdRef.current = 0;
    window.clearInterval(liveLocationRefreshIntervalIdRef.current);
    liveLocationRefreshIntervalIdRef.current = 0;
    liveLocationWatchIdRef.current = null;
    liveLocationExpiresAtRef.current = null;
    lastLiveLocationGpsRef.current = null;
    clearLiveLocationSession();
    setIsLiveLocationSharing(false);
    setLiveLocationRemainingMinutes(null);

    if (preserveLastKnown && authUser && tribe?.tribeId && lastLiveMapLocationRef.current) {
      const lastLocation = lastLiveMapLocationRef.current;
      const nextLocations = await upsertCurrentUserGpsLocationAcrossCalibratedMaps({
        gpsPoint: {
          longitude: lastLocation.gpsLongitude,
          latitude: lastLocation.gpsLatitude,
        },
        locationKind: 'manual',
        gpsAccuracyM: lastLocation.gpsAccuracyM,
        expiresAt: null,
      });

      lastLiveMapLocationRef.current = nextLocations[0] ?? null;
      if (message) {
        setMapCalibrationMessage(message);
      }
      return;
    }

    lastLiveMapLocationRef.current = null;
    setMapCalibrationMessage(
      preserveLastKnown
        ? 'Live position stopped before a location could be shared.'
        : 'Live position stopped.'
    );
  }, [authUser, tribe?.tribeId, upsertCurrentUserGpsLocationAcrossCalibratedMaps]);

  const handleStartLiveLocationSharing = useCallback(({ mapLayerId, expiresAt: resumedExpiresAt = null } = {}) => {
    if (!authUser || !tribe?.tribeId) {
      requestAuth({ type: 'open-tribe' });
      return;
    }

    if (!mapLayerId) {
      setMapCalibrationMessage('Live location needs a selected calibrated map.');
      return;
    }

    if (!navigator.geolocation) {
      setMapCalibrationMessage('Geolocation is not available on this device.');
      return;
    }

    const sourceTransform = calibratedMapLayerTransforms.find((item) => item.mapLayerId === mapLayerId);

    if (!sourceTransform) {
      setMapCalibrationMessage('Live location needs at least 3 calibration points on this map.');
      return;
    }

    if (liveLocationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
    }

    window.clearTimeout(liveLocationTimeoutIdRef.current);
    liveLocationTimeoutIdRef.current = 0;
    window.clearInterval(liveLocationRefreshIntervalIdRef.current);
    liveLocationRefreshIntervalIdRef.current = 0;
    lastLiveLocationGpsRef.current = null;
    lastLiveMapLocationRef.current = null;

    const expiresAt = resumedExpiresAt || new Date(Date.now() + LIVE_LOCATION_DURATION_MS).toISOString();
    const remainingDurationMs = new Date(expiresAt).getTime() - Date.now();

    if (remainingDurationMs <= 0) {
      clearLiveLocationSession();
      setMapCalibrationMessage('Previous live position sharing has expired.');
      return;
    }

    liveLocationExpiresAtRef.current = expiresAt;
    setLiveLocationRemainingMinutes(Math.max(0, Math.ceil(remainingDurationMs / 60000)));
    writeLiveLocationSession({
      userId: authUser.id,
      tribeId: tribe.tribeId,
      mapLayerId,
      expiresAt,
    });
    setIsLiveLocationSharing(true);
    setMapCalibrationMessage(
      resumedExpiresAt
        ? 'Live position sharing resumed.'
        : 'Live position sharing for 30 minutes.'
    );

    const handleLivePositionUpdate = (position, { force = false } = {}) => {
      const nextGps = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };
      const previousGps = lastLiveLocationGpsRef.current;

      if (
        !force &&
        previousGps &&
        getGpsDistanceMeters(previousGps, nextGps) < LIVE_LOCATION_MIN_UPDATE_DISTANCE_M
      ) {
        return;
      }

      lastLiveLocationGpsRef.current = nextGps;
      upsertCurrentUserGpsLocationAcrossCalibratedMaps({
        gpsPoint: nextGps,
        locationKind: 'live',
        gpsAccuracyM: position.coords.accuracy,
        expiresAt,
      })
        .then((nextLocations) => {
          lastLiveMapLocationRef.current =
            nextLocations.find((location) => location.mapLayerId === mapLayerId) ??
            nextLocations[0] ??
            null;
        })
        .catch((error) => {
          setMapCalibrationMessage(error.message || 'Could not share live location.');
        });
    };

    const requestLivePositionRefresh = (force = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => handleLivePositionUpdate(position, { force }),
        (error) => {
          setMapCalibrationMessage(
            lastLiveMapLocationRef.current
              ? 'Live position waiting for GPS. Last known position is still shared.'
              : error.message || 'Could not access your location.'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

    liveLocationWatchIdRef.current = navigator.geolocation.watchPosition(
      handleLivePositionUpdate,
      (error) => {
        setMapCalibrationMessage(
          lastLiveMapLocationRef.current
            ? 'Live position waiting for GPS. Last known position is still shared.'
            : error.message || 'Could not access your location.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    requestLivePositionRefresh(true);
    liveLocationRefreshIntervalIdRef.current = window.setInterval(
      requestLivePositionRefresh,
      LIVE_LOCATION_REFRESH_MS
    );

    liveLocationTimeoutIdRef.current = window.setTimeout(() => {
      if (liveLocationExpiresAtRef.current === expiresAt) {
        handleStopLiveLocationSharing({
          preserveLastKnown: true,
          message: 'Live position expired after 30 minutes. Last known position is still shared.',
        }).catch(() => {});
      }
    }, remainingDurationMs);
  }, [
    authUser,
    calibratedMapLayerTransforms,
    handleStopLiveLocationSharing,
    requestAuth,
    tribe?.tribeId,
    upsertCurrentUserGpsLocationAcrossCalibratedMaps,
  ]);

  useEffect(() => {
    if (!authUser?.id || !tribe?.tribeId || isLiveLocationSharing || calibratedMapLayerIds.size === 0) {
      return;
    }

    const session = readLiveLocationSession();

    if (
      !session ||
      session.userId !== authUser.id ||
      session.tribeId !== tribe.tribeId ||
      session.siteSlug !== activeSite.slug ||
      !session.mapLayerId
    ) {
      return;
    }

    if (!calibratedMapLayerIds.has(session.mapLayerId)) {
      return;
    }

    handleStartLiveLocationSharing({
      mapLayerId: session.mapLayerId,
      expiresAt: session.expiresAt,
    });
  }, [
    authUser?.id,
    calibratedMapLayerIds,
    handleStartLiveLocationSharing,
    isLiveLocationSharing,
    tribe?.tribeId,
  ]);

  const handleRemoveTribeMapLocation = useCallback(async ({
    mapLayerId = null,
    locationKind = 'manual',
    hasGpsPosition = false,
  } = {}) => {
    if (!authUser || !tribe?.tribeId) {
      return;
    }

    const shouldStopLiveLocation =
      locationKind === 'live' ||
      (
        liveLocationWatchIdRef.current !== null &&
        lastLiveMapLocationRef.current?.mapLayerId === mapLayerId
      );

    if (shouldStopLiveLocation) {
      if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
      }

      window.clearTimeout(liveLocationTimeoutIdRef.current);
      liveLocationTimeoutIdRef.current = 0;
      window.clearInterval(liveLocationRefreshIntervalIdRef.current);
      liveLocationRefreshIntervalIdRef.current = 0;
      liveLocationWatchIdRef.current = null;
      liveLocationExpiresAtRef.current = null;
      lastLiveLocationGpsRef.current = null;
      lastLiveMapLocationRef.current = null;
      clearLiveLocationSession();
      setIsLiveLocationSharing(false);
      setLiveLocationRemainingMinutes(null);
    }

    const targetMapLayerIds = hasGpsPosition
      ? calibratedMapLayerTransforms.map((item) => item.mapLayerId)
      : [mapLayerId];
    const cleanTargetMapLayerIds = targetMapLayerIds.filter(Boolean);

    if (cleanTargetMapLayerIds.length === 0) {
      return;
    }

    await Promise.all(cleanTargetMapLayerIds.map((targetMapLayerId) => (
      deleteCurrentUserTribeLocation({
        tribeId: tribe.tribeId,
        userId: authUser.id,
        mapLayerId: targetMapLayerId,
      })
    )));

    const targetMapLayerIdSet = new Set(cleanTargetMapLayerIds);

    setTribeMemberLocations((currentLocations) => (
      currentLocations.filter((location) => (
        location.userId !== authUser.id ||
        location.tribeId !== tribe.tribeId ||
        location.siteSlug !== activeSite.slug ||
        !targetMapLayerIdSet.has(location.mapLayerId)
      ))
    ));
  }, [authUser, calibratedMapLayerTransforms, tribe?.tribeId]);

  const removeReviewFavorite = useCallback((favoriteKey) => {
    if (favoritesReadOnly || !authUser) {
      return;
    }

    setFavoriteItems((previousItems) => removeFavoriteByKey(previousItems, favoriteKey));
  }, [authUser, favoritesReadOnly]);

  const resetFavorites = useCallback(() => {
    if (!authUser) {
      return;
    }

    setFavoriteItems([]);
  }, [authUser]);

  const handleCreateTribe = useCallback(async (name) => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }

    setIsTribeBusy(true);

    try {
      const nextTribe = await createCurrentUserTribe(name);
      setTribeInviteAlert('');
      setTribe(nextTribe);
    } finally {
      setIsTribeBusy(false);
    }
  }, [authUser, requestAuth]);

  const handleJoinTribe = useCallback(async (code) => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }

    setIsTribeBusy(true);

    try {
      const nextTribe = await joinCurrentUserTribeByCode(code);
      setTribeInviteAlert('');
      setTribe(nextTribe);
      writePendingTribeInviteCode('');
      setPendingTribeInviteCode('');
    } finally {
      setIsTribeBusy(false);
    }
  }, [authUser, requestAuth]);

  const handleLeaveTribe = useCallback(async () => {
    if (!authUser) {
      return;
    }

    setIsTribeBusy(true);

    try {
      await leaveCurrentUserTribe();
      setTribeInviteAlert('');
      setTribe(null);
    } finally {
      setIsTribeBusy(false);
    }
  }, [authUser]);

  const handleRenameTribe = useCallback(async (name) => {
    if (!authUser || !tribe?.tribeId) {
      return;
    }

    setIsTribeBusy(true);

    try {
      const nextTribe = await updateCurrentUserTribeName({
        tribeId: tribe.tribeId,
        name,
      });
      setTribe(nextTribe);
    } finally {
      setIsTribeBusy(false);
    }
  }, [authUser, tribe]);

  const handleSelectLineup = useCallback((nextKey) => {
    const nextLineupExists = availableLineupSources.some((lineup) => lineup.key === nextKey);

    if (!nextLineupExists) {
      return;
    }

    setSelectedLineupKey(nextKey);
  }, [availableLineupSources]);

  const handlePreviewLineup = useCallback((lineup) => {
    if (!lineup?.payload) {
      return;
    }

    if (lineup.status === 'temp') {
      setSelectedLineupKey(lineup.key);
      openView(lineup.entries?.some((entry) => hasCompleteSchedule(entry)) ? 'timetable' : 'lineup');
      return;
    }

    const previewSource = buildLineupSourcesFromVersions([{
      ...lineup,
      id: `preview:${lineup.id ?? lineup.payloadHash ?? Date.now()}`,
      status: 'preview',
      versionLabel: `Preview - ${
        lineup.versionLabel
        || lineup.payload?.updatedAt
        || lineup.sourceUpdatedAt
        || lineup.importedAt
        || 'Pending lineup'
      }`,
    }])[0];

    if (previewSource.entries.length > 0) {
      validateLineupPayload(previewSource.entries);
    }

    setLineupSources((currentSources) => [
      previewSource,
      ...currentSources.filter((source) => source.key !== previewSource.key),
    ]);
    setSelectedLineupKey(previewSource.key);
    openView(previewSource.entries.some((entry) => hasCompleteSchedule(entry)) ? 'timetable' : 'lineup');
  }, [openView]);

  const buildTempLineupPreviewSource = useCallback(async (nextPayload) => {
    const payloadHash = await getStablePayloadHash(nextPayload);
    const previewSource = buildLineupSourcesFromVersions([{
      id: TEMP_LINEUP_SOURCE_KEY,
      status: 'temp',
      versionLabel: 'Temp manual edit',
      payload: nextPayload,
      payloadHash,
    }])[0];

    previewSource.key = TEMP_LINEUP_SOURCE_KEY;
    previewSource.label = 'Temp manual edit';
    previewSource.status = 'temp';
    previewSource.source = 'local';
    previewSource.isLatest = false;

    if (previewSource.entries.length > 0) {
      validateLineupPayload(previewSource.entries);
    }

    return previewSource;
  }, []);

  const handleOpenPerformanceCreate = useCallback(() => {
    if (!isAdmin || !isManualLineupEditAllowed || !hasPublishedLineup || !manualLineupEditSource?.payload) {
      return;
    }

    const dayOptions = getLineupDayOptionsFromPayload(manualLineupEditSource.payload);
    const firstDay = dayOptions[0] ?? null;
    const firstStage = firstDay?.stages?.[0] ?? null;

    if (!firstDay || !firstStage) {
      return;
    }

    setSelectedLineupKey(manualLineupEditSource.key);
    setHasTriedPerformanceEditSubmit(false);
    const firstDayRange = getFestivalDayRange(manualLineupEditSource.payload, firstDay.value);
    setEditingPerformance({
      mode: 'create',
      entry: null,
      values: {
        artistName: '',
        daySlug: firstDay.value,
        stageSlug: firstStage.stageSlug ?? '',
        startDate: firstDayRange.startDate,
        startTime: '',
        endDate: firstDayRange.startDate,
        endTime: '',
      },
      errorMessage: '',
    });
  }, [hasPublishedLineup, isAdmin, isManualLineupEditAllowed, manualLineupEditSource]);

  const handleOpenPerformanceEdit = useCallback((entryId) => {
    if (!canEditSelectedLineup) {
      return;
    }

    const entry = entriesById.get(entryId);

    if (!entry) {
      return;
    }

    setHasTriedPerformanceEditSubmit(false);
    setEditingPerformance({
      mode: 'edit',
      entry,
      values: {
        artistName: entry.artistName ?? '',
        daySlug: entry.daySlug ?? '',
        stageSlug: entry.stageSlug ?? '',
        startDate: getDateInputValue(entry.startAt),
        startTime: getTimeInputValue(entry.startAt),
        endDate: getDateInputValue(entry.endAt),
        endTime: getTimeInputValue(entry.endAt),
      },
      errorMessage: '',
    });
  }, [canEditSelectedLineup, entriesById]);

  const handleEditingPerformanceChange = useCallback((nextValues) => {
    setEditingPerformance((currentEdit) => {
      if (!currentEdit) {
        return currentEdit;
      }

      const rawValues = {
        ...currentEdit.values,
        ...nextValues,
      };
      const didChangeDay = Object.prototype.hasOwnProperty.call(nextValues, 'daySlug');
      const stageOptions = getLineupStageOptionsForDay(selectedLineup?.payload, rawValues.daySlug);
      const hasSelectedStage = stageOptions.some((stageOption) => stageOption.value === rawValues.stageSlug);
      const valuesWithStage = {
        ...rawValues,
        stageSlug: didChangeDay && !hasSelectedStage ? stageOptions[0]?.value ?? '' : rawValues.stageSlug,
      };

      return {
        ...currentEdit,
        values: getScheduleValuesWithFestivalDates({
          payload: selectedLineup?.payload,
          values: valuesWithStage,
        }),
        errorMessage: '',
      };
    });
  }, [selectedLineup]);

  const handleClosePerformanceEdit = useCallback(() => {
    setHasTriedPerformanceEditSubmit(false);
    setEditingPerformance(null);
  }, []);

  const handleSavePerformanceEdit = useCallback(async () => {
    if (!editingPerformance || !selectedLineup?.payload) {
      return;
    }

    setHasTriedPerformanceEditSubmit(true);

    const nextEditValues = getScheduleValuesWithFestivalDates({
      payload: selectedLineup.payload,
      values: editingPerformance.values,
    });
    const nextEditingPerformance = {
      ...editingPerformance,
      values: nextEditValues,
    };
    const fieldErrors = getPerformanceEditFieldErrors(nextEditingPerformance);

    if (Object.keys(fieldErrors).length > 0 || !hasPerformanceEditChanges(nextEditingPerformance)) {
      setEditingPerformance(nextEditingPerformance);
      return;
    }

    try {
      const nextPayload = nextEditingPerformance.mode === 'create'
        ? addLineupPayloadEntry({
            payload: selectedLineup.payload,
            editValues: nextEditValues,
          })
        : updateLineupPayloadEntry({
            payload: selectedLineup.payload,
            entry: nextEditingPerformance.entry,
            editValues: nextEditValues,
          });
      const previewSource = await buildTempLineupPreviewSource(nextPayload);

      setTempLineupSource(previewSource);
      setSelectedLineupKey(previewSource.key);
      setHasTriedPerformanceEditSubmit(false);
      setEditingPerformance(null);
    } catch (error) {
      setEditingPerformance((currentEdit) => (
        currentEdit
          ? {
              ...currentEdit,
              errorMessage: error.message || 'Could not update this show.',
            }
          : currentEdit
      ));
    }
  }, [buildTempLineupPreviewSource, editingPerformance, selectedLineup]);

  const handleDeleteTempLineup = useCallback(() => {
    setTempLineupSource(null);
    setSelectedLineupKey((currentKey) => (
      currentKey === TEMP_LINEUP_SOURCE_KEY
        ? lineupSources[0]?.key ?? null
        : currentKey
    ));
  }, [lineupSources]);

  const handleManualLineupEditAllowedChange = useCallback((nextValue) => {
    if (nextValue && !hasPublishedLineup) {
      setIsManualLineupEditAllowed(false);
      return;
    }

    setIsManualLineupEditAllowed(nextValue);

    if (nextValue && manualLineupEditSource?.key) {
      setSelectedLineupKey(manualLineupEditSource.key);
    }
  }, [hasPublishedLineup, manualLineupEditSource]);

  const handleJokeLineupEnabledChange = useCallback(async (nextValue) => {
    if (!isAdmin || !isSupabaseConfigured()) {
      return;
    }

    const previousValue = isJokeLineupEnabled;
    setIsJokeLineupEnabled(nextValue);
    setIsJokeLineupSaving(true);

    try {
      const setting = await setJokeLineupEnabled(nextValue, activeSite.slug);
      setIsJokeLineupEnabled(setting?.value === true);
    } catch (error) {
      console.error(error);
      setIsJokeLineupEnabled(previousValue);
    } finally {
      setIsJokeLineupSaving(false);
    }
  }, [isAdmin, isJokeLineupEnabled]);

  const handleProfileUpdated = useCallback((nextProfile) => {
    setProfile(nextProfile);
  }, []);

  const handleLanguageChange = useCallback(async (nextLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage, activeSite.defaultLanguage);

    if (!authUser?.id) {
      setProfile((currentProfile) => ({
        ...(currentProfile ?? {}),
        preferred_language: normalizedLanguage,
      }));
      return;
    }

    const nextProfile = await updateProfileLanguage({
      userId: authUser.id,
      preferredLanguage: normalizedLanguage,
    });

    if (nextProfile) {
      setProfile(nextProfile);
    }
  }, [authUser?.id]);

  const handleBeforeSignedOut = useCallback(async () => {
    if (isLiveLocationSharing || liveLocationWatchIdRef.current !== null) {
      await handleStopLiveLocationSharing({
        preserveLastKnown: true,
        message: '',
      });
    }
  }, [handleStopLiveLocationSharing, isLiveLocationSharing]);

  const handleSignedOut = useCallback(() => {
    if (liveLocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
    }

    window.clearTimeout(liveLocationTimeoutIdRef.current);
    liveLocationTimeoutIdRef.current = 0;
    window.clearInterval(liveLocationRefreshIntervalIdRef.current);
    liveLocationRefreshIntervalIdRef.current = 0;
    liveLocationWatchIdRef.current = null;
    liveLocationExpiresAtRef.current = null;
    lastLiveLocationGpsRef.current = null;
    lastLiveMapLocationRef.current = null;
    clearLiveLocationSession();
    writeLastAuthenticatedUserId(null);
    writePendingTribeInviteCode('');

    if (authUser?.id) {
      clearCachedAccount(authUser.id);
    }

    setPendingAction(null);
    setIsAuthModalOpen(false);
    setTribeInviteAlert('');
    setAuthUser(null);
    setProfile(null);
    setTribe(null);
    setIsCurrentTribeChecked(true);
    setTribeMemberLocations([]);
    setFavoriteItems([]);
    favoriteItemsRef.current = [];
    hasPendingFavoriteSyncRef.current = false;
    lastSyncedFavoritesRef.current = serializeFavoriteItems([]);
    setIsLiveLocationSharing(false);
    setLiveLocationRemainingMinutes(null);
    resetBrowseState();
    pageStackRef.current = [];
    setPageStack([]);
    setActiveView(defaultScheduleView);
    replaceHistoryPageStackState({
      url: getUrlForView(defaultScheduleView),
      pageStack: [],
    });
  }, [authUser?.id, defaultScheduleView, resetBrowseState]);

  const dayDrawerOptions = useMemo(
    () => [
      {
        value: '__all-days__',
        label: t('All days'),
        reset: true,
      },
      ...days.map((day) => ({
        value: day,
        label: t(day),
      })),
    ],
    [days, t]
  );

  const stageDrawerOptions = useMemo(
    () => [
      {
        value: '__all-stages__',
        label: t('All stages'),
        reset: true,
      },
      ...stages.map((stage) => ({
        value: stage,
        label: stage,
        color: stageColorsByName.get(getComparableLabel(stage)) ?? getStageTheme(stage).accent,
      })),
    ],
    [stageColorsByName, stages, t]
  );

  const timetableDayDrawerOptions = useMemo(
    () =>
      timetableDays.map((day, index) => ({
        value: day,
        label: t(day),
        defaultChecked: getComparableLabel(day) === getComparableLabel(defaultTimetableDay) || (!defaultTimetableDay && index === 0),
      })),
    [defaultTimetableDay, timetableDays]
  );

  const hasFavoriteEntries = favoriteIdSet.size > 0;
  const hasTribeEntries = tribeLikedEntryIds.size > 0;
  useEffect(() => {
    if (showFavoritesOnly && !hasFavoriteEntries) {
      setShowFavoritesOnly(false);
    }
  }, [hasFavoriteEntries, showFavoritesOnly]);
  useEffect(() => {
    if (showTribeOnly && !hasTribeEntries) {
      setShowTribeOnly(false);
    }
  }, [hasTribeEntries, showTribeOnly]);
  useEffect(() => {
    if (showConflictsOnly && conflictCount === 0) {
      setShowConflictsOnly(false);
    }
  }, [conflictCount, showConflictsOnly]);
  const lineupChoices = useMemo(() => [
    ...(isLatestLineupSelected && authUser && hasFavoriteEntries ? [{
      id: 'favorites',
      label: t('Favorites'),
      icon: HeartIcon,
      fillOnPress: true,
      variant: 'likes',
    }] : []),
    ...(isLatestLineupSelected && authUser && tribe && hasTribeEntries ? [{
      id: 'tribe',
      label: t('My tribe'),
      icon: UsersIcon,
      fillOnPress: true,
      variant: 'favorite',
    }] : []),
  ], [authUser, hasFavoriteEntries, hasTribeEntries, isLatestLineupSelected, t, tribe]);
  const lineupDrawers = useMemo(() => [
    ...(days.length > 1 ? [{
      id: 'day',
      label: t('All days'),
      options: dayDrawerOptions,
    }] : []),
    ...(stages.length > 1 ? [{
      id: 'stage',
      label: t('All stages'),
      options: stageDrawerOptions,
    }] : []),
    ...(lineupStyleOptions.length > 0 ? [{
      id: 'styles',
      label: t('Styles'),
      placement: 'end',
      type: 'checkbox',
      options: lineupStyleOptions,
    }] : []),
  ], [dayDrawerOptions, days.length, lineupStyleOptions, stageDrawerOptions, stages.length, t]);

  const lineupFilterBar = useMemo(() => (lineupChoices.length > 0 || lineupDrawers.length > 0 ? {
    value: {
      day: selectedDay === 'All days' ? null : selectedDay,
      stage: selectedStage === 'All stages' ? null : selectedStage,
      styles: selectedStyles,
      favorites: showFavoritesOnly,
      tribe: showTribeOnly,
    },
    onChange: (nextValue) => {
      const nextDay = nextValue.day ?? 'All days';
      const nextStage = nextValue.stage ?? 'All stages';
      const nextStyles = Array.isArray(nextValue.styles) ? nextValue.styles : [];
      const didChangeDay = nextDay !== selectedDay;
      const didEnableFavorites = Boolean(nextValue.favorites) && !showFavoritesOnly;
      const didEnableTribe = Boolean(nextValue.tribe) && !showTribeOnly;
      const nextFavoritesOnly = didEnableTribe ? false : Boolean(nextValue.favorites);
      const nextTribeOnly = didEnableFavorites ? false : Boolean(nextValue.tribe);

      if (didChangeDay) {
        scrollViewportToTop();
      }

      setSelectedDay(nextDay);
      setSelectedStage(nextStage);
      setSelectedStyles(nextStyles);
      setShowFavoritesOnly(nextFavoritesOnly);
      setShowTribeOnly(nextTribeOnly);
    },
    onReset: () => {
      resetBrowseState();
    },
    hideOnScroll: true,
    choices: lineupChoices,
    drawers: lineupDrawers,
  } : null), [
    lineupChoices,
    lineupDrawers,
    resetBrowseState,
    selectedDay,
    selectedStage,
    selectedStyles,
    showFavoritesOnly,
    showTribeOnly,
  ]);

  const timetableChoices = useMemo(() => [
    ...(isLatestLineupSelected && authUser && conflictCount > 0 ? [{
      id: 'conflicts',
      label: t('Conflicts'),
      icon: LightningIcon,
      fillOnPress: true,
      variant: 'favorite',
      tag: conflictCount,
      tagVariant: 'count',
      className: 'dq-ui-choice-button--floating-tag',
    }] : []),
    ...(isLatestLineupSelected && authUser && hasFavoriteEntries ? [{
      id: 'favorites',
      label: t('Favorites'),
      icon: HeartIcon,
      fillOnPress: true,
      variant: 'likes',
    }] : []),
    ...(isLatestLineupSelected && authUser && tribe && hasTribeEntries ? [{
      id: 'tribe',
      label: t('My tribe'),
      icon: UsersIcon,
      fillOnPress: true,
      variant: 'favorite',
    }] : []),
  ], [authUser, conflictCount, hasFavoriteEntries, hasTribeEntries, isLatestLineupSelected, t, tribe]);
  const timetableDrawers = useMemo(() => (timetableDayDrawerOptions.length > 1
    ? [{
        id: 'day',
        label: t('Day'),
        options: timetableDayDrawerOptions,
      }]
    : []), [t, timetableDayDrawerOptions]);
  const timetableDrawersWithStyles = useMemo(() => [
    ...timetableDrawers,
    ...(timetableStyleOptions.length > 0 ? [{
      id: 'styles',
      label: t('Styles'),
      placement: 'end',
      type: 'checkbox',
      options: timetableStyleOptions,
    }] : []),
  ], [t, timetableDrawers, timetableStyleOptions]);

  const timetableFilterBar = useMemo(() => (timetableChoices.length > 0 || timetableDrawersWithStyles.length > 0 ? {
    defaultValue: {
      day: defaultTimetableDay || null,
      styles: [],
      favorites: false,
      conflicts: false,
      tribe: false,
    },
    value: {
      day: selectedTimetableDayLabel || null,
      styles: selectedStyles,
      favorites: showFavoritesOnly,
      conflicts: showConflictsOnly,
      tribe: showTribeOnly,
    },
    onChange: (nextValue) => {
      const nextDay = nextValue.day ?? defaultTimetableDay;
      const nextStyles = Array.isArray(nextValue.styles) ? nextValue.styles : [];
      const didChangeDay = nextDay !== selectedTimetableDayLabel;
      const didEnableFavorites = Boolean(nextValue.favorites) && !showFavoritesOnly;
      const didEnableConflicts = Boolean(nextValue.conflicts) && !showConflictsOnly;
      const didEnableTribe = Boolean(nextValue.tribe) && !showTribeOnly;
      const nextFavoritesOnly =
        didEnableConflicts || didEnableTribe ? false : Boolean(nextValue.favorites);
      const nextConflictsOnly =
        didEnableFavorites || didEnableTribe ? false : Boolean(nextValue.conflicts);
      const nextTribeOnly =
        didEnableConflicts || didEnableFavorites ? false : Boolean(nextValue.tribe);

      if (didChangeDay) {
        scrollViewportToTop();
      }

      setSelectedTimetableDay(nextDay);
      setSelectedStyles(nextStyles);
      setShowFavoritesOnly(nextFavoritesOnly);
      setShowConflictsOnly(nextConflictsOnly);
      setShowTribeOnly(nextTribeOnly);
    },
    onReset: () => {
      setSelectedTimetableDay(defaultTimetableDay);
      setSelectedStyles([]);
      setShowFavoritesOnly(false);
      setShowConflictsOnly(false);
      setShowTribeOnly(false);
    },
    choices: timetableChoices,
    drawers: timetableDrawersWithStyles,
  } : null), [
    defaultTimetableDay,
    selectedStyles,
    selectedTimetableDayLabel,
    showConflictsOnly,
    showFavoritesOnly,
    showTribeOnly,
    timetableChoices,
    timetableDrawersWithStyles,
  ]);

  const navbarItems = useMemo(
    () => [
      ...(!hasTimetableView ? [{
        id: 'lineup',
        label: t('Lineup'),
        icon: MusicNoteIcon,
        active: activeView === 'lineup',
        onClick: handleLineupNav,
      }] : []),
      ...(hasTimetableView ? [{
        id: 'timetable',
        label: t('Timetable'),
        icon: MusicNoteIcon,
        active: activeView === 'timetable',
        onClick: handleTimetableNav,
      }] : []),
      ...(hasMapsView ? [{
        id: 'maps',
        label: t('Maps'),
        icon: MapTrifoldIcon,
        active: activeView === 'maps',
        onClick: handleMapsNav,
      }] : []),
      {
        id: 'reviews',
        label: t('Reviews'),
        icon: HeartBreakIcon,
        active: activeView === 'reviews',
        badge: authUser && reviewCount > 0 ? <Badge variant="count">{reviewCount}</Badge> : null,
        togglesActive: Boolean(authUser),
        onClick: handleReviewsNav,
      },
      {
        id: 'search',
        label: t('Search'),
        icon: MagnifyingGlassIcon,
        active: activeView === 'search',
        showIconDesktop: true,
        onClick: openSearch,
      },
    ],
    [
      activeView,
      authUser,
      handleLineupNav,
      handleMapsNav,
      handleReviewsNav,
      handleTimetableNav,
      hasMapsView,
      hasTimetableView,
      openSearch,
      reviewCount,
      t,
    ]
  );

  const profileName = useMemo(() => {
    if (!authUser) {
      return t('Login');
    }

    const firstName = String(activeProfile?.first_name ?? '').trim();
    const lastName = String(activeProfile?.last_name ?? '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    return String(activeProfile?.username ?? '').trim() || t('Your profile');
  }, [activeProfile, authUser, t]);

  const profileSubtitle = useMemo(() => {
    if (!authUser) {
      return t('Sync favorites and tribe');
    }

    const username = String(activeProfile?.username ?? '').trim();
    return username ? `@${username}` : t('Account');
  }, [activeProfile, authUser, t]);

  const profileImageSrc = useMemo(() => {
    if (!authUser || !activeProfile) {
      return '';
    }

    return resolveProfileAvatarUrl(activeProfile);
  }, [activeProfile, authUser]);

  useEffect(() => {
    const tribeAvatarUrls = (tribe?.members ?? [])
      .map((member) => resolveProfileAvatarUrl(member.profile))
      .filter(Boolean);
    const mapAvatarUrls = mapTribeLocations
      .map((location) => location.avatarUrl)
      .filter(Boolean);
    const avatarUrls = Array.from(new Set([...tribeAvatarUrls, ...mapAvatarUrls]));

    cacheMapLayerImages([], [profileImageSrc, ...avatarUrls]).catch(() => {});
  }, [mapTribeLocations, profileImageSrc, tribe?.members]);

  const profileBadge = isAdmin && pendingLineupCount > 0 ? pendingLineupCount : null;

  const searchHeaderContent = useMemo(() => (
    <Box
      className="dq-app-search-header"
      direction="row"
      align="center"
      gap="var(--dq-ui-space-sm)"
    >
      <Button
        className="dq-app-search-header__previous"
        icon={ArrowLeftIcon}
        ariaLabel={t('Previous view')}
        size="lg"
        radius="rounded"
        onClick={handleReturnFromSearch}
      />
      <SearchInput
        ariaLabel={t('Search')}
        value={searchHeaderQuery}
        onChange={(event) => setSearchHeaderQuery(event.target.value)}
        onClear={() => setSearchHeaderQuery('')}
        placeholder={t('Search an artist, duo, show...')}
      />
    </Box>
  ), [handleReturnFromSearch, searchHeaderQuery, t]);

  const handleLineupsChanged = useCallback(async ({ selectLatest = false } = {}) => {
    await refreshLineupSources({ selectLatest });
    await refreshPendingLineupCount();
  }, [refreshLineupSources, refreshPendingLineupCount]);

  const viewPropsByView = useMemo(() => ({
    lineup: {
      hasLineup,
      groupedEntries: groupedVisibleEntries,
      entries: visibleEntries,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      canEditLineup: canEditSelectedLineup,
      onEditEntry: handleOpenPerformanceEdit,
      showTribeOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? readOnlyLineupNotice : null,
      archiveNoticeTitle: readOnlyLineupNoticeTitle,
      filterBar: lineupFilterBar,
      showStyleTags,
      styleTagsByEntryId,
    },
    search: {
      hasLineup,
      groupedEntries: groupedSearchVisibleEntries,
      entries: searchVisibleEntries,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      canEditLineup: canEditSelectedLineup,
      onEditEntry: handleOpenPerformanceEdit,
      showTribeOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? readOnlyLineupNotice : null,
      archiveNoticeTitle: readOnlyLineupNoticeTitle,
      filterBar: lineupFilterBar,
      stackDays: Boolean(searchHeaderQuery.trim()),
      showStyleTags,
      styleTagsByEntryId,
      shouldShowJokeLineup: isJokeLineupSearchActive,
      jokeLineupSearchKey,
    },
    timetable: {
      hasLineup,
      entries: visibleTimetableEntries,
      selectedDay: selectedTimetableDayLabel,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      canEditLineup: canEditSelectedLineup,
      onEditEntry: handleOpenPerformanceEdit,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? readOnlyLineupNotice : null,
      archiveNoticeTitle: readOnlyLineupNoticeTitle,
      filterBar: timetableFilterBar,
      showStyleTags,
      styleTagsByEntryId,
    },
    maps: {
      mapLayers: selectedMapLayers,
      selectedDay: defaultBrowseDay,
      isOffline,
      tribeLocations: mapTribeLocations,
      currentUserId: authUser?.id ?? null,
      focusTribeLocationUserId: focusedTribeLocationUserId,
      focusTribeLocationMapLayerId: focusedTribeLocationMapLayerId,
      calibrationPoints: mapCalibrationPoints,
      isCalibrationMode: isMapCalibrationMode,
      calibrationMessage: mapCalibrationMessage,
      isLiveLocationSharing,
      liveLocationRemainingMinutes,
      onFocusTribeLocationHandled: () => {
        setFocusedTribeLocationUserId(null);
        setFocusedTribeLocationMapLayerId(null);
      },
      onAddCalibrationPoint: handleAddMapCalibrationPoint,
      onRemoveCalibrationPoint: handleRemoveMapCalibrationPoint,
      onCancelCalibration: handleStopMapCalibration,
      onStartLiveLocationSharing: handleStartLiveLocationSharing,
      onStopLiveLocationSharing: handleStopLiveLocationSharing,
      onSetTribeLocation: handleSetTribeMapLocation,
      onRemoveTribeLocation: handleRemoveTribeMapLocation,
    },
    reviews: {
      hasLineup,
      reviewFavorites: visibleReviewFavorites,
      conflictEntries: favoriteTimetableConflictEntries,
      favoriteIdSet,
      toggleFavorite,
      toggleReviewSuggestionFavorite: handleToggleReviewSuggestionFavorite,
      removeReviewFavorite,
      onOpenTimetableConflicts: handleOpenTimetableConflicts,
      ignoredConflictIds: ignoredReviewConflictIds,
      onIgnoreConflict: handleIgnoreReviewConflict,
      onRestoreConflict: handleRestoreReviewConflict,
      tribeLikesByEntryId,
      ignoreSmallConflicts,
      canManageFavorites: !favoritesReadOnly,
      archiveNotice: favoritesReadOnly ? readOnlyLineupNotice : null,
      isAuthenticated: Boolean(authUser),
    },
  }), [
    readOnlyLineupNotice,
    readOnlyLineupNoticeTitle,
    authUser,
    canEditSelectedLineup,
    favoriteIdSet,
    favoriteTimetableConflictEntries,
    favoritesReadOnly,
    focusedTribeLocationUserId,
    focusedTribeLocationMapLayerId,
    hasLineup,
    groupedVisibleEntries,
    groupedSearchVisibleEntries,
    handleIgnoreReviewConflict,
    handleAddMapCalibrationPoint,
    handleOpenPerformanceEdit,
    handleOpenTimetableConflicts,
    handleRemoveMapCalibrationPoint,
    handleRemoveTribeMapLocation,
    handleRestoreReviewConflict,
    handleSetTribeMapLocation,
    handleStartLiveLocationSharing,
    handleStopLiveLocationSharing,
    handleStopMapCalibration,
    handleToggleReviewSuggestionFavorite,
    ignoredReviewConflictIds,
    ignoreSmallConflicts,
    isOffline,
    isLiveLocationSharing,
    isMapCalibrationMode,
    isJokeLineupSearchActive,
    jokeLineupSearchKey,
    lineupFilterBar,
    liveLocationRemainingMinutes,
    mapCalibrationMessage,
    mapCalibrationPoints,
    mapTribeLocations,
    removeReviewFavorite,
    defaultBrowseDay,
    selectedMapLayers,
    selectedTimetableDayLabel,
    showTribeOnly,
    searchHeaderQuery,
    searchVisibleEntries,
    showStyleTags,
    timetableFilterBar,
    toggleFavorite,
    tribeLikesByEntryId,
    visibleTimetableEntries,
    visibleReviewFavorites,
    visibleEntries,
    styleTagsByEntryId,
  ]);

  const pagePropsByType = useMemo(() => ({
    settings: {
      user: authUser,
      profile: activeProfile,
      tribe,
      isTribeBusy,
      isTribeHydrating: authUser ? !isTribeReady : false,
      pendingTribeInviteCode,
      tribeInviteAlert,
      tribeLocations: settingsTribeLocations,
      hidePastEvents,
      hideUndatedEvents,
      ignoreSmallConflicts,
      showStyleTags,
      favoriteCount: favoriteItems.length,
      lineups: availableLineupSources,
      selectedLineupKey,
      pwaInstall,
      isAdmin,
      pendingLineupCount,
      language,
      defaultLanguage: activeSite.defaultLanguage,
      onSelectLineup: handleSelectLineup,
      onLanguageChange: handleLanguageChange,
      onHidePastEventsChange: setHidePastEvents,
      onHideUndatedEventsChange: setHideUndatedEvents,
      onIgnoreSmallConflictsChange: setIgnoreSmallConflicts,
      onShowStyleTagsChange: setShowStyleTags,
      onResetFavorites: resetFavorites,
      onProfileUpdated: handleProfileUpdated,
      onBeforeSignOut: handleBeforeSignedOut,
      onSignedOut: handleSignedOut,
      onCreateTribe: handleCreateTribe,
      onJoinTribe: handleJoinTribe,
      onLeaveTribe: handleLeaveTribe,
      onRenameTribe: handleRenameTribe,
      onShowMemberOnMap: handleShowTribeLocationOnMap,
    },
    admin: {
      isAdmin,
      onLineupsChanged: handleLineupsChanged,
      onPreviewLineup: handlePreviewLineup,
      allowManualLineupEdit: isManualLineupEditAllowed,
      onAllowManualLineupEditChange: handleManualLineupEditAllowedChange,
      isJokeLineupEnabled,
      isJokeLineupSaving,
      onJokeLineupEnabledChange: handleJokeLineupEnabledChange,
      hasPublishedLineup,
      onAddPerformance: handleOpenPerformanceCreate,
      onCalibrateMap: handleStartMapCalibration,
      onResetMapCalibration: handleResetMapCalibration,
      tempLineup: tempLineupSource,
      onDeleteTempLineup: handleDeleteTempLineup,
    },
    about: {},
    roadmap: {},
    legal: {},
  }), [
    activeProfile,
    authUser,
    handleProfileUpdated,
    handleLanguageChange,
    handleBeforeSignedOut,
    handleCreateTribe,
    handleJoinTribe,
    handleLeaveTribe,
    handleRenameTribe,
    handleSelectLineup,
    handleSignedOut,
    handleLineupsChanged,
    handlePreviewLineup,
    handleOpenPerformanceCreate,
    handleStartMapCalibration,
    handleResetMapCalibration,
    handleDeleteTempLineup,
    handleManualLineupEditAllowedChange,
    handleJokeLineupEnabledChange,
    handleShowTribeLocationOnMap,
    hidePastEvents,
    hideUndatedEvents,
    ignoreSmallConflicts,
    showStyleTags,
    isAdmin,
    isJokeLineupEnabled,
    isJokeLineupSaving,
    isManualLineupEditAllowed,
    hasPublishedLineup,
    favoriteItems.length,
    isTribeBusy,
    isTribeReady,
    availableLineupSources,
    settingsTribeLocations,
    pendingLineupCount,
    pendingTribeInviteCode,
    language,
    pwaInstall,
    resetFavorites,
    selectedLineupKey,
    tempLineupSource,
    tribe,
    tribeInviteAlert,
  ]);

  const baseViewHeaderTransitionState = useMemo(() => {
    if (!hasRenderedPages) {
      return headerModeTransitionState;
    }

    if (topPageTransitionState === 'entering') {
      return 'exiting';
    }

    if (topPageTransitionState === 'exiting') {
      return 'entering';
    }

    return 'covered';
  }, [hasRenderedPages, headerModeTransitionState, topPageTransitionState]);

  const isSearchHeaderMode = headerMode === 'search';
  const shouldKeepMobileNavbarVisible = activeView === 'search' || isSearchHeaderMode;
  const performanceEditDayOptions = useMemo(
    () => getLineupDayOptionsFromPayload(selectedLineup?.payload),
    [selectedLineup]
  );
  const performanceEditStageOptions = useMemo(
    () => getLineupStageOptionsForDay(
      selectedLineup?.payload,
      editingPerformance?.values.daySlug
    ),
    [editingPerformance?.values.daySlug, selectedLineup]
  );
  const performanceEditValidationErrors = useMemo(
    () => getPerformanceEditFieldErrors(editingPerformance, t),
    [editingPerformance, t]
  );

  const performanceEditFieldErrors = hasTriedPerformanceEditSubmit
    ? performanceEditValidationErrors
    : {};

  const isPerformanceEditSaveDisabled = (
    !editingPerformance ||
    !hasPerformanceEditChanges(editingPerformance)
  );
  const baseView = useMemo(() => (
    <AppBaseView
      activeView={activeView}
      viewRefreshKey={viewRefreshKey}
      viewPropsByView={viewPropsByView}
      navbarItems={navbarItems}
      onOpenView={openView}
      onOpenSearch={openSearch}
      onOpenHome={openHomeView}
      onOpenSettings={handleProfileButtonClick}
      headerContent={isSearchHeaderMode ? searchHeaderContent : null}
      wideHeaderContent={isSearchHeaderMode}
      hideHeaderBrand={isSearchHeaderMode}
      hideDesktopNavbar={isSearchHeaderMode}
      hideHeaderProfile={isSearchHeaderMode}
      keepMobileNavbarVisible={shouldKeepMobileNavbarVisible}
      headerTransitionState={baseViewHeaderTransitionState}
      isOffline={isOffline}
      isHidden={shouldHideBaseView}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileImageSrc={profileImageSrc}
      profileBadge={profileBadge}
      brandLogoSrc={activeSiteAssets.logoSrc}
    />
  ), [
    activeView,
    baseViewHeaderTransitionState,
    handleProfileButtonClick,
    isSearchHeaderMode,
    isOffline,
    navbarItems,
    openHomeView,
    openSearch,
    openView,
    profileImageSrc,
    profileBadge,
    profileName,
    profileSubtitle,
    searchHeaderContent,
    shouldHideBaseView,
    shouldKeepMobileNavbarVisible,
    viewRefreshKey,
    viewPropsByView,
  ]);

  if (activeView === 'storybook') {
    return <StorybookView onOpenView={openView} />;
  }

  return (
    <I18nProvider language={language} defaultLanguage={activeSite.defaultLanguage}>
      <UiThemeScope>
      <Box
        className="dq-pull-refresh"
        component="div"
        align="center"
        justify="center"
        aria-hidden={!isPullVisible}
        data-state={refreshState}
        data-dragging={isDragging ? 'true' : undefined}
        style={{
          '--dq-pull-refresh-distance': `${pullDistance}px`,
          '--dq-pull-refresh-progress': pullProgress,
        }}
      >
        <Box
          className="dq-pull-refresh__pill"
          component="span"
          align="center"
          justify="center"
        >
          <ArrowClockwiseIcon
            className="dq-pull-refresh__icon dq-pull-refresh__icon--arrow"
            aria-hidden="true"
            focusable="false"
            weight="bold"
          />
          <CircleNotchIcon
            className="dq-pull-refresh__icon dq-pull-refresh__icon--loader"
            aria-hidden="true"
            focusable="false"
            weight="bold"
          />
        </Box>
      </Box>

      {baseView}

      {renderedPageStack.map((page, index) => (
        <AppPageLayer
          key={page.id}
          page={page}
          layerIndex={index}
          onClosePage={closePage}
          onOpenPage={openPage}
          onOpenView={openView}
          isOffline={isOffline}
          isHidden={getIsPageHidden(index)}
          transitionState={page.transitionState}
          pagePropsByType={pagePropsByType}
        />
      ))}

      {!hasRenderedPages ? <BackToTop /> : null}

      <Modal
        open={Boolean(editingPerformance)}
        onClose={handleClosePerformanceEdit}
        title={editingPerformance?.mode === 'create' ? t('Add show') : t('Edit show')}
        subtitle={
          editingPerformance
            ? editingPerformance.mode === 'create'
              ? t('Manual lineup edit')
              : getEntryMetaLabel(editingPerformance.entry)
            : ''
        }
        controls={(
          <>
            <Button variant="ghost" onClick={handleClosePerformanceEdit}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleSavePerformanceEdit} disabled={isPerformanceEditSaveDisabled}>
              {editingPerformance?.mode === 'create' ? t('Add show') : t('Save edit')}
            </Button>
          </>
        )}
      >
        <Box gap="var(--dq-ui-space-md)">
          {editingPerformance?.errorMessage ? (
            <Alert variant="error" title={t('Show edit failed')}>
              {editingPerformance.errorMessage}
            </Alert>
          ) : null}
          <TextInput
            label={t('Artist name')}
            value={editingPerformance?.values.artistName ?? ''}
            required
            errorMessage={performanceEditFieldErrors.artistName}
            onChange={(event) => handleEditingPerformanceChange({ artistName: event.target.value })}
          />
          {editingPerformance ? (
            <>
              <SelectInput
                label={t('Day')}
                value={editingPerformance?.values.daySlug ?? ''}
                options={performanceEditDayOptions.map((day) => ({
                  value: day.value,
                  label: day.label,
                }))}
                required
                errorMessage={performanceEditFieldErrors.daySlug}
                onChange={(event) => handleEditingPerformanceChange({ daySlug: event.target.value })}
              />
              <SelectInput
                label={t('Stage')}
                value={editingPerformance?.values.stageSlug ?? ''}
                options={performanceEditStageOptions}
                required
                errorMessage={performanceEditFieldErrors.stageSlug}
                onChange={(event) => handleEditingPerformanceChange({ stageSlug: event.target.value })}
              />
            </>
          ) : null}
          <DateTimeInput
            label={t('Start')}
            dateValue={editingPerformance?.values.startDate ?? ''}
            timeValue={editingPerformance?.values.startTime ?? ''}
            required
            hideDateInput
            dateErrorMessage={performanceEditFieldErrors.startDate}
            timeErrorMessage={performanceEditFieldErrors.startTime}
            onDateChange={(startDate) => handleEditingPerformanceChange({ startDate })}
            onTimeChange={(startTime) => handleEditingPerformanceChange({ startTime })}
          />
          <DateTimeInput
            label={t('End')}
            dateValue={editingPerformance?.values.endDate ?? ''}
            timeValue={editingPerformance?.values.endTime ?? ''}
            required
            hideDateInput
            dateErrorMessage={performanceEditFieldErrors.endDate}
            timeErrorMessage={performanceEditFieldErrors.endTime}
            onDateChange={(endDate) => handleEditingPerformanceChange({ endDate })}
            onTimeChange={(endTime) => handleEditingPerformanceChange({ endTime })}
          />
        </Box>
      </Modal>

      <AuthModal
        open={isAuthModalOpen}
        defaultTab={authDefaultTab}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={(user) => {
          setIsAuthModalOpen(false);
          hydrateAccountRef.current?.(user ?? null);
        }}
      />
      </UiThemeScope>
    </I18nProvider>
  );
};

export default App;
