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
  ArrowLeftIcon,
  HeartBreakIcon,
  HeartIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  MusicNoteIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import AuthModal from '@/components/AuthModal';
import BackToTop from '@/components/BackToTop';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Page from '@/components/layout/Page';
import View from '@/components/layout/View';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import { SearchInput } from '@/components/primitives/forms';
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
  hasCompleteSchedule,
  hasScheduledDate,
  loadHidePastEventsPreference,
  loadHideUndatedEventsPreference,
  loadIgnoreSmallConflictsPreference,
  loadViewPreferences,
  reconcileFavoriteItemsWithEntries,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveHidePastEventsPreference,
  saveHideUndatedEventsPreference,
  saveIgnoreSmallConflictsPreference,
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
import {
  APP_DOCUMENT_TITLE,
  formatDocumentTitle,
  getTitleForView,
  getUrlForView,
  resolveRoute,
} from './routes/AppRoutes';
import { activeSiteAssets } from './sites/siteAssets';
import { activeSite } from './sites/siteDefinitions';
import { getSiteLineupModuleEntries } from './sites/siteLineupData';
import UiThemeScope from './theme/UiThemeScope';
import LineUpView from './views/LineUpView';
import MapsView from './views/MapsView';
import ReviewsView from './views/ReviewsView';
import StorybookView from './views/StorybookView';
import TimetableView from './views/TimetableView';

const VIEW_COMPONENTS = {
  lineup: LineUpView,
  maps: MapsView,
  reviews: ReviewsView,
  search: LineUpView,
  timetable: TimetableView,
};

const getHeaderModeForView = (view) => (view === 'search' ? 'search' : 'default');
const getSiteFaviconHref = () => `/${activeSite.slug}/${activeSite.assets.favicon}?site=${activeSite.slug}`;
const getComparableLabel = (value) => String(value ?? '').trim().toLowerCase();
const CONFLICT_OVERLAP_THRESHOLD = 0.25;
const getEntryTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
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

      const overlapDuration = Math.min(currentItem.endTimestamp, candidateItem.endTimestamp) -
        Math.max(currentItem.startTimestamp, candidateItem.startTimestamp);
      const largestDuration = Math.max(
        currentItem.endTimestamp - currentItem.startTimestamp,
        candidateItem.endTimestamp - candidateItem.startTimestamp
      );
      const hasMeaningfulOverlap = ignoreSmallConflicts
        ? largestDuration > 0 && overlapDuration > largestDuration * CONFLICT_OVERLAP_THRESHOLD
        : overlapDuration > 0;

      if (hasMeaningfulOverlap) {
        conflictingIds.add(currentItem.entry.id);
        conflictingIds.add(candidateItem.entry.id);
      }
    }
  });

  return conflictingIds;
};

const ACCOUNT_CACHE_KEY_PREFIX = `account-cache:v1:${activeSite.slug}:`;
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
          const stageName = stage.stageName ?? stage.stage ?? 'Unknown stage';
          const stageCanonical = getCanonicalStageName(stage.stageCanonical ?? stageName);

          return {
            ...artist,
            daySlug: String(day.daySlug ?? '').trim().toLowerCase(),
            dayOrder: day.dayOrder,
            stageOrder: stage.stageOrder ?? stageIndex + 1,
            stage: stageName,
            stageSlug: stage.stageSlug,
            stageCanonical,
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
  const match = fileName.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(?:.+_)?lineup\.json$/);

  if (!match) {
    return fileName;
  }

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} - ${hour}:${minute}`;
};

const lineupModuleEntries = getSiteLineupModuleEntries(activeSite);
const latestKey = lineupModuleEntries.at(-1)?.[0] ?? null;
const lineupSources = [...lineupModuleEntries]
  .reverse()
  .map(([key, moduleValue]) => ({
    key,
    label: formatLineupLabel(key),
    entries: extractLineupEntries(moduleValue),
    mapLayers: extractLineupMapLayers(moduleValue),
    isLatest: key === latestKey,
  }));

for (const lineupSource of lineupSources) {
  if (lineupSource.entries.length > 0) {
    validateLineupPayload(lineupSource.entries);
  }
}

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
  isHidden,
  profileName,
  profileSubtitle,
  profileImageSrc,
  brandLogoSrc,
}) => {
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
      closeHeaderButtonAriaLabel="Close search"
      onCloseHeaderContent={onCloseHeaderContent}
      headerTransitionState={headerTransitionState}
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
  const [viewRefreshKey, setViewRefreshKey] = useState(0);
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
  const [selectedLineupKey, setSelectedLineupKey] = useState(latestKey);
  const [selectedDay, setSelectedDay] = useState(
    () => loadViewPreferences()?.selectedDay || 'All days'
  );
  const [selectedStage, setSelectedStage] = useState(
    () => loadViewPreferences()?.selectedStage || 'All stages'
  );
  const [selectedTimetableDay, setSelectedTimetableDay] = useState(
    () => loadViewPreferences()?.selectedTimetableDay || ''
  );
  const [hidePastEvents, setHidePastEvents] = useState(() => loadHidePastEventsPreference());
  const [hideUndatedEvents, setHideUndatedEvents] = useState(() => loadHideUndatedEventsPreference());
  const [ignoreSmallConflicts, setIgnoreSmallConflicts] = useState(() =>
    loadIgnoreSmallConflictsPreference()
  );
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [favoriteItems, setFavoriteItems] = useState(() => bootAccount?.favorites ?? []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTribeOnly, setShowTribeOnly] = useState(false);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
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

  useEffect(() => () => {
    if (headerModeTransitionTimeoutRef.current) {
      window.clearTimeout(headerModeTransitionTimeoutRef.current);
    }

    if (headerModeOpenTimeoutRef.current) {
      window.clearTimeout(headerModeOpenTimeoutRef.current);
    }
  }, []);

  const selectedLineup = useMemo(
    () => lineupSources.find((lineup) => lineup.key === selectedLineupKey) ?? lineupSources[0] ?? null,
    [selectedLineupKey]
  );
  const selectedEntries = useMemo(() => selectedLineup?.entries ?? [], [selectedLineup]);
  const hasTimetableView = useMemo(
    () => selectedEntries.some((entry) => hasCompleteSchedule(entry)),
    [selectedEntries]
  );
  const defaultScheduleView = hasTimetableView ? 'timetable' : 'lineup';
  const selectedMapLayers = useMemo(() => selectedLineup?.mapLayers ?? [], [selectedLineup]);
  const hasMapsView = useMemo(
    () => selectedMapLayers.length > 0,
    [selectedMapLayers]
  );
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
    () => new Set(
      Array.from(tribeLikesByEntryId.entries())
        .filter(([, likes]) => likes.some((member) => !member.isCurrentUser))
        .map(([entryId]) => entryId)
    ),
    [tribeLikesByEntryId]
  );
  const tribeFilterEntryIds = useMemo(
    () => new Set([...tribeLikedEntryIds, ...favoriteIdSet]),
    [favoriteIdSet, tribeLikedEntryIds]
  );
  const days = useMemo(() => getDays(browseableEntries), [browseableEntries]);
  const timetableDays = useMemo(
    () => getDays(browseableEntries.filter((entry) => hasCompleteSchedule(entry))),
    [browseableEntries]
  );
  const defaultTimetableDay = timetableDays[0] ?? '';
  useEffect(() => {
    if (timetableDays.length === 0) {
      if (selectedTimetableDay) {
        setSelectedTimetableDay('');
      }

      return;
    }

    if (!timetableDays.some((day) => getComparableLabel(day) === getComparableLabel(selectedTimetableDay))) {
      setSelectedTimetableDay(timetableDays[0]);
    }
  }, [selectedTimetableDay, timetableDays]);
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
  const reviewCount = isLatestLineupSelected
    ? visibleReviewFavorites.length + favoriteTimetableConflictEntries.length
    : 0;
  const baseTimetableEntries = useMemo(
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
  const conflictingFavoriteEntryIds = useMemo(
    () => getConflictingFavoriteEntryIds(baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts),
    [baseTimetableEntries, favoriteIdSet, ignoreSmallConflicts]
  );
  const conflictCount = conflictingFavoriteEntryIds.size;
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

    pushHistoryPageStackState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const closePage = useCallback((pageId) => {
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

  const resetBrowseState = useCallback(() => {
    setSearchHeaderQuery('');
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setSelectedTimetableDay('');
    setShowFavoritesOnly(false);
    setShowTribeOnly(false);
    setShowConflictsOnly(false);
  }, []);

  const openHomeView = useCallback(() => {
    startTransition(() => {
      resetBrowseState();
      setViewRefreshKey((currentKey) => currentKey + 1);
    });

    const syncHistoryState = activeView === defaultScheduleView && pageStackRef.current.length === 0
      ? replaceHistoryPageStackState
      : pushHistoryPageStackState;

    syncHistoryState({
      url: getUrlForView(defaultScheduleView),
      pageStack: [],
    });

    pageStackRef.current = [];
    setPageStack([]);
    setActiveView(defaultScheduleView);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeView, defaultScheduleView, resetBrowseState]);

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
    saveViewPreferences({ selectedDay, selectedStage, selectedTimetableDay });
  }, [selectedDay, selectedStage, selectedTimetableDay]);

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
    setShowConflictsOnly(false);
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
        openSettings();
        writePendingTribeInviteCode('');
        setPendingTribeInviteCode('');
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsTribeBusy(false);
      });
  }, [authUser, isAccountReady, isTribeBusy, openSettings, pendingTribeInviteCode, tribe]);

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
    openSettings();
  }, [clearPendingTribeInvite, openSettings, pendingTribeInviteCode, tribe]);

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
    setActiveView(defaultScheduleView);
    replaceHistoryPageStackState({
      url: getUrlForView(defaultScheduleView),
      pageStack: [],
    });
  }, [defaultScheduleView, resetBrowseState]);

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
        color: stageColorsByName.get(getComparableLabel(stage)) ?? getStageTheme(stage).accent,
      })),
    ],
    [stageColorsByName, stages]
  );

  const timetableDayDrawerOptions = useMemo(
    () =>
      timetableDays.map((day, index) => ({
        value: day,
        label: day,
        defaultChecked: index === 0,
      })),
    [timetableDays]
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
      label: 'My favorites',
      icon: HeartIcon,
      fillOnPress: true,
      variant: 'likes',
    }] : []),
    ...(isLatestLineupSelected && authUser && tribe && hasTribeEntries ? [{
      id: 'tribe',
      label: 'My tribe',
      icon: UsersIcon,
      fillOnPress: true,
      variant: 'favorite',
    }] : []),
  ], [authUser, hasFavoriteEntries, hasTribeEntries, isLatestLineupSelected, tribe]);
  const lineupDrawers = useMemo(() => [
    ...(days.length > 1 ? [{
      id: 'day',
      label: 'All days',
      options: dayDrawerOptions,
    }] : []),
    ...(stages.length > 1 ? [{
      id: 'stage',
      label: 'All stages',
      options: stageDrawerOptions,
    }] : []),
  ], [dayDrawerOptions, days.length, stageDrawerOptions, stages.length]);

  const lineupFilterBar = useMemo(() => (lineupChoices.length > 0 || lineupDrawers.length > 0 ? {
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
    showFavoritesOnly,
    showTribeOnly,
  ]);

  const timetableChoices = useMemo(() => [
    ...(isLatestLineupSelected && authUser && conflictCount > 0 ? [{
      id: 'conflicts',
      label: 'Conflicts',
      icon: LightningIcon,
      fillOnPress: true,
      variant: 'favorite',
      tag: conflictCount,
      tagVariant: 'count',
      className: 'dq-ui-choice-button--floating-tag',
    }] : []),
    ...(isLatestLineupSelected && authUser && hasFavoriteEntries ? [{
      id: 'favorites',
      label: 'My favorites',
      icon: HeartIcon,
      fillOnPress: true,
      variant: 'likes',
    }] : []),
    ...(isLatestLineupSelected && authUser && tribe && hasTribeEntries ? [{
      id: 'tribe',
      label: 'My tribe',
      icon: UsersIcon,
      fillOnPress: true,
      variant: 'favorite',
    }] : []),
  ], [authUser, conflictCount, hasFavoriteEntries, hasTribeEntries, isLatestLineupSelected, tribe]);
  const timetableDrawers = useMemo(() => (timetableDayDrawerOptions.length > 1
    ? [{
        id: 'day',
        label: 'Day',
        options: timetableDayDrawerOptions,
      }]
    : []), [timetableDayDrawerOptions]);

  const timetableFilterBar = useMemo(() => (timetableChoices.length > 0 || timetableDrawers.length > 0 ? {
    value: {
      day: selectedTimetableDayLabel || null,
      favorites: showFavoritesOnly,
      conflicts: showConflictsOnly,
      tribe: showTribeOnly,
    },
    onChange: (nextValue) => {
      const nextDay = nextValue.day ?? defaultTimetableDay;
      const didEnableFavorites = Boolean(nextValue.favorites) && !showFavoritesOnly;
      const didEnableConflicts = Boolean(nextValue.conflicts) && !showConflictsOnly;
      const didEnableTribe = Boolean(nextValue.tribe) && !showTribeOnly;
      const nextFavoritesOnly =
        didEnableConflicts || didEnableTribe ? false : Boolean(nextValue.favorites);
      const nextConflictsOnly =
        didEnableFavorites || didEnableTribe ? false : Boolean(nextValue.conflicts);
      const nextTribeOnly =
        didEnableConflicts || didEnableFavorites ? false : Boolean(nextValue.tribe);

      setSelectedTimetableDay(nextDay);
      setShowFavoritesOnly(nextFavoritesOnly);
      setShowConflictsOnly(nextConflictsOnly);
      setShowTribeOnly(nextTribeOnly);
    },
    onReset: () => {
      setSelectedTimetableDay(defaultTimetableDay);
      setShowFavoritesOnly(false);
      setShowConflictsOnly(false);
      setShowTribeOnly(false);
    },
    resetButton: false,
    choices: timetableChoices,
    drawers: timetableDrawers,
  } : null), [
    defaultTimetableDay,
    selectedTimetableDayLabel,
    showConflictsOnly,
    showFavoritesOnly,
    showTribeOnly,
    timetableChoices,
    timetableDrawers,
  ]);

  const navbarItems = useMemo(
    () => [
      ...(!hasTimetableView ? [{
        id: 'lineup',
        label: 'Line-up',
        icon: MusicNoteIcon,
        active: activeView === 'lineup',
        onClick: handleLineupNav,
      }] : []),
      ...(hasTimetableView ? [{
        id: 'timetable',
        label: 'Timetable',
        icon: MusicNoteIcon,
        active: activeView === 'timetable',
        onClick: handleTimetableNav,
      }] : []),
      ...(hasMapsView ? [{
        id: 'maps',
        label: 'Maps',
        icon: MapTrifoldIcon,
        active: activeView === 'maps',
        onClick: handleMapsNav,
      }] : []),
      {
        id: 'reviews',
        label: 'Reviews',
        icon: HeartBreakIcon,
        active: activeView === 'reviews',
        badge: authUser && reviewCount > 0 ? <Badge variant="count">{reviewCount}</Badge> : null,
        togglesActive: Boolean(authUser),
        onClick: handleReviewsNav,
      },
      {
        id: 'search',
        label: 'Search',
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
        ariaLabel="Previous view"
        size="lg"
        radius="rounded"
        onClick={handleReturnFromSearch}
      />
      <SearchInput
        ariaLabel="Search"
        value={searchHeaderQuery}
        onChange={(event) => setSearchHeaderQuery(event.target.value)}
        onClear={() => setSearchHeaderQuery('')}
        placeholder="Search artist, duo, show..."
      />
    </Box>
  ), [handleReturnFromSearch, searchHeaderQuery]);

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
    search: {
      groupedEntries: groupedSearchVisibleEntries,
      entries: searchVisibleEntries,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      showTribeOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
      filterBar: lineupFilterBar,
      stackDays: Boolean(searchHeaderQuery.trim()),
    },
    timetable: {
      entries: visibleTimetableEntries,
      selectedDay: selectedTimetableDayLabel,
      favoriteIdSet,
      toggleFavorite,
      canToggleFavorites: !favoritesReadOnly,
      tribeLikesByEntryId,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
      filterBar: timetableFilterBar,
    },
    maps: {
      mapLayers: selectedMapLayers,
    },
    reviews: {
      reviewFavorites: isLatestLineupSelected ? visibleReviewFavorites : [],
      conflictEntries: isLatestLineupSelected ? favoriteTimetableConflictEntries : [],
      favoriteIdSet,
      toggleFavorite,
      removeReviewFavorite,
      onOpenTimetableConflicts: handleOpenTimetableConflicts,
      tribeLikesByEntryId,
      ignoreSmallConflicts,
      canManageFavorites: !favoritesReadOnly,
      archiveNotice: favoritesReadOnly ? archiveLineupNotice : null,
      isAuthenticated: Boolean(authUser),
    },
  }), [
    archiveLineupNotice,
    authUser,
    favoriteIdSet,
    favoriteTimetableConflictEntries,
    favoritesReadOnly,
    groupedVisibleEntries,
    groupedSearchVisibleEntries,
    handleOpenTimetableConflicts,
    ignoreSmallConflicts,
    isLatestLineupSelected,
    lineupFilterBar,
    removeReviewFavorite,
    selectedMapLayers,
    selectedTimetableDayLabel,
    showTribeOnly,
    searchHeaderQuery,
    searchVisibleEntries,
    timetableFilterBar,
    toggleFavorite,
    tribeLikesByEntryId,
    visibleTimetableEntries,
    visibleReviewFavorites,
    visibleEntries,
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
      hidePastEvents,
      hideUndatedEvents,
      ignoreSmallConflicts,
      favoriteCount: favoriteItems.length,
      lineups: lineupSources,
      selectedLineupKey,
      onSelectLineup: handleSelectLineup,
      onHidePastEventsChange: setHidePastEvents,
      onHideUndatedEventsChange: setHideUndatedEvents,
      onIgnoreSmallConflictsChange: setIgnoreSmallConflicts,
      onResetFavorites: resetFavorites,
      onProfileUpdated: handleProfileUpdated,
      onSignedOut: handleSignedOut,
      onCreateTribe: handleCreateTribe,
      onJoinTribe: handleJoinTribe,
      onLeaveTribe: handleLeaveTribe,
      onRenameTribe: handleRenameTribe,
    },
    about: {},
    roadmap: {},
    legal: {},
  }), [
    activeProfile,
    archiveLineupNotice,
    authUser,
    handleProfileUpdated,
    handleCreateTribe,
    handleJoinTribe,
    handleLeaveTribe,
    handleRenameTribe,
    handleSelectLineup,
    handleSignedOut,
    hidePastEvents,
    hideUndatedEvents,
    ignoreSmallConflicts,
    favoriteItems.length,
    isTribeBusy,
    isTribeReady,
    pendingTribeInviteCode,
    resetFavorites,
    selectedLineupKey,
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
      isHidden={shouldHideBaseView}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileImageSrc={profileImageSrc}
      brandLogoSrc={activeSiteAssets.logoSrc}
    />
  ), [
    activeView,
    baseViewHeaderTransitionState,
    handleProfileButtonClick,
    isSearchHeaderMode,
    navbarItems,
    openHomeView,
    openSearch,
    openView,
    profileImageSrc,
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

      {!hasRenderedPages ? <BackToTop /> : null}

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
