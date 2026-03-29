import React, { memo, useEffect, useMemo, useState } from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getCanonicalStageName, getStageTheme } from '../lib/stageThemes';
import { getEntryDisplayName, getEntryMetaLabel } from '../lib/lineup';

const EMPTY_ITEMS = [];
const INITIAL_STAGE_PANEL_COUNT = 6;
const STAGE_PANEL_CHUNK_SIZE = 6;

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

const LineupEntryCard = memo(
  function LineupEntryCard({
    entry,
    isFavorite,
    favoriteIdSet,
    toggleFavorite,
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
          <FavoriteStar active={isFavorite} onClick={() => toggleFavorite(entry.id)} />
        </div>
        {showTribeOnly && tribeLikesFromOthers.length > 0 && (
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
        )}
        {!showTribeOnly && isFavorite && relatedSuggestions.length > 0 && (
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
                    <FavoriteStar
                      active={isSuggestionFavorite}
                      onClick={() => toggleFavorite(suggestion.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    );
  },
  (previousProps, nextProps) =>
    previousProps.entry === nextProps.entry &&
    previousProps.isFavorite === nextProps.isFavorite &&
    previousProps.showTribeOnly === nextProps.showTribeOnly &&
    previousProps.tribeLikesFromOthers === nextProps.tribeLikesFromOthers &&
    previousProps.relatedSuggestions === nextProps.relatedSuggestions &&
    previousProps.suggestionFavoriteSignature === nextProps.suggestionFavoriteSignature &&
    previousProps.toggleFavorite === nextProps.toggleFavorite
);

/**
 * Render the main lineup grouped by day and stage. Entries are shown in
 * cards with the artist name and a meta label describing stage, day
 * and time. Unlike the original implementation this refactored view
 * deliberately omits the artist tags row per the new design to keep
 * cards compact. Favourite items are indicated via the star button
 * passed in as a prop.
 *
 * Props:
 *   groupedEntries (object): Map of day → stage → array of entries.
 *   entries (array): Full entries list used to derive related suggestions.
 *   favoriteIdSet (Set): Set of favourite entry ids.
 *   toggleFavorite (function): Handler to toggle the favourite state.
 */
function LineupView({
  groupedEntries,
  entries,
  favoriteIdSet,
  toggleFavorite,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
}) {
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

  const hasEntries = Object.keys(groupedEntries).length > 0;
  const totalStagePanelCount = useMemo(
    () =>
      Object.values(groupedEntries).reduce(
        (count, dayStages) => count + Object.keys(dayStages).length,
        0
      ),
    [groupedEntries]
  );
  const [renderedStagePanelCount, setRenderedStagePanelCount] = useState(totalStagePanelCount);

  useEffect(() => {
    setRenderedStagePanelCount(Math.min(INITIAL_STAGE_PANEL_COUNT, totalStagePanelCount));

    if (totalStagePanelCount <= INITIAL_STAGE_PANEL_COUNT) {
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
  }, [totalStagePanelCount]);

  if (!hasEntries) {
    return <EmptyState text="No entries found." />;
  }

  let stagePanelIndex = 0;
  return (
    <section className="content-grid">
      <h1 className="sr-only">Line-up</h1>
      {Object.entries(groupedEntries).map(([day, dayStages]) => {
        const stagePanels = Object.entries(dayStages).map(([stage, stageEntries]) => {
          stagePanelIndex += 1;
          if (stagePanelIndex > renderedStagePanelCount) {
            return null;
          }
          const theme = getStageTheme(stage);
          return (
            <section
              key={`${day}-${stage}`}
              className="stage-panel"
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
                  {stageEntries.length}{' '}
                  {stageEntries.length === 1 ? 'artist' : 'artists'}
                </span>
              </div>
              <div className="card-list">
                {stageEntries.map((entry) => {
                  const isFavorite = favoriteIdSet.has(entry.id);
                  const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
                  const tribeLikesFromOthers = showTribeOnly
                    ? tribeLikes.filter((member) => !member.isCurrentUser)
                    : EMPTY_ITEMS;
                  const relatedSuggestions = isFavorite && !showTribeOnly
                    ? (alternativeEntriesById.get(entry.id) ?? EMPTY_ITEMS)
                    : EMPTY_ITEMS;
                  const suggestionFavoriteSignature = relatedSuggestions
                    .slice(0, 3)
                    .map((suggestion) => `${suggestion.id}:${favoriteIdSet.has(suggestion.id) ? 1 : 0}`)
                    .join('|');
                  return (
                    <LineupEntryCard
                      key={entry.id}
                      entry={entry}
                      isFavorite={isFavorite}
                      favoriteIdSet={favoriteIdSet}
                      toggleFavorite={toggleFavorite}
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

        if (!stagePanels.some(Boolean)) {
          return null;
        }

        return (
          <section key={day} className="day-section">
            <div className="day-section__header">
              <h2>{day}</h2>
            </div>
            <div className="day-stage-list">{stagePanels}</div>
          </section>
        );
      })}
    </section>
  );
}

export default memo(LineupView);
