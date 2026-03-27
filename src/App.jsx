import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Disc3,
  Music2,
  RotateCcw,
  Search,
} from 'lucide-react';
import lineupData from './data/lineup.json';
import {
  FAVORITES_STORAGE_KEY,
  countVisibleStages,
  filterEntries,
  findAlternativeEntries,
  getAlternativeMatchSummary,
  getDays,
  getDefaultDay,
  getFavoriteEntries,
  getStages,
  groupEntriesByDayAndStage,
  groupFavoritesByDayAndStage,
  loadFavorites,
  loadViewPreferences,
  saveFavorites,
  saveViewPreferences,
  validateLineupPayload,
} from './lib/lineup';
import { getStageTheme } from './lib/stageThemes';
import StageBadge from './components/StageBadge';
import SummaryCard from './components/SummaryCard';
import FavoriteStar from './components/FavoriteStar';
import EmptyState from './components/EmptyState';
import LineupView from './views/LineupView';
import FavoritesView from './views/FavoritesView';
import './index.css';

validateLineupPayload(lineupData);

const entries = lineupData.entries;

export default function App() {
  const defaultDay = useMemo(() => getDefaultDay(entries), []);

  const [view, setView] = useState('lineup');
  const [selectedDay, setSelectedDay] = useState(() => loadViewPreferences()?.selectedDay || defaultDay);
  const [selectedStage, setSelectedStage] = useState(() => loadViewPreferences()?.selectedStage || 'All stages');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [hasAutoExpandedSearchScope, setHasAutoExpandedSearchScope] = useState(false);

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

  const favoriteEntries = useMemo(() => {
    return getFavoriteEntries(entries, favorites);
  }, [favorites]);

  const groupedFavorites = useMemo(() => {
    return groupFavoritesByDayAndStage(favoriteEntries);
  }, [favoriteEntries]);

  const summary = useMemo(() => {
    const sourceEntries = view === 'favorites' ? favoriteEntries : visibleEntries;
    return {
      mode: `${selectedDay} • ${selectedStage}`,
      stages: countVisibleStages(sourceEntries),
      artists: sourceEntries.length,
    };
  }, [view, favoriteEntries, visibleEntries]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

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
    setFavorites((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
  };

  const resetLocalData = () => {
    setSelectedDay(defaultDay);
    setSelectedStage('All stages');
    setQuery('');
    setHasAutoExpandedSearchScope(false);
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__inner">
          <div className="hero__content">
            <h1>Defqon.1 2026 planner</h1>
            <p className="hero__text">
              Research, favorites and smart suggestions to quickly see where an artist performs elsewhere.
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
                onClick={() => {
                  setView('favorites');
                  setQuery('');
                  setSelectedDay('All days');
                  setSelectedStage('All stages');
                  setHasAutoExpandedSearchScope(false);
                }}
              >
                Favorites
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
                placeholder="Recherche : artiste, duo, showcase, alias..."
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
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ) : (
          <FavoritesView
            groupedFavorites={groupedFavorites}
            entries={entries}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
      </main>
    </div>
  );
}
