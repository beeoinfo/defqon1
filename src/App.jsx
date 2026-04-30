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
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  MusicNoteIcon,
  StarIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import AuthModal from '@/components/AuthModal';
import BackToTop from '@/components/BackToTop';
import EmptyState from '@/components/EmptyState';
import Page from '@/components/layout/Page';
import View from '@/components/layout/View';
import Badge from '@/components/primitives/Badge';
import useAnimatedPageStack from '@/hooks/useAnimatedPageStack';
import useDocumentScrollLock from '@/hooks/useDocumentScrollLock';
import {
  filterExpiredEntries,
  filterExpiredReviewFavorites,
  filterEntries,
  filterUndatedEntries,
  filterUndatedReviewFavorites,
  getDays,
  getStages,
  groupEntriesByDayAndStage,
  hasScheduledDate,
  loadBetaFeaturesPreference,
  loadHidePastEventsPreference,
  loadHideUndatedEventsPreference,
  loadViewPreferences,
  reconcileFavoriteItemsWithEntries,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveBetaFeaturesPreference,
  saveHidePastEventsPreference,
  saveHideUndatedEventsPreference,
  saveViewPreferences,
  upsertFavoriteEntry,
  validateLineupPayload,
} from './lib/lineup';
import {
  getHistoryPageStack,
  pushHistoryPageStackState,
  replaceHistoryPageStackState,
  syncPageStackIdRef,
} from './lib/pageHistory';
import {
  getNextPageStackOnClose,
  getNextPageStackOnOpen,
} from './lib/pageStack';
import { getPresetAvatarUrl, resolveProfileAvatarUrl } from './lib/presetAvatars';
import {
  createCurrentUserTribe,
  getCurrentUser,
  isSupabaseConfigured,
  joinCurrentUserTribeByCode,
  leaveCurrentUserTribe,
  loadAccountBundle,
  loadTribeBundle,
  normalizeTribeCode,
  supabase,
  syncFavoriteSnapshots,
  updateCurrentUserTribeName,
} from './lib/supabase';
import { getCanonicalStageName, getStageTheme } from './lib/stageThemes';
import { PAGE_DEFINITIONS } from './page/pageDefinitions';
import { getUrlForView, resolveRoute } from './routes/AppRoutes';
import UiThemeScope from './theme/UiThemeScope';
import LineUpView from './views/LineUpView';
import MapsView from './views/MapsView';
import ReviewsView from './views/ReviewsView';
import StorybookView from './views/StorybookView';
import TribeView from './views/TribeView';

const VIEW_COMPONENTS = {
  lineup: LineUpView,
  maps: MapsView,
  reviews: ReviewsView,
  tribe: TribeView,
};

const ACCOUNT_CACHE_KEY_PREFIX = 'account-cache:v1:';
const LAST_AUTHENTICATED_USER_ID_KEY = 'last-authenticated-user-id:v1';
const PENDING_TRIBE_INVITE_KEY = 'pending-tribe-invite:v1';

const getAccountCacheKey = (userId) => `${ACCOUNT_CACHE_KEY_PREFIX}${userId}`;

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
    members: [],
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

          return {
            ...artist,
            daySlug: day.daySlug,
            dayOrder: day.dayOrder,
            stageOrder: stage.stageOrder ?? stageIndex + 1,
            stage: stage.stageName ?? stage.stage ?? 'Unknown stage',
            stageSlug: stage.stageSlug,
            stageCanonical: stage.stageCanonical,
            stageColor: stage.stageColor ?? artist.stageColor ?? null,
            artistOrder: artist.artistOrder ?? artistIndex + 1,
            artistName,
            artistRaw: artist.artistRaw ?? artistName,
            timeLabel: artist.timeLabel ?? null,
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

const formatLineupLabel = (path) => {
  const fileName = path.split('/').pop() ?? path;
  const match = fileName.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_defqon_lineup\.json$/);

  if (!match) {
    return fileName;
  }

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} - ${hour}:${minute}`;
};

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
    mapLayers: extractLineupMapLayers(lineupModules[key]),
    isLatest: key === latestKey,
  }));

for (const lineupSource of lineupSources) {
  if (lineupSource.entries.length > 0) {
    validateLineupPayload(lineupSource.entries);
  }
}

const AppBaseView = memo(({
  activeView,
  viewPropsByView,
  navbarItems,
  onOpenView,
  onOpenSearch,
  onOpenSettings,
  headerTransitionState,
  isHidden,
  profileName,
  profileSubtitle,
  profileImageSrc,
}) => {
  const ActiveViewComponent = VIEW_COMPONENTS[activeView];

  if (!ActiveViewComponent) {
    return null;
  }

  return (
    <View
      navbar={navbarItems}
      brandTitle="DEFQON.1"
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileImageSrc={profileImageSrc}
      activeView={activeView}
      onOpenView={onOpenView}
      onOpenSearch={onOpenSearch}
      onUserClick={onOpenSettings}
      headerTransitionState={headerTransitionState}
      isHidden={isHidden}
      className={`dq-app-view--${activeView}`}
    >
      <ActiveViewComponent {...(viewPropsByView[activeView] ?? {})} />
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
  isHidden,
  transitionState,
  pagePropsByType,
}) => {
  const pageDefinition = PAGE_DEFINITIONS[page.type];

  if (!pageDefinition) {
    return null;
  }

  const PageContent = pageDefinition.Component;
  const HeaderContent = pageDefinition.HeaderContentComponent;
  const pageProps = pagePropsByType[page.type] ?? {};

  return (
    <Page
      title={pageDefinition.title}
      onClose={() => onClosePage(page.id)}
      onOpenPage={onOpenPage}
      onOpenView={onOpenView}
      headerContent={HeaderContent ? <HeaderContent {...pageProps} onClosePage={() => onClosePage(page.id)} /> : null}
      showFooter={pageDefinition.showFooter !== false}
      wideHeaderContent={pageDefinition.wideHeaderContent === true}
      hideHeaderBrand={pageDefinition.hideHeaderBrand === true}
      showCloseButton={pageDefinition.showCloseButton !== false}
      inlineCloseButton={pageDefinition.inlineCloseButton === true}
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
  const [activeView, setActiveView] = useState(initialRoute.view);
  const [pageStack, setPageStack] = useState(initialPageStack);
  const {
    renderedPageStack,
    hasRenderedPages,
    shouldHideBaseView,
    topPageTransitionState,
    getIsPageHidden,
  } = useAnimatedPageStack(pageStack);
  const [selectedLineupKey, setSelectedLineupKey] = useState(latestKey);
  const [selectedDay, setSelectedDay] = useState(
    () => loadViewPreferences()?.selectedDay || 'All days'
  );
  const [selectedStage, setSelectedStage] = useState(
    () => loadViewPreferences()?.selectedStage || 'All stages'
  );
  const [query, setQuery] = useState('');
  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(() => loadBetaFeaturesPreference());
  const [hidePastEvents, setHidePastEvents] = useState(() => loadHidePastEventsPreference());
  const [hideUndatedEvents, setHideUndatedEvents] = useState(() => loadHideUndatedEventsPreference());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [favoriteItems, setFavoriteItems] = useState(() => bootAccount?.favorites ?? []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTribeOnly, setShowTribeOnly] = useState(false);
  const activeHydrationIdRef = useRef(0);
  const authHydrationTimeoutRef = useRef(0);
  const lastAuthenticatedUserIdRef = useRef(bootUserId);
  const hasRemoteAccountBundleRef = useRef(false);
  const lastSyncedFavoritesRef = useRef(serializeFavoriteItems(bootAccount?.favorites ?? []));
  const lastHydratedAuthKeyRef = useRef(bootUserId ? `user:${bootUserId}` : 'guest');
  const hydrateAccountRef = useRef(null);
  const [authUser, setAuthUser] = useState(() => (bootUserId ? { id: bootUserId } : null));
  const [profile, setProfile] = useState(() => bootAccount?.profile ?? null);
  const [tribe, setTribe] = useState(() => bootAccount?.tribe ?? null);
  const [isTribeReady, setIsTribeReady] = useState(() => bootAccount !== null);
  const [isTribeBusy, setIsTribeBusy] = useState(false);
  const [pendingTribeInviteCode, setPendingTribeInviteCode] = useState(() =>
    readPendingTribeInviteCode()
  );
  const [tribeInviteAlert, setTribeInviteAlert] = useState('');
  const [isAccountReady, setIsAccountReady] = useState(!isSupabaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  const [pendingAction, setPendingAction] = useState(null);
  const attemptedInviteJoinKeyRef = useRef('');

  useDocumentScrollLock(hasRenderedPages);

  const selectedLineup = useMemo(
    () => lineupSources.find((lineup) => lineup.key === selectedLineupKey) ?? lineupSources[0] ?? null,
    [selectedLineupKey]
  );
  const selectedEntries = useMemo(() => selectedLineup?.entries ?? [], [selectedLineup]);
  const selectedMapLayers = useMemo(() => selectedLineup?.mapLayers ?? [], [selectedLineup]);
  const activeMapLayers =
    selectedMapLayers.length > 0
      ? selectedMapLayers
      : lineupSources.find((lineup) => lineup.mapLayers.length > 0)?.mapLayers ?? [];
  const isLatestLineupSelected = selectedLineup?.isLatest ?? false;
  const shouldHidePastEvents = hidePastEvents && isLatestLineupSelected;
  const favoritesReadOnly = !isLatestLineupSelected;
  const archiveLineupNotice =
    'You are browsing an older line-up snapshot in read-only mode, so favorites cannot be added, removed or updated here. Switch back to the latest snapshot in Settings to edit them again.';
  const entriesById = useMemo(
    () => new Map(selectedEntries.map((entry) => [entry.id, entry])),
    [selectedEntries]
  );
  const deferredFavoriteItems = useDeferredValue(favoriteItems);
  const favoriteResolution = useMemo(
    () => resolveFavoriteItems(selectedEntries, deferredFavoriteItems),
    [selectedEntries, deferredFavoriteItems]
  );
  const favoriteIdSet = useMemo(
    () => new Set(favoriteResolution.ids),
    [favoriteResolution]
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
  const reviewCount = isLatestLineupSelected ? visibleReviewFavorites.length : 0;
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

    const entriesByHash = new Map(selectedEntries.map((entry) => [entry.hash, entry]));
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
          const entryById = entriesById.get(favorite.id);
          const hasChangedHash =
            favorite.hash &&
            entryById.hash &&
            favorite.hash !== entryById.hash;

          if (!hasChangedHash || !hasScheduledDate(favorite)) {
            matchedEntry = entryById;
          }
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
          username,
          avatarUrl,
          isCurrentUser: member.userId === authUser?.id,
        });
        likesByEntryId.set(matchedEntry.id, currentLikes);
      });
    });

    return likesByEntryId;
  }, [authUser, entriesById, selectedEntries, tribe]);

  const tribeLikedEntryIds = useMemo(
    () => new Set(Array.from(tribeLikesByEntryId.keys())),
    [tribeLikesByEntryId]
  );
  const days = useMemo(() => getDays(browseableEntries), [browseableEntries]);
  const stages = useMemo(
    () => getStages(browseableEntries, selectedDay),
    [browseableEntries, selectedDay]
  );
  const stageColorsByName = useMemo(() => {
    const colorsByName = new Map();

    browseableEntries.forEach((entry) => {
      const stageName = entry.stageCanonical ?? getCanonicalStageName(entry.stage);

      if (stageName && entry.stageColor && !colorsByName.has(stageName)) {
        colorsByName.set(stageName, entry.stageColor);
      }
    });

    return colorsByName;
  }, [browseableEntries]);
  const baseFilteredEntries = useMemo(
    () =>
      filterEntries(browseableEntries, {
        query: '',
        day: selectedDay,
        stage: selectedStage,
      }),
    [browseableEntries, selectedDay, selectedStage]
  );
  const visibleEntries = useMemo(() => {
    let nextEntries = baseFilteredEntries;

    if (showTribeOnly) {
      nextEntries = nextEntries.filter((entry) => tribeLikedEntryIds.has(entry.id));
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
    tribeLikedEntryIds,
  ]);
  const groupedVisibleEntries = useMemo(
    () => groupEntriesByDayAndStage(visibleEntries),
    [visibleEntries]
  );
  const searchEntries = useMemo(
    () =>
      query.trim()
        ? filterEntries(browseableEntries, {
            query,
            day: 'All days',
            stage: 'All stages',
          })
        : [],
    [browseableEntries, query]
  );
  const groupedSearchEntries = useMemo(
    () => (query.trim() ? groupEntriesByDayAndStage(searchEntries) : {}),
    [query, searchEntries]
  );

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
      const nextPageStack = getHistoryPageStack({
        historyState: event.state,
        pageDefinitions: PAGE_DEFINITIONS,
      });

      pageStackRef.current = nextPageStack;
      setActiveView(nextRoute.view);
      setPageStack(nextPageStack);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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

    pushHistoryPageStackState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const closePage = useCallback((pageId) => {
    const closingPage = pageStackRef.current.find((page) => page.id === pageId) ?? null;
    const nextStack = getNextPageStackOnClose({
      currentStack: pageStackRef.current,
      pageId,
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    pushHistoryPageStackState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
    });

    if (closingPage?.type === 'search') {
      setQuery('');
    }

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const openView = useCallback((view) => {
    if (view === activeView && pageStack.length === 0) {
      return;
    }

    pushHistoryPageStackState({
      url: getUrlForView(view),
      pageStack: [],
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

  const resetBrowseState = useCallback(({ clearQuery = true } = {}) => {
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);

    if (clearQuery) {
      setQuery('');
    }
  }, []);

  const openSearch = useCallback(() => {
    setQuery('');
    openPage('search');
  }, [openPage]);

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

  const handleMapsNav = useCallback(() => {
    if (!betaFeaturesEnabled) {
      return;
    }

    startTransition(() => {
      resetBrowseState();
    });
    openView('maps');
  }, [betaFeaturesEnabled, openView, resetBrowseState]);

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

  const handleTribeNav = useCallback(() => {
    if (!authUser) {
      requestAuth({ type: 'open-tribe' });
      return;
    }

    startTransition(() => {
      resetBrowseState();
    });
    openView('tribe');
  }, [authUser, openView, requestAuth, resetBrowseState]);

  useEffect(() => {
    saveViewPreferences({ selectedDay, selectedStage });
  }, [selectedDay, selectedStage]);

  useEffect(() => {
    saveBetaFeaturesPreference(betaFeaturesEnabled);
  }, [betaFeaturesEnabled]);

  useEffect(() => {
    saveHidePastEventsPreference(hidePastEvents);
  }, [hidePastEvents]);

  useEffect(() => {
    saveHideUndatedEventsPreference(hideUndatedEvents);
  }, [hideUndatedEvents]);

  useEffect(() => {
    if (!betaFeaturesEnabled && activeView === 'maps') {
      replaceViewInPlace('lineup');
    }
  }, [activeView, betaFeaturesEnabled, replaceViewInPlace]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (selectedDay !== 'All days' && !days.includes(selectedDay)) {
      setSelectedDay('All days');
    }
  }, [days, selectedDay]);

  useEffect(() => {
    if (selectedStage !== 'All stages' && !stages.includes(selectedStage)) {
      setSelectedStage('All stages');
    }
  }, [selectedStage, stages]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const inviteCode = normalizeTribeCode(searchParams.get('tribe'));

    if (!inviteCode) {
      return;
    }

    const nextCode = writePendingTribeInviteCode(inviteCode);
    setPendingTribeInviteCode(nextCode);
    searchParams.delete('tribe');

    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;

    replaceHistoryPageStackState({
      url: nextUrl,
      pageStack: pageStackRef.current,
    });
  }, []);

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
      setIsAccountReady(false);
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
          setIsTribeReady(true);
          setFavoriteItems([]);
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
          setTribe(cachedAccount.tribe ?? null);
          setIsTribeReady(Boolean(cachedAccount.tribe));
        } else {
          setProfile(buildOptimisticProfile(currentUser));
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
    setShowTribeOnly(false);
  }, [isLatestLineupSelected]);

  useEffect(() => {
    if (!authUser || !isAccountReady || !pendingTribeInviteCode || tribe || isTribeBusy) {
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
        replaceViewInPlace('tribe');
        writePendingTribeInviteCode('');
        setPendingTribeInviteCode('');
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsTribeBusy(false);
      });
  }, [authUser, isAccountReady, isTribeBusy, pendingTribeInviteCode, replaceViewInPlace, tribe]);

  const clearPendingTribeInvite = useCallback(() => {
    writePendingTribeInviteCode('');
    setPendingTribeInviteCode('');
    attemptedInviteJoinKeyRef.current = '';
  }, []);

  useEffect(() => {
    if (!pendingTribeInviteCode || !tribe) {
      return;
    }

    if (normalizeTribeCode(tribe.code) === normalizeTribeCode(pendingTribeInviteCode)) {
      clearPendingTribeInvite();
      return;
    }

    clearPendingTribeInvite();
    setTribeInviteAlert('Leave your current tribe before joining another one.');
    replaceViewInPlace('tribe');
  }, [clearPendingTribeInvite, pendingTribeInviteCode, replaceViewInPlace, tribe]);

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
      openView('tribe');
    }

    if (pendingAction.type === 'toggle-favorite' && isLatestLineupSelected) {
      const entry = entriesById.get(pendingAction.entryId);

      if (entry) {
        setFavoriteItems((previousItems) => {
          const isAlreadyFavorite = previousItems.some(
            (item) =>
              (item.hash && entry.hash && item.hash === entry.hash) ||
              (
                item.id === entry.id &&
                (!item.hash || !entry.hash || item.hash === entry.hash || !hasScheduledDate(item))
              )
          );

          if (isAlreadyFavorite) {
            return removeFavoriteByEntryId(previousItems, entry.id, entry.hash);
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
  }, [authUser, entriesById, isAccountReady, isLatestLineupSelected, openView, pendingAction, resetBrowseState]);

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
        (item) =>
          (item.hash && entry.hash && item.hash === entry.hash) ||
          (
            item.id === entry.id &&
            (!item.hash || !entry.hash || item.hash === entry.hash || !hasScheduledDate(item))
          )
      );

      if (isAlreadyFavorite) {
        return removeFavoriteByEntryId(previousItems, entry.id, entry.hash);
      }

      return upsertFavoriteEntry(previousItems, entry);
    });
  }, [authUser, entriesById, favoritesReadOnly, requestAuth]);

  const removeReviewFavorite = useCallback((favoriteKey) => {
    if (favoritesReadOnly || !authUser) {
      return;
    }

    setFavoriteItems((previousItems) => removeFavoriteByKey(previousItems, favoriteKey));
  }, [authUser, favoritesReadOnly]);

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
    const nextLineupExists = lineupSources.some((lineup) => lineup.key === nextKey);

    if (!nextLineupExists) {
      return;
    }

    setSelectedLineupKey(nextKey);
  }, []);

  const handleProfileUpdated = useCallback((nextProfile) => {
    setProfile(nextProfile);
  }, []);

  const handleSignedOut = useCallback(() => {
    setPendingAction(null);
    setIsAuthModalOpen(false);
    setTribeInviteAlert('');
    resetBrowseState();
    pageStackRef.current = [];
    setPageStack([]);
    setActiveView('lineup');
    replaceHistoryPageStackState({
      url: getUrlForView('lineup'),
      pageStack: [],
    });
  }, [resetBrowseState]);

  const dayDrawerOptions = useMemo(
    () => [
      {
        value: '__all-days__',
        label: 'All days',
        reset: true,
      },
      ...days.map((day) => ({
        value: day,
        label: day,
      })),
    ],
    [days]
  );

  const stageDrawerOptions = useMemo(
    () => [
      {
        value: '__all-stages__',
        label: 'All stages',
        reset: true,
      },
      ...stages.map((stage) => ({
        value: stage,
        label: stage,
        color: stageColorsByName.get(stage) ?? getStageTheme(stage).accent,
      })),
    ],
    [stageColorsByName, stages]
  );

  const lineupFilterBar = useMemo(() => ({
    value: {
      day: selectedDay === 'All days' ? null : selectedDay,
      stage: selectedStage === 'All stages' ? null : selectedStage,
      favorites: showFavoritesOnly,
      tribe: showTribeOnly,
    },
    onChange: (nextValue) => {
      const nextDay = nextValue.day ?? 'All days';
      const nextStage = nextValue.stage ?? 'All stages';
      const didEnableFavorites = Boolean(nextValue.favorites) && !showFavoritesOnly;
      const didEnableTribe = Boolean(nextValue.tribe) && !showTribeOnly;
      const nextFavoritesOnly = didEnableTribe ? false : Boolean(nextValue.favorites);
      const nextTribeOnly = didEnableFavorites ? false : Boolean(nextValue.tribe);

      setSelectedDay(nextDay);
      setSelectedStage(nextStage);
      setShowFavoritesOnly(nextFavoritesOnly);
      setShowTribeOnly(nextTribeOnly);
      setQuery('');
    },
    onReset: () => {
      resetBrowseState({ clearQuery: true });
    },
    hideOnScroll: true,
    choices: [
      ...(isLatestLineupSelected && authUser && tribe ? [{
        id: 'tribe',
        label: 'My tribe',
        icon: UsersIcon,
        fillOnPress: true,
      }] : []),
      ...(isLatestLineupSelected && authUser ? [{
        id: 'favorites',
        label: 'My favorites',
        icon: StarIcon,
        fillOnPress: true,
      }] : []),
    ],
    drawers: [
      {
        id: 'day',
        label: 'All days',
        options: dayDrawerOptions,
      },
      {
        id: 'stage',
        label: 'All stages',
        options: stageDrawerOptions,
      },
    ],
  }), [
    authUser,
    dayDrawerOptions,
    isLatestLineupSelected,
    resetBrowseState,
    selectedDay,
    selectedStage,
    showFavoritesOnly,
    showTribeOnly,
    stageColorsByName,
    stageDrawerOptions,
    tribe,
  ]);

  const navbarItems = useMemo(
    () => [
      {
        id: 'lineup',
        label: 'Line-up',
        icon: MusicNoteIcon,
        active: activeView === 'lineup',
        onClick: handleLineupNav,
      },
      ...(betaFeaturesEnabled ? [{
        id: 'maps',
        label: 'Maps',
        icon: MapTrifoldIcon,
        active: activeView === 'maps',
        onClick: handleMapsNav,
      }] : []),
      {
        id: 'reviews',
        label: 'Reviews',
        icon: StarIcon,
        active: activeView === 'reviews',
        badge: authUser && reviewCount > 0 ? <Badge variant="count">{reviewCount}</Badge> : null,
        onClick: handleReviewsNav,
      },
      {
        id: 'tribe',
        label: 'Tribe',
        icon: UsersIcon,
        active: activeView === 'tribe',
        onClick: handleTribeNav,
      },
      {
        id: 'search',
        label: 'Search',
        icon: MagnifyingGlassIcon,
        ariaLabel: 'Open search',
        title: 'Open search',
        togglesActive: false,
        showIconDesktop: true,
        onClick: openSearch,
      },
    ],
    [
      activeView,
      authUser,
      betaFeaturesEnabled,
      handleLineupNav,
      handleMapsNav,
      handleReviewsNav,
      handleTribeNav,
      openSearch,
      reviewCount,
    ]
  );

  const profileName = useMemo(() => {
    if (!authUser) {
      return 'Login';
    }

    const firstName = String(activeProfile?.first_name ?? '').trim();
    const lastName = String(activeProfile?.last_name ?? '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    return String(activeProfile?.username ?? '').trim() || 'Your profile';
  }, [activeProfile, authUser]);

  const profileSubtitle = useMemo(() => {
    if (!authUser) {
      return 'Sync favorites and tribe';
    }

    const username = String(activeProfile?.username ?? '').trim();
    return username ? `@${username}` : 'Account';
  }, [activeProfile, authUser]);

  const profileImageSrc = useMemo(() => {
    if (!authUser || !activeProfile) {
      return '';
    }

    return resolveProfileAvatarUrl(activeProfile);
  }, [activeProfile, authUser]);

  const viewPropsByView = useMemo(() => ({
    lineup: {
      groupedEntries: groupedVisibleEntries,
      entries: visibleEntries,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      showTribeOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
      filterBar: lineupFilterBar,
    },
    maps: {
      mapLayers: activeMapLayers,
    },
    reviews: {
      reviewFavorites: isLatestLineupSelected ? visibleReviewFavorites : [],
      favoriteIdSet,
      toggleFavorite,
      removeReviewFavorite,
      canManageFavorites: !favoritesReadOnly,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
      isAuthenticated: Boolean(authUser),
    },
    tribe: {
      user: authUser,
      tribe,
      isBusy: isTribeBusy,
      isHydrating: authUser ? !isTribeReady : false,
      pendingInviteCode: pendingTribeInviteCode,
      inviteConflictMessage: tribeInviteAlert,
      onCreateTribe: handleCreateTribe,
      onJoinTribe: handleJoinTribe,
      onLeaveTribe: handleLeaveTribe,
      onRenameTribe: handleRenameTribe,
    },
  }), [
    archiveLineupNotice,
    authUser,
    activeMapLayers,
    favoriteIdSet,
    favoritesReadOnly,
    groupedVisibleEntries,
    handleCreateTribe,
    handleJoinTribe,
    handleLeaveTribe,
    handleRenameTribe,
    isTribeBusy,
    isTribeReady,
    isLatestLineupSelected,
    lineupFilterBar,
    pendingTribeInviteCode,
    removeReviewFavorite,
    showTribeOnly,
    toggleFavorite,
    tribe,
    tribeInviteAlert,
    tribeLikesByEntryId,
    visibleReviewFavorites,
    visibleEntries,
  ]);

  const pagePropsByType = useMemo(() => ({
    settings: {
      user: authUser,
      profile: activeProfile,
      betaFeaturesEnabled,
      hidePastEvents,
      hideUndatedEvents,
      lineups: lineupSources,
      selectedLineupKey,
      onSelectLineup: handleSelectLineup,
      onBetaFeaturesEnabledChange: setBetaFeaturesEnabled,
      onHidePastEventsChange: setHidePastEvents,
      onHideUndatedEventsChange: setHideUndatedEvents,
      onProfileUpdated: handleProfileUpdated,
      onSignedOut: handleSignedOut,
    },
    search: {
      query,
      onQueryChange: setQuery,
      groupedEntries: groupedSearchEntries,
      entries: searchEntries,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
    },
    about: {},
    roadmap: {},
    legal: {},
  }), [
    activeProfile,
    archiveLineupNotice,
    authUser,
    betaFeaturesEnabled,
    favoriteIdSet,
    favoritesReadOnly,
    groupedSearchEntries,
    handleProfileUpdated,
    handleSelectLineup,
    handleSignedOut,
    hidePastEvents,
    hideUndatedEvents,
    query,
    searchEntries,
    selectedLineupKey,
    toggleFavorite,
    tribeLikesByEntryId,
  ]);

  const baseViewHeaderTransitionState = useMemo(() => {
    if (!hasRenderedPages) {
      return 'open';
    }

    if (topPageTransitionState === 'entering') {
      return 'exiting';
    }

    if (topPageTransitionState === 'exiting') {
      return 'entering';
    }

    return 'covered';
  }, [hasRenderedPages, topPageTransitionState]);

  const baseView = useMemo(() => (
    <AppBaseView
      activeView={activeView}
      viewPropsByView={viewPropsByView}
      navbarItems={navbarItems}
      onOpenView={openView}
      onOpenSearch={openSearch}
      onOpenSettings={handleProfileButtonClick}
      headerTransitionState={baseViewHeaderTransitionState}
      isHidden={shouldHideBaseView}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileImageSrc={profileImageSrc}
    />
  ), [
    activeView,
    baseViewHeaderTransitionState,
    handleProfileButtonClick,
    navbarItems,
    openSearch,
    openView,
    profileImageSrc,
    profileName,
    profileSubtitle,
    shouldHideBaseView,
    viewPropsByView,
  ]);

  if (activeView === 'storybook') {
    return <StorybookView onOpenView={openView} />;
  }

  if (!selectedLineup) {
    return (
      <UiThemeScope>
        <EmptyState text="No lineup detected." />
      </UiThemeScope>
    );
  }

  return (
    <UiThemeScope>
      {baseView}

      {renderedPageStack.map((page, index) => (
        <AppPageLayer
          key={page.id}
          page={page}
          layerIndex={index}
          onClosePage={closePage}
          onOpenPage={openPage}
          onOpenView={openView}
          isHidden={getIsPageHidden(index)}
          transitionState={page.transitionState}
          pagePropsByType={pagePropsByType}
        />
      ))}

      <BackToTop />

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
  );
};

export default App;
