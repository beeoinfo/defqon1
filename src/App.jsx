import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Disc3,
  Music2,
  RotateCcw,
  Search,
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
  loadFavorites,
  loadViewPreferences,
  removeFavoriteByEntryId,
  removeFavoriteByKey,
  resolveFavoriteItems,
  saveFavorites,
  saveViewPreferences,
  upsertFavoriteEntry,
  validateLineupPayload,
} from './lib/lineup';
import { getStageTheme } from './lib/stageThemes';
import StageBadge from './components/StageBadge';
import SummaryCard from './components/SummaryCard';
import EmptyState from './components/EmptyState';
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
  const [favoriteItems, setFavoriteItems] = useState(() =>
    loadFavorites(entries, previousEntries)
  );
  const [hasAutoExpandedSearchScope, setHasAutoExpandedSearchScope] = useState(false);

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
    saveFavorites(favoriteItems);
  }, [favoriteItems]);

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

  const toggleFavorite = (entryId) => {
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
        return removeFavoriteByEntryId(prev, entryId);
      }

      return upsertFavoriteEntry(prev, entry);
    });
  };

  const removeReviewFavorite = (favoriteKey) => {
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
    <div className="app-shell">
      <header className="hero">
        <div className="hero__inner">
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
                className={
                  view === 'favorites'
                    ? `tab tab--active${reviewCount > 0 ? ' tab--with-badge' : ''}`
                    : `tab${reviewCount > 0 ? ' tab--with-badge' : ''}`
                }
                onClick={() => {
                  setView('favorites');
                  setQuery('');
                  setSelectedDay('All days');
                  setSelectedStage('All stages');
                  setHasAutoExpandedSearchScope(false);
                }}
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
  );
}