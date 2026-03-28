import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Disc3,
  Music2,
  RotateCcw,
  Search,
  Settings2,
  UserRound,
} from 'lucide-react';
import {
  countVisibleStages,
  filterEntries,
  filterReviewFavorites,
  getDays,
  getDefaultDay,
  getStages,
  groupEntriesByDayAndStage,
  groupFavoritesByDayAndStage,
  loadViewPreferences,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveViewPreferences,
  upsertFavoriteEntry,
  validateLineupPayload,
} from './lib/lineup';
import {
  getCurrentUser,
  isSupabaseConfigured,
  loadAccountBundle,
  supabase,
  syncFavoriteSnapshots,
} from './lib/supabase';
import { getPresetAvatarUrl, resolveProfileAvatarUrl } from './lib/presetAvatars';
import { getStageTheme } from './lib/stageThemes';
import StageBadge from './components/StageBadge';
import SummaryCard from './components/SummaryCard';
import EmptyState from './components/EmptyState';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import LineupView from './views/LineupView';
import FavoritesView from './views/FavoritesView';
import './index.css';

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
  const match = fileName.match(
    /^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_defqon_lineup\.json$/
  );

  if (!match) {
    return fileName;
  }

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} · ${hour}:${minute}`;
}

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
  const [selectedLineupKey, setSelectedLineupKey] = useState(latestKey);
  const selectedLineup =
    lineupSources.find((lineup) => lineup.key === selectedLineupKey) ??
    lineupSources[0] ??
    null;
  const selectedEntries = selectedLineup?.entries ?? [];
  const isLatestLineupSelected = selectedLineup?.isLatest ?? false;
  const favoritesReadOnly = !isLatestLineupSelected;

  const defaultDay = useMemo(() => getDefaultDay(selectedEntries), [selectedEntries]);
  const entriesById = useMemo(
    () => new Map(selectedEntries.map((entry) => [entry.id, entry])),
    [selectedEntries]
  );

  const [view, setView] = useState('lineup');
  const [selectedDay, setSelectedDay] = useState(
    () => loadViewPreferences()?.selectedDay || defaultDay
  );
  const [selectedStage, setSelectedStage] = useState(
    () => loadViewPreferences()?.selectedStage || 'All stages'
  );
  const [query, setQuery] = useState('');
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [hasAutoExpandedSearchScope, setHasAutoExpandedSearchScope] = useState(false);

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAccountReady, setIsAccountReady] = useState(!isSupabaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const favoriteResolution = useMemo(
    () => resolveFavoriteItems(selectedEntries, favoriteItems),
    [selectedEntries, favoriteItems]
  );

  const favoriteIds = favoriteResolution.ids;
  const favoriteEntries = favoriteResolution.entries;
  const reviewFavorites = favoriteResolution.reviewItems;
  const reviewCount = reviewFavorites.length;

  const days = useMemo(() => getDays(selectedEntries), [selectedEntries]);
  const stages = useMemo(
    () => getStages(selectedEntries, selectedDay),
    [selectedEntries, selectedDay]
  );

  const profileAvatarSrc = authUser
    ? resolveProfileAvatarUrl(profile) || getPresetAvatarUrl(1)
    : '';

  const profileDisplayName = authUser
    ? [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      profile?.username ||
      'Your profile'
    : 'Login / Sign up';

  const profileDisplayUsername = authUser
    ? profile?.username
      ? `@${profile.username}`
      : authUser?.email ?? ''
    : 'Sync your favorites';

  useEffect(() => {
    if (selectedDay !== 'All days' && !days.includes(selectedDay)) {
      setSelectedDay(getDefaultDay(selectedEntries));
    }
  }, [selectedDay, days, selectedEntries]);

  useEffect(() => {
    if (selectedStage !== 'All stages' && !stages.includes(selectedStage)) {
      setSelectedStage('All stages');
    }
  }, [selectedStage, stages]);

  const visibleEntries = useMemo(() => {
    return filterEntries(selectedEntries, {
      query,
      day: selectedDay,
      stage: selectedStage,
    });
  }, [selectedEntries, query, selectedDay, selectedStage]);

  const groupedVisibleEntries = useMemo(() => {
    return groupEntriesByDayAndStage(visibleEntries);
  }, [visibleEntries]);

  const filteredFavoriteEntries = useMemo(() => {
    return filterEntries(favoriteEntries, {
      query,
      day: selectedDay,
      stage: selectedStage,
    });
  }, [favoriteEntries, query, selectedDay, selectedStage]);

  const filteredReviewFavorites = useMemo(() => {
    return filterReviewFavorites(reviewFavorites, {
      query,
      day: selectedDay,
      stage: selectedStage,
    });
  }, [reviewFavorites, query, selectedDay, selectedStage]);

  const groupedFavorites = useMemo(() => {
    return groupFavoritesByDayAndStage(filteredFavoriteEntries);
  }, [filteredFavoriteEntries]);

  const summary = useMemo(() => {
    const sourceEntries =
      view === 'favorites' ? filteredFavoriteEntries : visibleEntries;

    return {
      mode: `${selectedDay} • ${selectedStage}`,
      stages: countVisibleStages(sourceEntries),
      artists:
        view === 'favorites'
          ? filteredFavoriteEntries.length + filteredReviewFavorites.length
          : sourceEntries.length,
    };
  }, [
    view,
    filteredFavoriteEntries,
    filteredReviewFavorites,
    visibleEntries,
    selectedDay,
    selectedStage,
  ]);

  useEffect(() => {
    saveViewPreferences({
      selectedDay,
      selectedStage,
    });
  }, [selectedDay, selectedStage]);

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

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let isActive = true;

    const hydrateFromAccount = async (userOverride) => {
      setIsAccountReady(false);

      try {
        const currentUser = userOverride ?? (await getCurrentUser());

        if (!isActive) {
          return;
        }

        if (!currentUser) {
          setAuthUser(null);
          setProfile(null);
          setFavoriteItems([]);
          setIsProfileModalOpen(false);
          setIsAccountReady(true);
          return;
        }

        setAuthUser(currentUser);

        const bundle = await loadAccountBundle(currentUser.id, currentUser);

        if (!isActive) {
          return;
        }

        setProfile(bundle.profile);
        setFavoriteItems(bundle.favorites);
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setIsAccountReady(true);
        }
      }
    };

    hydrateFromAccount();

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromAccount(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || !isAccountReady || !isSupabaseConfigured()) {
      return;
    }

    syncFavoriteSnapshots(authUser.id, favoriteItems).catch((error) => {
      console.error(error);
    });
  }, [authUser, favoriteItems, isAccountReady]);

  useEffect(() => {
    if (!authUser || !isAccountReady || !pendingAction) {
      return;
    }

    if (pendingAction.type === 'open-favorites') {
      setView('favorites');
      setQuery('');
      setSelectedDay('All days');
      setSelectedStage('All stages');
      setHasAutoExpandedSearchScope(false);
    }

    if (pendingAction.type === 'toggle-favorite' && isLatestLineupSelected) {
      const entry = entriesById.get(pendingAction.entryId);

      if (entry) {
        setFavoriteItems((prev) => {
          const isAlreadyFavorite = prev.some(
            (item) =>
              item.id === entry.id ||
              (item.hash && entry.hash && item.hash === entry.hash)
          );

          if (isAlreadyFavorite) {
            return removeFavoriteByEntryId(prev, entry.id);
          }

          return upsertFavoriteEntry(prev, entry);
        });
      }
    }

    if (pendingAction.type === 'remove-review-favorite' && isLatestLineupSelected) {
      setFavoriteItems((prev) =>
        removeFavoriteByKey(prev, pendingAction.favoriteKey)
      );
    }

    setPendingAction(null);
    setIsAuthModalOpen(false);
  }, [authUser, isAccountReady, pendingAction, entriesById, isLatestLineupSelected]);

  const requestAuth = (action, defaultTab = 'login') => {
    setPendingAction(action);
    setAuthDefaultTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const openFavoritesView = () => {
    setView('favorites');
    setQuery('');
    setSelectedDay('All days');
    setSelectedStage('All stages');
    setHasAutoExpandedSearchScope(false);
  };

  const handleFavoritesTabClick = () => {
    if (!authUser) {
      requestAuth({ type: 'open-favorites' });
      return;
    }

    openFavoritesView();
  };

  const handleProfileClick = () => {
    if (!authUser) {
      setPendingAction(null);
      setAuthDefaultTab('login');
      setIsAuthModalOpen(true);
      return;
    }

    setIsProfileModalOpen(true);
  };

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
        (item) =>
          item.id === entry.id ||
          (item.hash && entry.hash && item.hash === entry.hash)
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

  const resetLocalData = () => {
    setSelectedDay(defaultDay);
    setSelectedStage('All stages');
    setQuery('');
    setHasAutoExpandedSearchScope(false);
  };

  if (!hasLineup || !selectedLineup) {
    return <EmptyState text="No lineup detected" />;
  }

  return (
    <>
      <div className="app-shell">
        <header className="hero">
          <div className="hero__inner">
            <div className="hero__top">
              <button
                type="button"
                className="profile-summary"
                onClick={handleProfileClick}
                aria-label={authUser ? 'Open profile' : 'Login or sign up'}
                title={authUser ? 'Open profile' : 'Login or sign up'}
              >
                <span className="profile-summary__avatar">
                  {authUser ? (
                    <img
                      src={profileAvatarSrc}
                      alt="User avatar"
                      className="profile-trigger__image"
                    />
                  ) : (
                    <UserRound size={18} />
                  )}
                </span>

                <span className="profile-summary__content">
                  <span className="profile-summary__name">{profileDisplayName}</span>
                  <span className="profile-summary__username">
                    {profileDisplayUsername}
                  </span>
                </span>
              </button>
            </div>

            <div className="hero__content">
              <h1>Defqon.1 2026 planner</h1>
              <p className="hero__text">
                Search, favorites and smart suggestions to quickly see where an artist performs elsewhere.
              </p>
            </div>

            <div className="hero__summary">
              <SummaryCard icon={CalendarDays} label="Context" value={summary.mode} />
              <SummaryCard icon={Disc3} label="Stages" value={summary.stages} />
              <SummaryCard icon={Music2} label="Artists" value={summary.artists} />
            </div>
          </div>
        </header>

        <main className="page">
          <section className="toolbar">
            <div className="toolbar__top">
              <div className="tabs">
                <button
                  type="button"
                  className={view === 'lineup' ? 'tab tab--active' : 'tab'}
                  onClick={() => {
                    setView('lineup');
                    setHasAutoExpandedSearchScope(false);
                  }}
                >
                  Line-up
                </button>

                <button
                  type="button"
                  className={view === 'favorites' ? 'tab tab--active' : 'tab'}
                  onClick={handleFavoritesTabClick}
                >
                  <span className="tab__text">Favorites</span>
                  {reviewCount > 0 && (
                    <span className="tab__badge tab__badge--corner">
                      {reviewCount}
                    </span>
                  )}
                </button>
              </div>

              <button type="button" className="ghost-button" onClick={resetLocalData}>
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            {favoritesReadOnly && (
              <div className="toolbar__meta">
                <div className="archive-banner">
                  <strong>Archive mode enabled.</strong>
                  <span>
                    You are browsing an older lineup. Favorites are disabled until you switch back to the latest lineup or you refresh the browser.
                  </span>
                </div>
              </div>
            )}

            <div className="search-row">
              <div className="search-input-wrap">
                <Search size={16} className="search-input__icon" />
                <input
                  className="search-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search: artist, duo, showcase, alias..."
                />
              </div>
            </div>

            <div className="filters-block">
              <div className="filters-group">
                <div className="filters-group__label">Days</div>
                <div className="filters-row">
                  <StageBadge
                    label="All days"
                    active={selectedDay === 'All days'}
                    onClick={() => setSelectedDay('All days')}
                    theme={{
                      accent: '#ffffff',
                      accentSoft: 'rgba(255,255,255,0.08)',
                      accentBorder: 'rgba(255,255,255,0.14)',
                      accentText: '#ffffff',
                      activeText: '#111111',
                    }}
                  />
                  {days.map((day) => (
                    <StageBadge
                      key={day}
                      label={day}
                      active={selectedDay === day}
                      onClick={() => setSelectedDay(day)}
                      theme={{
                        accent: '#ffffff',
                        accentSoft: 'rgba(255,255,255,0.08)',
                        accentBorder: 'rgba(255,255,255,0.14)',
                        accentText: '#ffffff',
                        activeText: '#111111',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="filters-group">
                <div className="filters-group__label">Stages</div>
                <div className="filters-row">
                  <StageBadge
                    label="All stages"
                    active={selectedStage === 'All stages'}
                    onClick={() => setSelectedStage('All stages')}
                    theme={{
                      accent: '#ffffff',
                      accentSoft: 'rgba(255,255,255,0.08)',
                      accentBorder: 'rgba(255,255,255,0.14)',
                      accentText: '#ffffff',
                      activeText: '#111111',
                    }}
                  />
                  {stages.map((stage) => (
                    <StageBadge
                      key={stage}
                      label={stage}
                      active={selectedStage === stage}
                      onClick={() => setSelectedStage(stage)}
                      theme={getStageTheme(stage)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className={favoritesReadOnly ? 'favorites-readonly' : ''}>
            {view === 'lineup' ? (
              <LineupView
                groupedEntries={groupedVisibleEntries}
                favorites={favoriteIds}
                toggleFavorite={toggleFavorite}
              />
            ) : (
              <FavoritesView
                groupedFavorites={groupedFavorites}
                filteredFavoriteEntries={filteredFavoriteEntries}
                filteredReviewFavorites={filteredReviewFavorites}
                entries={selectedEntries}
                favorites={favoriteIds}
                toggleFavorite={toggleFavorite}
                removeReviewFavorite={removeReviewFavorite}
              />
            )}
          </div>
        </main>

        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__brand">
              <strong>Made with 🩷 by Dylan Bergozza</strong>
              <span className="muted">
                Defqon.1 planner · beta · more footer content later
              </span>
            </div>

            <div className="site-footer__links">
              <span>About</span>
              <span>Roadmap</span>
              <span>Support</span>
              <span>Legal</span>
            </div>

            <button
              type="button"
              className="footer-settings-button"
              onClick={() => setIsAdvancedSettingsOpen(true)}
              title="Advanced settings"
              aria-label="Advanced settings"
            >
              <Settings2 size={16} />
            </button>
          </div>
        </footer>
      </div>

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

      <ProfileModal
        open={isProfileModalOpen}
        user={authUser}
        profile={profile}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(nextProfile) => setProfile(nextProfile)}
        onSignedOut={() => {
          setAuthUser(null);
          setProfile(null);
          setFavoriteItems([]);
          setView('lineup');
          setIsProfileModalOpen(false);
        }}
      />

      <AdvancedSettingsModal
        open={isAdvancedSettingsOpen}
        lineups={lineupSources}
        selectedLineupKey={selectedLineupKey}
        onSelectLineup={(lineupKey) => {
          setSelectedLineupKey(lineupKey);
          setSelectedDay(getDefaultDay(
            lineupSources.find((lineup) => lineup.key === lineupKey)?.entries ?? []
          ));
          setSelectedStage('All stages');
          setQuery('');
          setHasAutoExpandedSearchScope(false);
        }}
        onClose={() => setIsAdvancedSettingsOpen(false)}
      />
    </>
  );
}