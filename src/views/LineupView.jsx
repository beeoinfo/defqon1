import React from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getCanonicalStageName, getStageTheme } from '../lib/stageThemes';
import { findAlternativeEntries, getEntryDisplayName, getEntryMetaLabel } from '../lib/lineup';

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
 *   favorites (array): Array of favourite entry ids.
 *   toggleFavorite (function): Handler to toggle the favourite state.
 */
export default function LineupView({
  groupedEntries,
  entries,
  favorites,
  toggleFavorite,
  showTribeOnly = false,
  tribeLikesByEntryId = new Map(),
}) {
  const hasEntries = Object.keys(groupedEntries).length > 0;
  if (!hasEntries) {
    return <EmptyState text="No entries found." />;
  }
  return (
    <section className="content-grid">
      <h1 className="sr-only">Line-up</h1>
      {Object.entries(groupedEntries).map(([day, dayStages]) => (
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
                      const isFavorite = favorites.includes(entry.id);
                      const tribeLikes = tribeLikesByEntryId.get(entry.id) ?? [];
                      const tribeLikesFromOthers = tribeLikes.filter((member) => !member.isCurrentUser);
                      const relatedSuggestions = isFavorite && !showTribeOnly
                        ? findAlternativeEntries(entry, entries)
                            .filter((suggestion) => !favorites.includes(suggestion.id))
                            .slice(0, 3)
                        : [];
                      return (
                        <article
                          key={entry.id}
                          className={isFavorite ? 'entry-card entry-card--favorite' : 'entry-card'}
                        >
                          <div className="entry-card__top">
                            <div>
                              <h3>{getEntryDisplayName(entry)}</h3>
                              <p className="muted">{entry.timeLabel}</p>
                            </div>
                            <FavoriteStar
                              active={isFavorite}
                              onClick={() => toggleFavorite(entry.id)}
                            />
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
                              <div className="suggestions__title">You may also like</div>
                              <div className="suggestion-list">
                                {relatedSuggestions.map((suggestion) => {
                                  const isSuggestionFavorite = favorites.includes(suggestion.id);
                                  const suggestionTheme = getStageTheme(
                                    suggestion.stageCanonical || suggestion.stage
                                  );
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
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
