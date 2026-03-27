import React from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getStageTheme } from '../lib/stageThemes';
import {
  REVIEW_SECTION_MESSAGE,
  findAlternativeEntries,
  getEntryDisplayName,
  getEntryMetaLabel,
  getSavedFavoritePreviousLabel,
} from '../lib/lineup';

export default function FavoritesView({
  groupedFavorites,
  filteredFavoriteEntries,
  filteredReviewFavorites,
  entries,
  favorites,
  toggleFavorite,
  removeReviewFavorite,
}) {
  const hasCurrentFavorites = filteredFavoriteEntries.length > 0;
  const hasReviewFavorites = filteredReviewFavorites.length > 0;

  if (!hasCurrentFavorites && !hasReviewFavorites) {
    return (
      <section className="favorites-view">
        <EmptyState text="No favorites found for the current filters." />
      </section>
    );
  }

  return (
    <section className="favorites-view">
      {hasReviewFavorites && (
        <section className="day-section">
          <div className="day-section__header">
            <div className="review-header">
              <div className="review-header__top">
                <h2>Needs review</h2>
                <span className="review-count-badge">
                  {filteredReviewFavorites.length}
                </span>
              </div>

              <div className="alert-banner alert-banner--danger">
                <div className="alert-banner__icon">⚠️</div>
                <div className="alert-banner__content">
                  <strong>Uh oh… a few saved favorites need a quick check.</strong>
                  <p>{REVIEW_SECTION_MESSAGE}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-list">
            {filteredReviewFavorites.map((favorite) => (
              <article
                key={favorite.favoriteKey}
                className="entry-card entry-card--review"
              >
                <div className="entry-card__top">
                  <div>
                    <h3>{favorite.artistRaw}</h3>

                    <div className="review-previous">
                      <span className="review-previous__label">Previously:</span>
                      <p className="muted muted--danger review-previous__value">
                        {getSavedFavoritePreviousLabel(favorite)}
                      </p>
                    </div>
                  </div>

                  <FavoriteStar
                    active={true}
                    onClick={() => removeReviewFavorite(favorite.favoriteKey)}
                    title="Remove saved favorite"
                  />
                </div>

                <div className="chip-row">
                  {favorite.artistTags.map((artist, index) => (
                    <span
                      key={`${favorite.favoriteKey}-${artist}-${index}`}
                      className="chip chip--danger"
                    >
                      {artist}
                    </span>
                  ))}
                </div>

                <div className="suggestions suggestions--review">

                  {favorite.suggestions.length > 0 ? (
                    <>
                      <div className="suggestions__title suggestions__title--danger">
                        You may be looking for this instead
                      </div>
                      <div className="suggestion-list">
                        {favorite.suggestions.map((suggestion) => {
                          const isSuggestionFavorite = favorites.includes(suggestion.id);

                          return (
                            <div key={suggestion.id} className="suggestion-card suggestion-card--review">
                              <div>
                                <strong>{getEntryDisplayName(suggestion)}</strong>
                                <p className="muted">{getEntryMetaLabel(suggestion)}</p>
                              </div>

                              <FavoriteStar
                                active={isSuggestionFavorite}
                                onClick={() => toggleFavorite(suggestion.id)}
                                title="Toggle suggested favorite"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="muted muted--danger">
                      No suggestions for now... It seems your artist disappeared 😢
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {Object.entries(groupedFavorites).map(([day, dayStages]) => (
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
                        style={{
                          background: theme.accent,
                          color: theme.activeText,
                        }}
                      >
                        {stage}
                      </span>
                    </div>

                    <span>
                      {stageEntries.length}{' '}
                      {stageEntries.length === 1 ? 'favorite' : 'favorites'}
                    </span>
                  </div>

                  <div className="card-list">
                    {stageEntries.map((entry) => {
                      const alternatives = findAlternativeEntries(entry, entries);
                      const hasAlternatives = alternatives.length > 0;

                      return (
                        <article key={entry.id} className="entry-card">
                          <div className="entry-card__top">
                            <div>
                              <h3>{getEntryDisplayName(entry)}</h3>
                              <p className="muted">{getEntryMetaLabel(entry)}</p>
                            </div>

                            <FavoriteStar
                              active={true}
                              onClick={() => toggleFavorite(entry.id)}
                              title="Remove favorite"
                            />
                          </div>

                          <div className="chip-row">
                            {entry.artistTags.map((artist, index) => (
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
                                  const isAlternativeFavorite = favorites.includes(alternative.id);

                                  return (
                                    <div key={alternative.id} className="suggestion-card">
                                      <div>
                                        <strong>{getEntryDisplayName(alternative)}</strong>
                                        <p className="muted">{getEntryMetaLabel(alternative)}</p>
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
      ))}
    </section>
  );
}