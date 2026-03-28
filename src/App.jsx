import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Disc3,
  Music2,
  RotateCcw,
  Search,
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

const lineupModules = import.meta.glob('./data/*_defqon_lineup.json', {
  eager: true,
});

const lineupKeys = Object.keys(lineupModules).sort();
const latestKey = lineupKeys.at(-1) ?? null;
const previousKey = lineupKeys.length > 1 ? lineupKeys.at(-2) : null;

const entries = latestKey ? extractLineupEntries(lineupModules[latestKey]) : [];
const previousEntries = previousKey
  ? extractLineupEntries(lineupModules[previousKey])
  : [];

const hasLineup = entries.length > 0;

if (hasLineup) {
  validateLineupPayload(entries);
}

export default function App() {
  const defaultDay = useMemo(() => getDefaultDay(entries), []);
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    []
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
  const [pendingAction, setPendingAction] = useState(null);

  const favoriteResolution = useMemo(
    () => resolveFavoriteItems(entries, favoriteItems),
    [favoriteItems]
  );

  const favoriteIds = favoriteResolution.ids;
  const favoriteEntries = favoriteResolution.entries;
  const reviewFavorites = favoriteResolution.reviewItems;
  const reviewCount = reviewFavorites.length;

  const days = useMemo(() => getDays(entries), []);
  const stages = useMemo(() => getStages(entries, selectedDay), [selectedDay]);

  const profileAvatarSrc = authUser
    ? resolveProfileAvatarUrl(profile) || getPresetAvatarUrl(1)
    : '';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem('defqon1-favorites');
    window.sessionStorage.removeItem('defqon1-favorites');
  }, []);

  useEffect(() => {
    if (selectedStage !== 'All stages' && !stages.includes(selectedStage)) {
      setSelectedStage('All stages');
    }
  }, [selectedStage, stages]);

  const visibleEntries = useMemo(() => {
    return filterEntries(entries, {
      query,
      day: selectedDay,
      stage: selectedStage,
    });
  }, [query, selectedDay, selectedStage]);

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

    if (pendingAction.type === 'toggle-favorite') {
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

    if (pendingAction.type === 'remove-review-favorite') {
      setFavoriteItems((prev) =>
        removeFavoriteByKey(prev, pendingAction.favoriteKey)
      );
    }

    setPendingAction(null);
    setIsAuthModalOpen(false);
  }, [authUser, isAccountReady, pendingAction, entriesById]);

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
    if (!authUser) {
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

  if (!hasLineup) {
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
                className="profile-trigger"
                onClick={handleProfileClick}
                aria-label={authUser ? 'Open profile' : 'Login or sign up'}
                title={authUser ? 'Open profile' : 'Login or sign up'}
              >
                {authUser ? (
                  <img
                    src={profileAvatarSrc}
                    alt="User avatar"
                    className="profile-trigger__image"
                  />
                ) : (
                  <UserRound size={18} />
                )}
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
              entries={entries}
              favorites={favoriteIds}
              toggleFavorite={toggleFavorite}
              removeReviewFavorite={removeReviewFavorite}
            />
          )}
        </main>
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
    </>
  );
}