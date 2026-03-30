import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getCanonicalStageName, getStageTheme } from '../lib/stageThemes';
import { getEntryDisplayName, getEntryMetaLabel } from '../lib/lineup';

const EMPTY_ITEMS = [];
const INITIAL_STAGE_PANEL_COUNT = 6;
const STAGE_PANEL_CHUNK_SIZE = 6;
const STAGE_PRIORITY_ORDER = ['BLUE', 'BLACK', 'RED', 'U.V.', 'GREEN', 'YELLOW'];
const STAGE_PRIORITY_INDEX = new Map(
  STAGE_PRIORITY_ORDER.map((stageName, index) => [stageName, index])
);

function getSuggestionCardStyle(theme, isStageChanged) {
  if (!isStageChanged) {
    return {
      borderColor: theme.accentBorder,
      background: theme.accentSoft,
    };
  }

  return {
    borderColor: theme.accentBorder,
    background: `${theme.accent}5C`,
  };
}

function compareStages(leftStage, rightStage) {
  const leftCanonical = getCanonicalStageName(leftStage);
  const rightCanonical = getCanonicalStageName(rightStage);
  const leftPriority = STAGE_PRIORITY_INDEX.get(leftCanonical);
  const rightPriority = STAGE_PRIORITY_INDEX.get(rightCanonical);

  if (leftPriority !== undefined || rightPriority !== undefined) {
    if (leftPriority === undefined) {
      return 1;
    }
    if (rightPriority === undefined) {
      return -1;
    }
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
  }

  return String(leftCanonical).localeCompare(String(rightCanonical));
}

const LineupEntryCard = memo(
  function LineupEntryCard({
    entry,
    isFavorite,
    favoriteIdSet,
    toggleFavorite,
    canToggleFavorites,
    showTribeOnly,
    tribeLikesFromOthers,
    relatedSuggestions,
    suggestionFavoriteSignature,
  }) {
    return (
      <article className={isFavorite ? 'entry-card entry-card--favorite' : 'entry-card'}>
        <div className="entry-card__top">
          <div>
            <h3>{getEntryDisplayName(entry)}</h3>
            <p className="muted">{entry.timeLabel}</p>
          </div>
          {canToggleFavorites ? (
            <FavoriteStar active={isFavorite} onClick={() => toggleFavorite(entry.id)} />
          ) : null}
        </div>
        {showTribeOnly && tribeLikesFromOthers.length > 0 ? (
          <div className="suggestions suggestions--tribe">
            <div className="suggestions__title">Your tribe like this</div>
            <div className="tribe-likes-list">
              {tribeLikesFromOthers.map((member) => (
                <div key={member.userId} className="tribe-like-card">
                  <img
                    src={member.avatarUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="tribe-like-card__avatar"
                  />
                  <div className="tribe-like-card__name">
                    <strong>{member.firstName}</strong>
                    <span>{member.lastName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {!showTribeOnly && isFavorite && relatedSuggestions.length > 0 ? (
          <div className="suggestions">
            <div className="suggestions__title">This artist also plays elsewhere</div>
            <div className="suggestion-list">
              {relatedSuggestions.slice(0, 3).map((suggestion) => {
                const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);
                const suggestionTheme = getStageTheme(suggestion.stageCanonical || suggestion.stage);
                const isStageChanged =
                  getCanonicalStageName(suggestion.stageCanonical || suggestion.stage) !==
                  getCanonicalStageName(entry.stageCanonical || entry.stage);

                return (
                  <div
                    key={suggestion.id}
                    className="suggestion-card"
                    style={getSuggestionCardStyle(suggestionTheme, isStageChanged)}
                  >
                    <div>
                      <strong>{getEntryDisplayName(suggestion)}</strong>
                      <p className="muted">{getEntryMetaLabel(suggestion)}</p>
                    </div>
                    {canToggleFavorites ? (
                      <FavoriteStar
                        active={isSuggestionFavorite}
                        onClick={() => toggleFavorite(suggestion.id)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </article>
    );
  },
  (previousProps, nextProps) =>
    previousProps.entry === nextProps.entry &&
    previousProps.isFavorite === nextProps.isFavorite &&
    previousProps.canToggleFavorites === nextProps.canToggleFavorites &&
    previousProps.showTribeOnly === nextProps.showTribeOnly &&
    previousProps.tribeLikesFromOthers === nextProps.tribeLikesFromOthers &&
    previousProps.relatedSuggestions === nextProps.relatedSuggestions &&
    previousProps.suggestionFavoriteSignature === nextProps.suggestionFavoriteSignature &&
    previousProps.toggleFavorite === nextProps.toggleFavorite
);

function LineupView({
  groupedEntries,
  entries,
  favoriteIdSet,
  toggleFavorite,
  canToggleFavorites = true,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
  archiveNotice = null,
  stackDays = false,
}) {
  const gridShellRef = useRef(null);
  const dayRailTrackRef = useRef(null);
  const dayRailRef = useRef(null);
  const dayColumnRefs = useRef(new Map());
  const dayPillRefs = useRef(new Map());
  const hasVisibleFavorites = useMemo(
    () =>
      Object.values(groupedEntries).some((dayStages) =>
        Object.values(dayStages).some((stageEntries) =>
          stageEntries.some((entry) => favoriteIdSet.has(entry.id))
        )
      ),
    [groupedEntries, favoriteIdSet]
  );

  const alternativeEntriesById = useMemo(() => {
    if (showTribeOnly || !hasVisibleFavorites) {
      return new Map();
    }

    const entriesByToken = new Map();

    entries.forEach((entry) => {
      entry.artistTokens.forEach((token) => {
        if (!token) {
          return;
        }

        const currentEntries = entriesByToken.get(token);
        if (currentEntries) {
          currentEntries.push(entry);
          return;
        }

        entriesByToken.set(token, [entry]);
      });
    });

    return entries.reduce((accumulator, entry) => {
      const seenIds = new Set();
      const alternatives = [];

      entry.artistTokens.forEach((token) => {
        const tokenMatches = entriesByToken.get(token) ?? [];
        tokenMatches.forEach((candidate) => {
          if (candidate.id === entry.id || seenIds.has(candidate.id)) {
            return;
          }
          seenIds.add(candidate.id);
          alternatives.push(candidate);
        });
      });

      alternatives.sort(
        (a, b) =>
          (a.dayOrder ?? 999) - (b.dayOrder ?? 999) ||
          a.stage.localeCompare(b.stage)
      );

      accumulator.set(entry.id, alternatives);
      return accumulator;
    }, new Map());
  }, [entries, showTribeOnly, hasVisibleFavorites]);

  const dayEntries = useMemo(
    () =>
      Object.entries(groupedEntries).map(([day, dayStages]) => ({
        day,
        stages: Object.entries(dayStages)
          .map(([stage, stageEntries]) => ({
            key: `${day}-${stage}`,
            stage,
            stageEntries,
          }))
          .sort((leftStage, rightStage) => compareStages(leftStage.stage, rightStage.stage)),
      })),
    [groupedEntries]
  );

  const hasEntries = dayEntries.length > 0;
  const totalStagePanelCount = useMemo(
    () => dayEntries.reduce((count, dayEntry) => count + dayEntry.stages.length, 0),
    [dayEntries]
  );
  const initialRenderedStagePanelCount = useMemo(
    () => Math.min(Math.max(INITIAL_STAGE_PANEL_COUNT, dayEntries.length), totalStagePanelCount),
    [dayEntries.length, totalStagePanelCount]
  );
  const [renderedStagePanelCount, setRenderedStagePanelCount] = useState(totalStagePanelCount);
  const visibleStagePanelKeys = useMemo(() => {
    const prioritizedStagePanels = [];

    dayEntries.forEach((dayEntry) => {
      if (dayEntry.stages[0]) {
        prioritizedStagePanels.push(dayEntry.stages[0].key);
      }
    });

    dayEntries.forEach((dayEntry) => {
      dayEntry.stages.slice(1).forEach((stageEntry) => {
        prioritizedStagePanels.push(stageEntry.key);
      });
    });

    return new Set(prioritizedStagePanels.slice(0, renderedStagePanelCount));
  }, [dayEntries, renderedStagePanelCount]);
  const visibleDayEntries = useMemo(
    () =>
      dayEntries
        .map((dayEntry) => ({
          ...dayEntry,
          visibleStages: dayEntry.stages.filter((stageEntry) =>
            visibleStagePanelKeys.has(stageEntry.key)
          ),
        }))
        .filter((dayEntry) => dayEntry.visibleStages.length > 0),
    [dayEntries, visibleStagePanelKeys]
  );
  const isSingleDayView = dayEntries.length === 1;
  const useDenseEntryGrid = isSingleDayView || stackDays;

  useEffect(() => {
    setRenderedStagePanelCount(initialRenderedStagePanelCount);

    if (totalStagePanelCount <= initialRenderedStagePanelCount) {
      return undefined;
    }

    let isCancelled = false;
    let timeoutId = null;

    const scheduleNextChunk = () => {
      timeoutId = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        setRenderedStagePanelCount((currentCount) => {
          const nextCount = Math.min(currentCount + STAGE_PANEL_CHUNK_SIZE, totalStagePanelCount);

          if (nextCount < totalStagePanelCount) {
            scheduleNextChunk();
          }

          return nextCount;
        });
      }, 16);
    };

    scheduleNextChunk();

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [initialRenderedStagePanelCount, totalStagePanelCount]);

  useEffect(() => {
    const gridShell = gridShellRef.current;
    const dayRailTrack = dayRailTrackRef.current;

    if (!gridShell || !dayRailTrack || stackDays) {
      return undefined;
    }

    const syncDayRail = () => {
      dayRailTrack.style.transform = `translate3d(${-gridShell.scrollLeft}px, 0, 0)`;
    };

    syncDayRail();
    gridShell.addEventListener('scroll', syncDayRail, { passive: true });
    window.addEventListener('resize', syncDayRail, { passive: true });

    return () => {
      gridShell.removeEventListener('scroll', syncDayRail);
      window.removeEventListener('resize', syncDayRail);
    };
  }, [stackDays, visibleDayEntries.length]);

  useEffect(() => {
    const dayRail = dayRailRef.current;

    if (!dayRail || stackDays) {
      return undefined;
    }

    let frameId = null;

    const syncDayPillVisibility = () => {
      frameId = null;
      const railBottom = dayRail.getBoundingClientRect().bottom;

      visibleDayEntries.forEach(({ day }) => {
        const dayColumn = dayColumnRefs.current.get(day);
        const dayPill = dayPillRefs.current.get(day);

        if (!dayColumn || !dayPill) {
          return;
        }

        const shouldHide = dayColumn.getBoundingClientRect().bottom <= railBottom + 2;
        dayPill.classList.toggle('lineup-day-rail__pill--hidden', shouldHide);
      });
    };

    const scheduleSyncDayPillVisibility = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(syncDayPillVisibility);
    };

    scheduleSyncDayPillVisibility();
    window.addEventListener('scroll', scheduleSyncDayPillVisibility, { passive: true });
    window.addEventListener('resize', scheduleSyncDayPillVisibility, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleSyncDayPillVisibility);
      window.removeEventListener('resize', scheduleSyncDayPillVisibility);
    };
  }, [stackDays, visibleDayEntries]);

  const renderStagePanels = (visibleStages) =>
    visibleStages.map(({ key, stage, stageEntries }) => {
      const theme = getStageTheme(stage);

      return (
        <section
          key={key}
          className="stage-panel lineup-stage-slot"
          style={{
            borderColor: theme.accentBorder,
            background: theme.accentSoft,
          }}
        >
          <div className="stage-panel__header">
            <div className="stage-title-wrap">
              <span
                className="stage-pill"
                style={{ background: theme.accent, color: theme.activeText }}
              >
                {stage}
              </span>
            </div>
            <span>
              {stageEntries.length} {stageEntries.length === 1 ? 'artist' : 'artists'}
            </span>
          </div>
          <div
            className={
              useDenseEntryGrid
                ? 'card-list lineup-entry-list lineup-entry-list--single-day'
                : 'card-list lineup-entry-list'
            }
          >
            {stageEntries.map((entry) => {
              const isFavorite = favoriteIdSet.has(entry.id);
              const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
              const tribeLikesFromOthers = showTribeOnly
                ? tribeLikes.filter((member) => !member.isCurrentUser)
                : EMPTY_ITEMS;
              const relatedSuggestions =
                isFavorite && !showTribeOnly
                  ? (alternativeEntriesById.get(entry.id) ?? EMPTY_ITEMS)
                  : EMPTY_ITEMS;
              const suggestionFavoriteSignature = relatedSuggestions
                .slice(0, 3)
                .map(
                  (suggestion) => `${suggestion.id}:${favoriteIdSet.has(suggestion.id) ? 1 : 0}`
                )
                .join('|');

              return (
                <LineupEntryCard
                  key={entry.id}
                  entry={entry}
                  isFavorite={isFavorite}
                  favoriteIdSet={favoriteIdSet}
                  toggleFavorite={toggleFavorite}
                  canToggleFavorites={canToggleFavorites}
                  showTribeOnly={showTribeOnly}
                  tribeLikesFromOthers={tribeLikesFromOthers}
                  relatedSuggestions={relatedSuggestions}
                  suggestionFavoriteSignature={suggestionFavoriteSignature}
                />
              );
            })}
          </div>
        </section>
      );
    });

  if (!hasEntries) {
    return <EmptyState text="No entries found." />;
  }

  return (
    <section
      className={
        isSingleDayView
          ? 'content-grid content-grid--lineup content-grid--lineup-single-day'
          : 'content-grid content-grid--lineup'
      }
    >
      <h1 className="sr-only">Line-up</h1>
      {archiveNotice ? (
        <div className="archive-banner">
          <div className="alert-banner__icon" aria-hidden="true">
            ⚠️
          </div>
          <div className="alert-banner__content">
            <strong>Archived line-up snapshot</strong>
            <span>{archiveNotice}</span>
          </div>
        </div>
      ) : null}
      {stackDays ? (
        visibleDayEntries.map(({ day, visibleStages }) => (
          <section key={day} className="day-section day-section--stacked-lineup">
            <div className="day-section__header day-section__header--stacked-lineup">
              <h2 className="day-section__pill-heading">
                <span className="lineup-day-rail__pill">{day}</span>
              </h2>
            </div>
            <div className="day-stage-list">{renderStagePanels(visibleStages)}</div>
          </section>
        ))
      ) : (
      <div
        className="lineup-grid-frame"
        style={{ '--lineup-day-count': String(Math.max(visibleDayEntries.length, 1)) }}
      >
        <div ref={dayRailRef} className="lineup-day-rail" aria-hidden="true">
          <div className="lineup-day-rail__viewport">
            <div ref={dayRailTrackRef} className="lineup-day-rail__track">
              {visibleDayEntries.map(({ day }) => (
                <div key={day} className="lineup-day-rail__cell">
                  <span
                    ref={(node) => {
                      if (node) {
                        dayPillRefs.current.set(day, node);
                        return;
                      }
                      dayPillRefs.current.delete(day);
                    }}
                    className="lineup-day-rail__pill"
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div ref={gridShellRef} className="lineup-grid-shell">
          <div className="lineup-day-columns">
            {visibleDayEntries.map(({ day, visibleStages }) => (
              <section
                key={day}
                ref={(node) => {
                  if (node) {
                    dayColumnRefs.current.set(day, node);
                    return;
                  }
                  dayColumnRefs.current.delete(day);
                }}
                className="lineup-day-column"
              >
                <h2 className="sr-only">{day}</h2>
                <div className="lineup-stage-list">{renderStagePanels(visibleStages)}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
      )}
    </section>
  );
}

export default memo(LineupView);
