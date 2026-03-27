import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Disc3,
  Flame,
  Music2,
  RotateCcw,
  Search,
  Star,
} from "lucide-react";
import lineupData from "./data/lineup.json";
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
} from "./lib/lineup";
import "./index.css";

validateLineupPayload(lineupData);

const entries = lineupData.entries;

const stageThemes = {
  RED: {
    accent: "#ef4444",
    accentSoft: "rgba(239, 68, 68, 0.14)",
    accentBorder: "rgba(239, 68, 68, 0.28)",
    accentText: "#fecaca",
    activeText: "#ffffff",
  },
  BLUE: {
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.14)",
    accentBorder: "rgba(56, 189, 248, 0.28)",
    accentText: "#dbeafe",
    activeText: "#ffffff",
  },
  "BLUE Night": {
    accent: "#6366f1",
    accentSoft: "rgba(99, 102, 241, 0.14)",
    accentBorder: "rgba(99, 102, 241, 0.28)",
    accentText: "#e0e7ff",
    activeText: "#ffffff",
  },
  BLACK: {
    accent: "#71717a",
    accentSoft: "rgba(113, 113, 122, 0.18)",
    accentBorder: "rgba(113, 113, 122, 0.28)",
    accentText: "#f4f4f5",
    activeText: "#ffffff",
  },
  INDIGO: {
    accent: "#6366f1",
    accentSoft: "rgba(99, 102, 241, 0.14)",
    accentBorder: "rgba(99, 102, 241, 0.28)",
    accentText: "#e0e7ff",
    activeText: "#ffffff",
  },
  "U.V.": {
    accent: "#d946ef",
    accentSoft: "rgba(217, 70, 239, 0.14)",
    accentBorder: "rgba(217, 70, 239, 0.28)",
    accentText: "#fae8ff",
    activeText: "#ffffff",
  },
  MAGENTA: {
    accent: "#ec4899",
    accentSoft: "rgba(236, 72, 153, 0.14)",
    accentBorder: "rgba(236, 72, 153, 0.28)",
    accentText: "#fce7f3",
    activeText: "#ffffff",
  },
  GREEN: {
    accent: "#22c55e",
    accentSoft: "rgba(34, 197, 94, 0.14)",
    accentBorder: "rgba(34, 197, 94, 0.28)",
    accentText: "#dcfce7",
    activeText: "#ffffff",
  },
  YELLOW: {
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.16)",
    accentBorder: "rgba(250, 204, 21, 0.3)",
    accentText: "#fef9c3",
    activeText: "#111111",
  },
  GOLD: {
    accent: "#eab308",
    accentSoft: "rgba(234, 179, 8, 0.16)",
    accentBorder: "rgba(234, 179, 8, 0.3)",
    accentText: "#fef3c7",
    activeText: "#111111",
  },
  ORANGE: {
    accent: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.14)",
    accentBorder: "rgba(249, 115, 22, 0.28)",
    accentText: "#ffedd5",
    activeText: "#ffffff",
  },
  PURPLE: {
    accent: "#a855f7",
    accentSoft: "rgba(168, 85, 247, 0.14)",
    accentBorder: "rgba(168, 85, 247, 0.28)",
    accentText: "#f3e8ff",
    activeText: "#ffffff",
  },
  SILVER: {
    accent: "#cbd5e1",
    accentSoft: "rgba(203, 213, 225, 0.14)",
    accentBorder: "rgba(203, 213, 225, 0.28)",
    accentText: "#f8fafc",
    activeText: "#111111",
  },
  PINK: {
    accent: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.14)",
    accentBorder: "rgba(251, 113, 133, 0.28)",
    accentText: "#ffe4e6",
    activeText: "#ffffff",
  },
};

function getStageTheme(stage) {
  return (
    stageThemes[stage] || {
      accent: "#ffffff",
      accentSoft: "rgba(255, 255, 255, 0.08)",
      accentBorder: "rgba(255, 255, 255, 0.14)",
      accentText: "#ffffff",
      activeText: "#111111",
    }
  );
}

function StageBadge({ label, active, onClick, theme }) {
  const styles = active
    ? {
        background: theme.accent,
        borderColor: theme.accent,
        color: theme.activeText,
        boxShadow: `0 0 0 1px ${theme.accentBorder} inset`,
      }
    : {
        background: theme.accentSoft,
        borderColor: theme.accentBorder,
        color: theme.accentText,
      };

  return (
    <button
      type="button"
      className={active ? "filter-badge filter-badge--active" : "filter-badge"}
      onClick={onClick}
      style={styles}
    >
      {label}
    </button>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="summary-card">
      <div className="summary-card__label">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function FavoriteStar({ active, onClick, title = "Toggle favorite" }) {
  return (
    <button
      type="button"
      className={active ? "star-button star-button--active" : "star-button"}
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      <Star size={16} />
    </button>
  );
}

export default function App() {
  const defaultDay = useMemo(() => getDefaultDay(entries), []);

  const [view, setView] = useState("lineup");
  const [selectedDay, setSelectedDay] = useState(() => loadViewPreferences()?.selectedDay || defaultDay);
  const [selectedStage, setSelectedStage] = useState(() => loadViewPreferences()?.selectedStage || "All stages");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [hasAutoExpandedSearchScope, setHasAutoExpandedSearchScope] = useState(false);

  const days = useMemo(() => getDays(entries), []);
  const stages = useMemo(() => getStages(entries, selectedDay), [selectedDay]);

  useEffect(() => {
    if (selectedStage !== "All stages" && !stages.includes(selectedStage)) {
      setSelectedStage("All stages");
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
    const sourceEntries = view === "favorites" ? favoriteEntries : visibleEntries;

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
      setSelectedDay("All days");
      setSelectedStage("All stages");
      setHasAutoExpandedSearchScope(true);
    }
  }, [query, hasAutoExpandedSearchScope]);

  const toggleFavorite = (entryId) => {
    setFavorites((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const resetLocalData = () => {
    setSelectedDay(defaultDay);
    setSelectedStage("All stages");
    setQuery("");
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
                className={view === "lineup" ? "tab tab--active" : "tab"}
                onClick={() => {
                  setView("lineup");
                  setHasAutoExpandedSearchScope(false);
                }}
              >
                Line-up
              </button>
              <button
                type="button"
                className={view === "favorites" ? "tab tab--active" : "tab"}
                onClick={() => {
                  setView("favorites");
                  setQuery("");
                  setSelectedDay("All days");
                  setSelectedStage("All stages");
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
                  active={selectedDay === "All days"}
                  onClick={() => setSelectedDay("All days")}
                  theme={{
                    accent: "#ffffff",
                    accentSoft: "rgba(255,255,255,0.08)",
                    accentBorder: "rgba(255,255,255,0.14)",
                    accentText: "#ffffff",
                    activeText: "#111111",
                  }}
                />

                {days.map((day) => (
                  <StageBadge
                    key={day}
                    label={day}
                    active={selectedDay === day}
                    onClick={() => setSelectedDay(day)}
                    theme={{
                      accent: "#ffffff",
                      accentSoft: "rgba(255,255,255,0.08)",
                      accentBorder: "rgba(255,255,255,0.14)",
                      accentText: "#ffffff",
                      activeText: "#111111",
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
                  active={selectedStage === "All stages"}
                  onClick={() => setSelectedStage("All stages")}
                  theme={{
                    accent: "#ffffff",
                    accentSoft: "rgba(255,255,255,0.08)",
                    accentBorder: "rgba(255,255,255,0.14)",
                    accentText: "#ffffff",
                    activeText: "#111111",
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

        {view === "lineup" ? (
          <section className="content-grid">
            {Object.keys(groupedVisibleEntries).length === 0 ? (
              <EmptyState text="Aucune entrée trouvée." />
            ) : (
              Object.entries(groupedVisibleEntries).map(([day, dayStages]) => (
                <section key={day} className="day-section">
                  <div className="day-section__header">
                    <h2>{day}</h2>
                  </div>

                  <div className="day-stage-list">
                    {Object.entries(dayStages).map(([stage, stageEntries]) => {
                      const theme = getStageTheme(stage);

                      return (
                        <section
                          key={`${day}-${stage}`}
                          className="stage-panel"
                          style={{
                            borderColor: theme.accentBorder,
                            background: `linear-gradient(180deg, ${theme.accentSoft}, rgba(255,255,255,0.03))`,
                          }}
                        >
                          <div className="stage-panel__header">
                            <div className="stage-title-wrap">
                              <span
                                className="stage-pill"
                                style={{
                                  background: theme.accent,
                                  color:
                                    stage === "YELLOW" || stage === "GOLD"
                                      ? "#111111"
                                      : "#ffffff",
                                }}
                              >
                                {stage}
                              </span>
                            </div>
                            <span>{stageEntries.length} artiste(s)</span>
                          </div>

                          <div className="card-list">
                            {stageEntries.map((entry) => {
                              const isFavorite = favorites.includes(entry.id);

                              return (
                                <article key={entry.id} className="entry-card">
                                  <div className="entry-card__top">
                                    <div>
                                      <h3>{entry.displayName}</h3>
                                      <p className="muted">
                                        {entry.stage} • {entry.day}
                                      </p>
                                    </div>

                                    <FavoriteStar
                                      active={isFavorite}
                                      onClick={() => toggleFavorite(entry.id)}
                                    />
                                  </div>

                                  <div className="chip-row">
                                    {entry.artists.map((artist, index) => (
                                      <span key={`${entry.id}-${artist}-${index}`} className="chip">
                                        {artist}
                                      </span>
                                    ))}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </section>
        ) : (
          <section className="favorites-view">
            {favoriteEntries.length === 0 ? (
              <EmptyState text="Aucun favori pour le moment." />
            ) : (
              Object.entries(groupedFavorites).map(([day, dayStages]) => (
                <section key={day} className="day-section">
                  <div className="day-section__header">
                    <h2>{day}</h2>
                  </div>

                  <div className="day-stage-list">
                    {Object.entries(dayStages).map(([stage, stageEntries]) => {
                      const theme = getStageTheme(stage);

                      return (
                        <section
                          key={`${day}-${stage}`}
                          className="stage-panel"
                          style={{
                            borderColor: theme.accentBorder,
                            background: `linear-gradient(180deg, ${theme.accentSoft}, rgba(255,255,255,0.03))`,
                          }}
                        >
                          <div className="stage-panel__header">
                            <div className="stage-title-wrap">
                              <span
                                className="stage-pill"
                                style={{
                                  background: theme.accent,
                                  color:
                                    stage === "YELLOW" || stage === "GOLD"
                                      ? "#111111"
                                      : "#ffffff",
                                }}
                              >
                                {stage}
                              </span>
                            </div>
                            <span>{stageEntries.length} favori(s)</span>
                          </div>

                          <div className="card-list">
                            {stageEntries.map((entry) => {
                              const alternatives = findAlternativeEntries(entry, entries);
                              const hasAlternatives = alternatives.length > 0;

                              return (
                                <article key={entry.id} className="entry-card">
                                  <div className="entry-card__top">
                                    <div>
                                      <h3>{entry.displayName}</h3>
                                      <p className="muted">
                                        {entry.stage} • {entry.day}
                                      </p>
                                    </div>

                                    <FavoriteStar
                                      active={true}
                                      onClick={() => toggleFavorite(entry.id)}
                                      title="Remove favorite"
                                    />
                                  </div>

                                  <div className="chip-row">
                                    {entry.artists.map((artist, index) => (
                                      <span key={`${entry.id}-${artist}-${index}`} className="chip">
                                        {artist}
                                      </span>
                                    ))}
                                  </div>

                                  {hasAlternatives && (
                                    <div className="suggestions">
                                      <div className="suggestions__title">
                                        This artist also performs elsewhere
                                      </div>

                                      <div className="suggestion-list">
                                        {alternatives.map((alternative) => {
                                          const sharedArtists = getAlternativeMatchSummary(entry, alternative);
                                          const isAlternativeFavorite = favorites.includes(alternative.id);

                                          return (
                                            <div key={alternative.id} className="suggestion-card">
                                              <div>
                                                <strong>{alternative.displayName}</strong>
                                                <p className="muted">
                                                  {alternative.stage} • {alternative.day}
                                                </p>
                                                <p className="muted">
                                                  Match : {sharedArtists.join(", ")}
                                                </p>
                                              </div>

                                              <FavoriteStar
                                                active={isAlternativeFavorite}
                                                onClick={() => toggleFavorite(alternative.id)}
                                                title="Toggle suggested favorite"
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}