import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Music2 as MusicIcon,
  Star as StarIcon,
  Users as UsersIcon,
  Search,
  UserRound,
  ChevronDown,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  countVisibleStages,
  filterExpiredEntries,
  filterExpiredReviewFavorites,
  filterUndatedEntries,
  filterUndatedReviewFavorites,
  filterEntries,
  filterReviewFavorites,
  getDays,
  getStages,
  groupEntriesByDayAndStage,
  groupFavoritesByDayAndStage,
  loadHidePastEventsPreference,
  loadHideUndatedEventsPreference,
  loadViewPreferences,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveHidePastEventsPreference,
  saveHideUndatedEventsPreference,
  saveViewPreferences,
  upsertFavoriteEntry,
  validateLineupPayload,
} from './lib/lineup';
import {
  createCurrentUserTribe,
  getCurrentUser,
  isSupabaseConfigured,
  joinCurrentUserTribeByCode,
  leaveCurrentUserTribe,
  loadAccountBundle,
  loadTribeBundle,
  supabase,
  syncFavoriteSnapshots,
} from './lib/supabase';
import { getPresetAvatarUrl, resolveProfileAvatarUrl } from './lib/presetAvatars';
import { getStageTheme } from './lib/stageThemes';
import StageBadge, { getStageBadgeStyles } from './components/StageBadge';
import logoMark from './assets/logo.svg';
import FavoriteStar from './components/FavoriteStar';
import EmptyState from './components/EmptyState';
import AuthModal from './components/AuthModal';
import LineupView from './views/LineupView';
import ReviewsView from './views/ReviewsView';
import TribeView from './views/TribeView';
import ProfileSettingsView from './views/ProfileSettingsView';
import './index.css';

const ACCOUNT_CACHE_KEY_PREFIX = 'account-cache:v1:';
const LAST_AUTHENTICATED_USER_ID_KEY = 'last-authenticated-user-id:v1';

function getAccountCacheKey(userId) {
  return `${ACCOUNT_CACHE_KEY_PREFIX}${userId}`;
}

function readCachedAccount(userId) {
  if (!userId) {
    return null;
  }
  try {
    const rawValue = localStorage.getItem(getAccountCacheKey(userId));
    if (!rawValue) {
      return null;
    }
    const parsed = JSON.parse(rawValue);
    return {
      profile: parsed?.profile ?? null,
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : [],
      tribe: parsed?.tribe ?? null,
    };
  } catch {
    return null;
  }
}

function writeCachedAccount(userId, account) {
  if (!userId) {
    return;
  }
  try {
    localStorage.setItem(
      getAccountCacheKey(userId),
      JSON.stringify({
        profile: account?.profile ?? null,
        favorites: Array.isArray(account?.favorites) ? account.favorites : [],
        tribe: account?.tribe ?? null,
      })
    );
  } catch {
    // Ignore storage quota / availability issues.
  }
}

function clearCachedAccount(userId) {
  if (!userId) {
    return;
  }
  try {
    localStorage.removeItem(getAccountCacheKey(userId));
  } catch {
    // Ignore storage availability issues.
  }
}

function serializeFavoriteItems(items) {
  return JSON.stringify(items ?? []);
}

function scrollToTopQuickly() {
  const startY = window.scrollY || window.pageYOffset || 0;
  if (startY <= 0) {
    return;
  }
  const duration = 220;
  const startTime = performance.now();

  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  const tick = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    window.scrollTo(0, Math.round(startY * (1 - easedProgress)));

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}

function readLastAuthenticatedUserId() {
  try {
    return localStorage.getItem(LAST_AUTHENTICATED_USER_ID_KEY) || null;
  } catch {
    return null;
  }
}

function writeLastAuthenticatedUserId(userId) {
  try {
    if (!userId) {
      localStorage.removeItem(LAST_AUTHENTICATED_USER_ID_KEY);
      return;
    }
    localStorage.setItem(LAST_AUTHENTICATED_USER_ID_KEY, userId);
  } catch {
    // Ignore storage availability issues.
  }
}

function getBootAccountState() {
  const userId = readLastAuthenticatedUserId();
  const account = readCachedAccount(userId);
  return { userId, account };
}

// Load all lineup JSON modules at build time. Each module may export
// either an array of entries or an object with an `entries` array.
function extractLineupEntries(moduleValue) {
  const payload = moduleValue?.default ?? moduleValue ?? null;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.entries)) {
    return payload.entries;
  }
  return [];
}

function formatLineupLabel(path) {
  const fileName = path.split('/').pop() ?? path;
  const match = fileName.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_defqon_lineup\.json$/);
  if (!match) {
    return fileName;
  }
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} · ${hour}:${minute}`;
}

// Eagerly import all lineup JSON files from the data folder. When the
// project is built each JSON is bundled alongside the JS.
const lineupModules = import.meta.glob('./data/*_defqon_lineup.json', {
  eager: true,
});
const lineupKeysAsc = Object.keys(lineupModules).sort();
const latestKey = lineupKeysAsc.at(-1) ?? null;
const lineupSources = [...lineupKeysAsc]
  .reverse()
  .map((key) => ({
    key,
    label: formatLineupLabel(key),
    entries: extractLineupEntries(lineupModules[key]),
    isLatest: key === latestKey,
  }));
for (const lineupSource of lineupSources) {
  if (lineupSource.entries.length > 0) {
    validateLineupPayload(lineupSource.entries);
  }
}
const hasLineup = lineupSources.length > 0;

export default function App() {
  const bootStateRef = useRef(null);
  if (!bootStateRef.current) {
    bootStateRef.current = getBootAccountState();
  }
  const bootUserId = bootStateRef.current.userId;
  const bootAccount = bootStateRef.current.account;
  // Which lineup JSON is selected
  const [selectedLineupKey, setSelectedLineupKey] = useState(latestKey);
  const selectedLineup =
    lineupSources.find((lineup) => lineup.key === selectedLineupKey) ?? lineupSources[0] ?? null;
  const selectedEntries = selectedLineup?.entries ?? [];
  const isLatestLineupSelected = selectedLineup?.isLatest ?? false;
  const favoritesReadOnly = !isLatestLineupSelected;
  // Precompute entry map for quick lookup
  const entriesById = useMemo(
    () => new Map(selectedEntries.map((entry) => [entry.id, entry])),
    [selectedEntries]
  );
  // Always default to "All days". The default day used to be the first day of the
  // lineup, but we want to start with all days selected by default. Only if the
  // user previously chose a specific day via view preferences do we restore it.
  const defaultDay = 'All days';
  const [selectedDay, setSelectedDay] = useState(
    () => loadViewPreferences()?.selectedDay || defaultDay
  );
  const [selectedStage, setSelectedStage] = useState(
    () => loadViewPreferences()?.selectedStage || 'All stages'
  );
  const [query, setQuery] = useState('');
  const [hidePastEvents, setHidePastEvents] = useState(() => loadHidePastEventsPreference());
  const [hideUndatedEvents, setHideUndatedEvents] = useState(() => loadHideUndatedEventsPreference());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  // Manage favourite items and filter
  const [favoriteItems, setFavoriteItems] = useState(() => bootAccount?.favorites ?? []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTribeOnly, setShowTribeOnly] = useState(false);
  // View state: lineup, reviews, tribe, profileSettings
  const [view, setView] = useState('lineup');

  // Local UI state for filter drawers
  // Only one filter drawer can be open at a time: 'day', 'stage' or null
  const [openDrawer, setOpenDrawer] = useState(null);
  const searchInputRef = useRef(null);
  const activeHydrationIdRef = useRef(0);
  const lastAuthenticatedUserIdRef = useRef(bootUserId);
  const hasRemoteAccountBundleRef = useRef(false);
  const lastSyncedFavoritesRef = useRef(serializeFavoriteItems(bootAccount?.favorites ?? []));
  // Supabase auth and account
  const [authUser, setAuthUser] = useState(() => (bootUserId ? { id: bootUserId } : null));
  const [profile, setProfile] = useState(() => bootAccount?.profile ?? null);
  const [tribe, setTribe] = useState(() => bootAccount?.tribe ?? null);
  const [isTribeReady, setIsTribeReady] = useState(() => bootAccount !== null);
  const [isTribeBusy, setIsTribeBusy] = useState(false);
  const [isAccountReady, setIsAccountReady] = useState(!isSupabaseConfigured());
  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  // State to track pending actions waiting for authentication
  const [pendingAction, setPendingAction] = useState(null);
  // Whether search has auto expanded the filter scope
  const [hasAutoExpandedSearchScope, setHasAutoExpandedSearchScope] = useState(false);

  // Resolve favourites into ids, entries and review items
  const favoriteResolution = useMemo(
    () => resolveFavoriteItems(selectedEntries, favoriteItems),
    [selectedEntries, favoriteItems]
  );
  const favoriteIds = favoriteResolution.ids;
  const favoriteEntries = favoriteResolution.entries;
  const reviewFavorites = favoriteResolution.reviewItems;
  const baseVisibleReviewFavorites = useMemo(
    () => (hideUndatedEvents ? filterUndatedReviewFavorites(reviewFavorites) : reviewFavorites),
    [hideUndatedEvents, reviewFavorites]
  );
  const visibleReviewFavorites = useMemo(
    () =>
      hidePastEvents
        ? filterExpiredReviewFavorites(baseVisibleReviewFavorites, currentTime)
        : baseVisibleReviewFavorites,
    [baseVisibleReviewFavorites, hidePastEvents, currentTime]
  );
  const reviewCount = visibleReviewFavorites.length;
  const baseBrowseableEntries = useMemo(
    () => (hideUndatedEvents ? filterUndatedEntries(selectedEntries) : selectedEntries),
    [hideUndatedEvents, selectedEntries]
  );
  const browseableEntries = useMemo(
    () => (hidePastEvents ? filterExpiredEntries(baseBrowseableEntries, currentTime) : baseBrowseableEntries),
    [baseBrowseableEntries, hidePastEvents, currentTime]
  );
  const tribeLikesByEntryId = useMemo(() => {
    if (!tribe?.members?.length) {
      return new Map();
    }
    const entriesByHash = new Map(selectedEntries.map((entry) => [entry.hash, entry]));
    const likesByEntryId = new Map();
    tribe.members.forEach((member) => {
      const profileRecord = member.profile ?? {};
      const avatarUrl =
        resolveProfileAvatarUrl(profileRecord) ||
        getPresetAvatarUrl(profileRecord?.avatar_preset ?? 1);
      const firstName = String(profileRecord.first_name ?? '').trim() || profileRecord.username || 'Tribe';
      const lastName = String(profileRecord.last_name ?? '').trim() || 'member';
      const seenEntryIds = new Set();
      (member.favorites ?? []).forEach((favorite) => {
        let matchedEntry = null;
        if (favorite.id && entriesById.has(favorite.id)) {
          matchedEntry = entriesById.get(favorite.id);
        } else if (favorite.hash && entriesByHash.has(favorite.hash)) {
          matchedEntry = entriesByHash.get(favorite.hash);
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
          avatarUrl,
          isCurrentUser: member.userId === authUser?.id,
        });
        likesByEntryId.set(matchedEntry.id, currentLikes);
      });
    });
    return likesByEntryId;
  }, [tribe, selectedEntries, entriesById, authUser]);
  const tribeLikedEntryIds = useMemo(
    () => new Set(Array.from(tribeLikesByEntryId.keys())),
    [tribeLikesByEntryId]
  );

  // Derive lists of days and stages for filters
  const days = useMemo(() => getDays(browseableEntries), [browseableEntries]);
  const stages = useMemo(
    () => getStages(browseableEntries, selectedDay),
    [browseableEntries, selectedDay]
  );

  // Filter entries based on query, day and stage
  const visibleEntries = useMemo(() => {
    const base = filterEntries(browseableEntries, {
      query,
      day: selectedDay,
      stage: selectedStage,
    });
    if (showTribeOnly) {
      return base.filter((entry) => tribeLikedEntryIds.has(entry.id));
    }
    if (showFavoritesOnly) {
      return base.filter((entry) => favoriteIds.includes(entry.id));
    }
    return base;
  }, [
    browseableEntries,
    query,
    selectedDay,
    selectedStage,
    showFavoritesOnly,
    showTribeOnly,
    favoriteIds,
    tribeLikedEntryIds,
  ]);
  // Group visible entries by day and stage for the lineup view
  const groupedVisibleEntries = useMemo(
    () => groupEntriesByDayAndStage(visibleEntries),
    [visibleEntries]
  );
  // Filter favourite entries when used in the original favourites view (not used in new design)
  const filteredFavoriteEntries = useMemo(
    () =>
      filterEntries(
        hidePastEvents
          ? filterExpiredEntries(
              hideUndatedEvents ? filterUndatedEntries(favoriteEntries) : favoriteEntries,
              currentTime
            )
          : hideUndatedEvents
            ? filterUndatedEntries(favoriteEntries)
            : favoriteEntries,
        { query, day: selectedDay, stage: selectedStage }
      ),
    [favoriteEntries, hidePastEvents, hideUndatedEvents, currentTime, query, selectedDay, selectedStage]
  );
  // Filter review favourites for the reviews view
  const filteredReviewFavorites = useMemo(
    () => filterReviewFavorites(visibleReviewFavorites, { query, day: selectedDay, stage: selectedStage }),
    [visibleReviewFavorites, query, selectedDay, selectedStage]
  );
  // Group favourites by day and stage when needed (unused in new design)
  const groupedFavorites = useMemo(
    () => groupFavoritesByDayAndStage(filteredFavoriteEntries),
    [filteredFavoriteEntries]
  );
  // Save view preferences whenever day or stage changes
  useEffect(() => {
    saveViewPreferences({ selectedDay, selectedStage });
  }, [selectedDay, selectedStage]);
  useEffect(() => {
    if (view !== 'lineup') {
      return;
    }
    scrollToTopQuickly();
  }, [view, selectedDay, selectedStage, showFavoritesOnly, showTribeOnly]);
  useEffect(() => {
    saveHidePastEventsPreference(hidePastEvents);
  }, [hidePastEvents]);
  useEffect(() => {
    saveHideUndatedEventsPreference(hideUndatedEvents);
  }, [hideUndatedEvents]);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  useEffect(() => {
    if (!openDrawer) {
      return undefined;
    }

    const isInsideFilterLayer = (target) => {
      return target instanceof Element && target.closest('[data-filter-layer="true"]');
    };

    const handlePointerDown = (event) => {
      if (!isInsideFilterLayer(event.target)) {
        setOpenDrawer(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenDrawer(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDrawer]);
  // Ensure selected day exists when the lineup changes
  useEffect(() => {
    if (selectedDay !== 'All days' && !days.includes(selectedDay)) {
      // When the current day is no longer available (because the lineup
      // changed), fall back to "All days" instead of the first day.
      setSelectedDay('All days');
    }
  }, [selectedDay, days, selectedEntries]);
  // Ensure selected stage exists when the day changes
  useEffect(() => {
    if (selectedStage !== 'All stages' && !stages.includes(selectedStage)) {
      setSelectedStage('All stages');
    }
  }, [selectedStage, stages]);
  // Auto expand search scope if the query is non‑empty
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setHasAutoExpandedSearchScope(false);
      return;
    }
    if (!hasAutoExpandedSearchScope) {
      setSelectedDay('All days');
      setSelectedStage('All stages');
      setHasAutoExpandedSearchScope(true);
    }
  }, [query, hasAutoExpandedSearchScope]);
  // Hydrate account and tribe from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }
    let isActive = true;
    const hydrateFromAccount = async (userOverride) => {
      const hydrationId = activeHydrationIdRef.current + 1;
      activeHydrationIdRef.current = hydrationId;
      setIsAccountReady(false);
      hasRemoteAccountBundleRef.current = false;
      try {
        const currentUser = userOverride ?? (await getCurrentUser());
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
          setIsTribeReady(true);
          setFavoriteItems([]);
          lastSyncedFavoritesRef.current = serializeFavoriteItems([]);
          setIsAccountReady(true);
          return;
        }
        lastAuthenticatedUserIdRef.current = currentUser.id;
        writeLastAuthenticatedUserId(currentUser.id);
        setAuthUser(currentUser);
        const cachedAccount = readCachedAccount(currentUser.id);
        if (cachedAccount) {
          setProfile(cachedAccount.profile ?? null);
          setFavoriteItems(cachedAccount.favorites ?? []);
          setTribe(cachedAccount.tribe ?? null);
          setIsTribeReady(Boolean(cachedAccount.tribe));
        } else {
          setProfile(null);
          setFavoriteItems([]);
          setTribe(null);
          setIsTribeReady(false);
        }

        loadTribeBundle(currentUser.id)
          .then((tribeBundle) => {
            if (!isActive || hydrationId !== activeHydrationIdRef.current) {
              return;
            }
            setTribe(tribeBundle);
            setIsTribeReady(true);
          })
          .catch((error) => {
            console.error(error);
            if (!isActive || hydrationId !== activeHydrationIdRef.current) {
              return;
            }
            setIsTribeReady(true);
          });

        const bundle = await loadAccountBundle(currentUser.id, currentUser);
        if (!isActive || hydrationId !== activeHydrationIdRef.current) {
          return;
        }
        setProfile(bundle.profile);
        setFavoriteItems(bundle.favorites);
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
    hydrateFromAccount();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      hydrateFromAccount(session?.user ?? null);
    });
    return () => {
      isActive = false;
      subscription?.data?.subscription?.unsubscribe();
    };
  }, []);
  // Persist favourites when the user and account are ready
  useEffect(() => {
    if (!authUser || !isAccountReady || !isSupabaseConfigured() || !hasRemoteAccountBundleRef.current) {
      return;
    }
    const nextSerializedFavorites = serializeFavoriteItems(favoriteItems);
    if (nextSerializedFavorites === lastSyncedFavoritesRef.current) {
      return;
    }
    lastSyncedFavoritesRef.current = nextSerializedFavorites;
    syncFavoriteSnapshots(authUser.id, favoriteItems).catch((error) => {
      console.error(error);
    });
  }, [authUser, favoriteItems, isAccountReady]);

  useEffect(() => {
    if (!authUser || !profile) {
      return;
    }
    writeCachedAccount(authUser.id, { profile, favorites: favoriteItems, tribe });
  }, [authUser, profile, favoriteItems, tribe]);

  const isSearchView = view === 'search';

  useEffect(() => {
    if (isSearchView) {
      searchInputRef.current?.focus();
    }
  }, [isSearchView]);
  useEffect(() => {
    if (view !== 'lineup') {
      setOpenDrawer(null);
    }
  }, [view]);
  useEffect(() => {
    if (!tribe && showTribeOnly) {
      setShowTribeOnly(false);
    }
  }, [tribe, showTribeOnly]);
  // Execute pending action after authentication
  useEffect(() => {
    if (!authUser || !isAccountReady || !pendingAction) {
      return;
    }
    if (pendingAction.type === 'open-reviews') {
      setView('reviews');
      setQuery('');
      setSelectedDay('All days');
      setSelectedStage('All stages');
      setShowFavoritesOnly(false);
      setShowTribeOnly(false);
    }
    if (pendingAction.type === 'open-tribe') {
      setView('tribe');
      setQuery('');
      setSelectedDay('All days');
      setSelectedStage('All stages');
      setShowFavoritesOnly(false);
      setShowTribeOnly(false);
    }
    if (pendingAction.type === 'toggle-favorite' && isLatestLineupSelected) {
      const entry = entriesById.get(pendingAction.entryId);
      if (entry) {
        setFavoriteItems((prev) => {
          const isAlreadyFavorite = prev.some(
            (item) => item.id === entry.id || (item.hash && entry.hash && item.hash === entry.hash)
          );
          if (isAlreadyFavorite) {
            return removeFavoriteByEntryId(prev, entry.id);
          }
          return upsertFavoriteEntry(prev, entry);
        });
      }
    }
    if (pendingAction.type === 'remove-review-favorite' && isLatestLineupSelected) {
      setFavoriteItems((prev) => removeFavoriteByKey(prev, pendingAction.favoriteKey));
    }
    setPendingAction(null);
    setIsAuthModalOpen(false);
  }, [authUser, isAccountReady, pendingAction, entriesById, isLatestLineupSelected]);

  // Trigger auth modal when user attempts an action requiring authentication
  const requestAuth = (action, defaultTab = 'login') => {
    setPendingAction(action);
    setAuthDefaultTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const openSearchMode = () => {
    setOpenDrawer(null);
    setView('search');
    setQuery('');
  };

  const closeSearchMode = () => {
    setView('lineup');
    setOpenDrawer(null);
    setQuery('');
  };

  // Navigation handlers for the bottom/tab nav
  const handleLineupNav = () => {
    setView('lineup');
    setQuery('');
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setHasAutoExpandedSearchScope(false);
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
  };
  const handleReviewsNav = () => {
    if (!authUser) {
      requestAuth({ type: 'open-reviews' });
      return;
    }
    setView('reviews');
    setQuery('');
      setSelectedDay('All days');
    setSelectedStage('All stages');
    setHasAutoExpandedSearchScope(false);
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
  };
  const handleTribeNav = () => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }
    setView('tribe');
    setQuery('');
      setSelectedDay('All days');
    setSelectedStage('All stages');
    setHasAutoExpandedSearchScope(false);
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
  };
  // Profile click opens auth modal or profile settings page
  const handleProfileClick = () => {
    if (!authUser) {
      setPendingAction(null);
      setAuthDefaultTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setView('profileSettings');
  };

  // Functions to manage favourites from within child components
  const toggleFavorite = (entryId) => {
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
    setFavoriteItems((prev) => {
      const isAlreadyFavorite = prev.some(
        (item) => item.id === entry.id || (item.hash && entry.hash && item.hash === entry.hash)
      );
      if (isAlreadyFavorite) {
        return removeFavoriteByEntryId(prev, entry.id);
      }
      return upsertFavoriteEntry(prev, entry);
    });
  };
  const removeReviewFavorite = (favoriteKey) => {
    if (favoritesReadOnly || !authUser) {
      return;
    }
    setFavoriteItems((prev) => removeFavoriteByKey(prev, favoriteKey));
  };
  // Tribe handlers wrap supabase actions
  const handleCreateTribe = async () => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }
    setIsTribeBusy(true);
    try {
      const nextTribe = await createCurrentUserTribe();
      setTribe(nextTribe);
    } finally {
      setIsTribeBusy(false);
    }
  };
  const handleJoinTribe = async (code) => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }
    setIsTribeBusy(true);
    try {
      const nextTribe = await joinCurrentUserTribeByCode(code);
      setTribe(nextTribe);
    } finally {
      setIsTribeBusy(false);
    }
  };
  const handleLeaveTribe = async () => {
    if (!authUser) {
      return;
    }
    setIsTribeBusy(true);
    try {
      await leaveCurrentUserTribe();
      setTribe(null);
    } finally {
      setIsTribeBusy(false);
    }
  };
  // Reset filters and query
  const resetFilters = () => {
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setQuery('');
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
    setHasAutoExpandedSearchScope(false);
  };
  // Determine header title based on view and filters
  const headerTitle = useMemo(() => {
    if (view === 'lineup') {
      const dayPart = selectedDay !== 'All days' ? selectedDay : '';
      const stagePart = selectedStage !== 'All stages' ? selectedStage : '';
      if (dayPart && stagePart) {
        return `${dayPart} on ${stagePart}`;
      }
      if (dayPart) {
        return dayPart;
      }
      if (stagePart) {
        return stagePart;
      }
      return 'Line‑up';
    }
    if (view === 'reviews') {
      return 'Needs review';
    }
    if (view === 'tribe') {
      return 'Tribe';
    }
    if (view === 'profileSettings') {
      return '';
    }
    return '';
  }, [view, selectedDay, selectedStage]);
  // Determine if filters/search should be shown for the active view
  const hasActiveFilters =
    selectedDay !== 'All days' ||
    selectedStage !== 'All stages' ||
    showFavoritesOnly ||
    showTribeOnly;
  const searchEntries = useMemo(
    () => filterEntries(browseableEntries, { query, day: 'All days', stage: 'All stages' }),
    [browseableEntries, query]
  );
  const groupedSearchEntries = useMemo(
    () => groupEntriesByDayAndStage(searchEntries),
    [searchEntries]
  );
  const showFilters = view === 'lineup';
  const showSearch = true;
  const selectedStageTheme =
    selectedStage !== 'All stages' ? getStageTheme(selectedStage) : null;
  const selectedStagePillStyle = selectedStageTheme
    ? getStageBadgeStyles(selectedStageTheme, true)
    : null;

  if (!hasLineup || !selectedLineup) {
    return <EmptyState text="No lineup detected" />;
  }
  return (
    <>
      {/* Render application header except on profile settings page; the header
         contains the page title, the desktop navigation and the profile trigger.
         On desktop the navigation appears in the centre. */}
      {view !== 'profileSettings' && (
        <>
          <header className={isSearchView ? 'page-header page-header--search' : 'page-header'}>
            {isSearchView ? (
              <div className="header-search" data-filter-layer="true">
                <div className="header-search__input-wrap">
                  <Search size={16} className="search-input__icon" />
                  <input
                    ref={searchInputRef}
                    className="search-input header-search__input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search artist, duo, showcase, alias..."
                  />
                </div>
                <button
                  type="button"
                  className="header-search__close"
                  onClick={closeSearchMode}
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
            <div className="header-row">
              <button
                type="button"
                className="brand-mark"
                onClick={handleLineupNav}
                aria-label="Open lineup"
              >
                <img src={logoMark} alt="" className="brand-mark__logo" />
                <span className="brand-mark__text">DEFQON.1</span>
              </button>
              <nav className="header-nav">
                <button
                  type="button"
                  className={view === 'lineup' ? 'active' : ''}
                  onClick={handleLineupNav}
                >
                  Line‑up
                </button>
                <button
                  type="button"
                  className={view === 'reviews' ? 'active' : ''}
                  onClick={handleReviewsNav}
                >
                  Reviews
                  {reviewCount > 0 && (
                    <span className="tab__badge tab__badge--corner">{reviewCount}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={view === 'tribe' ? 'active' : ''}
                  onClick={handleTribeNav}
                >
                  Tribe
                </button>
                {showSearch && (
                  <button
                    type="button"
                    className={isSearchView ? 'active header-nav__icon' : 'header-nav__icon'}
                    onClick={openSearchMode}
                    aria-label="Open search"
                    title="Open search"
                  >
                    <Search size={22} />
                  </button>
                )}
              </nav>
              <button
                type="button"
                className={authUser ? 'profile-trigger' : 'profile-trigger profile-trigger--guest'}
                onClick={handleProfileClick}
                aria-label={authUser ? 'Open profile' : 'Login or sign up'}
                title={authUser ? 'Open profile' : 'Login or sign up'}
              >
                {authUser ? (
                  <>
                    {profile ? (
                      <>
                        <img
                          src={resolveProfileAvatarUrl(profile)}
                          alt="User avatar"
                          className="profile-trigger__image"
                        />
                        <div className="profile-trigger__details">
                          <span className="profile-trigger__name">
                            {profile.first_name} {profile.last_name}
                          </span>
                          <span className="profile-trigger__username">@{profile.username}</span>
                        </div>
                      </>
                    ) : (
                      <UserRound size={20} />
                    )}
                  </>
                ) : (
                  <UserRound size={20} />
                )}
              </button>
            </div>
            )}
          </header>
          {showFilters && (
            <div className="filter-stack" data-filter-layer="true">
              <div className={openDrawer ? 'filter-row filter-row--attached' : 'filter-row'}>
                {hasActiveFilters && (
                  <div className="filter-row__sticky">
                    <button
                      type="button"
                      className="filter-reset-pill"
                      onClick={resetFilters}
                      title="Reset filters"
                      aria-label="Reset filters"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                )}
                <div className="filter-row__scroll-shell">
                  <div className="filter-row__scroll">
                    <button
                      type="button"
                      className={
                        selectedDay === 'All days'
                          ? 'filter-pill filter-chip'
                          : 'filter-pill filter-chip filter-chip--light'
                      }
                      onClick={() =>
                        setOpenDrawer((prev) => (prev === 'day' ? null : 'day'))
                      }
                      aria-expanded={openDrawer === 'day'}
                      aria-haspopup="dialog"
                    >
                      <span className="filter-pill__label">
                        {selectedDay === 'All days' ? 'All days' : selectedDay}
                      </span>
                      <ChevronDown size={14} className="filter-pill__icon" />
                    </button>
                    <button
                      type="button"
                      className="filter-pill filter-chip"
                      style={selectedStagePillStyle ?? undefined}
                      onClick={() =>
                        setOpenDrawer((prev) => (prev === 'stage' ? null : 'stage'))
                      }
                      aria-expanded={openDrawer === 'stage'}
                      aria-haspopup="dialog"
                    >
                      <span className="filter-pill__label">
                        {selectedStage === 'All stages' ? 'All stages' : selectedStage}
                      </span>
                      <ChevronDown size={14} className="filter-pill__icon" />
                    </button>
                    {authUser && (
                      <>
                        <button
                          type="button"
                          className={
                            showFavoritesOnly
                              ? 'filter-pill filter-chip favorites-pill favorites-pill--active'
                              : 'filter-pill filter-chip favorites-pill'
                          }
                          onClick={() => {
                            setShowFavoritesOnly((prev) => {
                              const nextValue = !prev;
                              if (nextValue) {
                                setSelectedDay('All days');
                                setSelectedStage('All stages');
                                setQuery('');
                                setHasAutoExpandedSearchScope(false);
                                setOpenDrawer(null);
                                setShowTribeOnly(false);
                              }
                              return nextValue;
                            });
                          }}
                        >
                          <StarIcon size={14} />
                          <span className="filter-pill__label">Favorites</span>
                        </button>
                        {tribe && (
                          <button
                            type="button"
                            className={
                              showTribeOnly
                                ? 'filter-pill filter-chip favorites-pill favorites-pill--active'
                                : 'filter-pill filter-chip favorites-pill'
                            }
                            onClick={() => {
                              setShowTribeOnly((prev) => {
                                const nextValue = !prev;
                                if (nextValue) {
                                  setSelectedDay('All days');
                                  setSelectedStage('All stages');
                                  setQuery('');
                                  setHasAutoExpandedSearchScope(false);
                                  setOpenDrawer(null);
                                  setShowFavoritesOnly(false);
                                }
                                return nextValue;
                              });
                            }}
                          >
                            <UsersIcon size={14} />
                            <span className="filter-pill__label">Tribe</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {openDrawer === 'day' && (
                <div
                  className="filter-drawer filter-drawer--attached"
                  role="dialog"
                  aria-label="Choose a day"
                  data-filter-layer="true"
                >
                  <div className="filter-drawer__inner">
                    <button
                      type="button"
                      className={
                        selectedDay === 'All days'
                          ? 'filter-badge filter-chip filter-chip--light filter-badge--active'
                          : 'filter-badge filter-chip'
                      }
                      onClick={() => {
                        setSelectedDay('All days');
                        setOpenDrawer(null);
                      }}
                    >
                      All days
                    </button>
                    {days.map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={
                          selectedDay === day
                            ? 'filter-badge filter-chip filter-chip--light filter-badge--active'
                            : 'filter-badge filter-chip'
                        }
                        onClick={() => {
                          setSelectedDay(day);
                          setOpenDrawer(null);
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {openDrawer === 'stage' && (
                <div
                  className="filter-drawer filter-drawer--attached"
                  role="dialog"
                  aria-label="Choose a stage"
                  data-filter-layer="true"
                >
                  <div className="filter-drawer__inner">
                    <button
                      type="button"
                      className={
                        selectedStage === 'All stages'
                          ? 'filter-badge filter-chip filter-chip--light filter-badge--active'
                          : 'filter-badge filter-chip'
                      }
                      onClick={() => {
                        setSelectedStage('All stages');
                        setOpenDrawer(null);
                      }}
                    >
                      All stages
                    </button>
                    {stages.map((stage) => {
                      const theme = getStageTheme(stage);
                      return (
                        <StageBadge
                          key={stage}
                          label={stage}
                          active={selectedStage === stage}
                          onClick={() => {
                            setSelectedStage(stage);
                            setOpenDrawer(null);
                          }}
                          theme={theme}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {view !== 'profileSettings' && (
        <main className={view === 'lineup' ? 'page page--lineup' : 'page'}>
          {view === 'lineup' && (
            <LineupView
              groupedEntries={groupedVisibleEntries}
              entries={browseableEntries}
              favorites={favoriteIds}
              toggleFavorite={toggleFavorite}
              showTribeOnly={showTribeOnly}
              tribeLikesByEntryId={tribeLikesByEntryId}
            />
          )}
          {view === 'search' &&
            (query.trim() ? (
              <LineupView
                groupedEntries={groupedSearchEntries}
                entries={browseableEntries}
                favorites={favoriteIds}
                toggleFavorite={toggleFavorite}
                tribeLikesByEntryId={tribeLikesByEntryId}
              />
            ) : (
              <EmptyState text="Start typing to search the lineup" />
            ))}
          {view === 'reviews' && (
            <ReviewsView
              reviewFavorites={filteredReviewFavorites}
              entries={browseableEntries}
              favorites={favoriteIds}
              toggleFavorite={toggleFavorite}
              removeReviewFavorite={removeReviewFavorite}
            />
          )}
          {view === 'tribe' && (
            <TribeView
              tribe={tribe}
              isBusy={isTribeBusy}
              isHydrating={!isTribeReady}
              onCreateTribe={handleCreateTribe}
              onJoinTribe={handleJoinTribe}
              onLeaveTribe={handleLeaveTribe}
            />
          )}
        </main>
      )}
      {view === 'profileSettings' && (
        <ProfileSettingsView
          user={authUser}
          profile={profile}
          hidePastEvents={hidePastEvents}
          hideUndatedEvents={hideUndatedEvents}
          lineups={lineupSources}
          selectedLineupKey={selectedLineupKey}
          onSelectLineup={(lineupKey) => {
            setSelectedLineupKey(lineupKey);
            // Always reset to "All days" when changing the lineup
            setSelectedDay('All days');
            setSelectedStage('All stages');
            setQuery('');
            setShowFavoritesOnly(false);
            setShowTribeOnly(false);
            setHasAutoExpandedSearchScope(false);
          }}
          onBack={() => setView('lineup')}
          onHidePastEventsChange={setHidePastEvents}
          onHideUndatedEventsChange={setHideUndatedEvents}
          onProfileUpdated={(nextProfile) => setProfile(nextProfile)}
          onSignedOut={() => {
            clearCachedAccount(authUser?.id ?? lastAuthenticatedUserIdRef.current);
            writeLastAuthenticatedUserId(null);
            lastAuthenticatedUserIdRef.current = null;
            hasRemoteAccountBundleRef.current = false;
            lastSyncedFavoritesRef.current = serializeFavoriteItems([]);
            setAuthUser(null);
            setProfile(null);
            setTribe(null);
            setIsTribeReady(true);
            setFavoriteItems([]);
            setShowTribeOnly(false);
            setView('lineup');
          }}
        />
      )}
      {/* Bottom navigation visible on mobile only */}
      {view !== 'profileSettings' && (
        <nav className="bottom-nav">
          <button
            type="button"
            className={view === 'lineup' ? 'active' : ''}
            onClick={handleLineupNav}
          >
            <span className="bottom-nav__icon-slot">
              <span className="bottom-nav__icon-pill">
                <MusicIcon size={20} />
              </span>
            </span>
            <span>Line‑up</span>
          </button>
          <button
            type="button"
            className={view === 'reviews' ? 'active' : ''}
            onClick={handleReviewsNav}
          >
            <span className="bottom-nav__icon-slot">
              <span className="bottom-nav__icon-pill">
                <StarIcon size={20} />
              </span>
              {reviewCount > 0 && <span className="bottom-nav__badge">{reviewCount}</span>}
            </span>
            <span>Reviews</span>
          </button>
          <button
            type="button"
            className={view === 'tribe' ? 'active' : ''}
            onClick={handleTribeNav}
          >
            <span className="bottom-nav__icon-slot">
              <span className="bottom-nav__icon-pill">
                <UsersIcon size={20} />
              </span>
            </span>
            <span>Tribe</span>
          </button>
          <button
            type="button"
            className={isSearchView ? 'active' : ''}
            onClick={() => {
              openSearchMode();
            }}
          >
            <span className="bottom-nav__icon-slot">
              <span className="bottom-nav__icon-pill">
                <Search size={22} />
              </span>
            </span>
            <span>Search</span>
          </button>
        </nav>
      )}
      <AuthModal
        open={isAuthModalOpen}
        defaultTab={authDefaultTab}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
}
