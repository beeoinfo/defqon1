import React, { memo } from 'react';
import { X } from 'lucide-react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getCanonicalStageName, getStageTheme } from '../lib/stageThemes';
import {
  REVIEW_SECTION_MESSAGE,
  getEntryDisplayName,
  getEntryMetaLabel,
  getSavedFavoritePreviousLabel,
} from '../lib/lineup';

function getReviewSuggestionCardStyle(theme, isStageChanged) {
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
 * Display favourites that need review when the lineup has changed. This
 * view extracts the review section from the original FavoritesView
 * component into its own page. Each review item shows the previous
 * saved slot, offers suggestions if the artist performs elsewhere and
 * allows the user to remove the outdated favourite.
 *
 * Props:
 *   reviewFavorites (array): List of review favourite objects with
 *     artistRaw, favoriteKey, artistTags, suggestions, etc.
 *   favoriteIdSet (Set): Set of favourite entry ids for toggling suggestions.
 *   toggleFavorite (function): Handler to toggle suggested favourites.
 *   removeReviewFavorite (function): Handler to remove a review item by its key.
 */
function ReviewsView({ reviewFavorites, favoriteIdSet, toggleFavorite, removeReviewFavorite }) {
  const hasReview = reviewFavorites && reviewFavorites.length > 0;
  if (!hasReview) {
    return <EmptyState text="No favourites require a review." />;
  }
  return (
    <section className="favorites-view">
      <h1 className="sr-only">Reviews</h1>
      <section className="day-section">
        <div className="day-section__header">
          <div className="review-header">
            <div className="review-header__top">
              <h2>Needs review</h2>
              <span className="review-count-badge">{reviewFavorites.length}</span>
            </div>
            <div className="alert-banner alert-banner--danger">
              <div className="alert-banner__icon">⚠️</div>
              <div className="alert-banner__content">
                <strong>Uh oh… a few saved favourites need a quick check.</strong>
                <p>{REVIEW_SECTION_MESSAGE}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card-list">
          {reviewFavorites.map((favorite) => {
            const theme = getStageTheme(favorite.stageCanonical || favorite.stage);
            return (
              <article
                key={favorite.favoriteKey}
                className="entry-card entry-card--review"
                style={{
                  borderColor: theme.accentBorder,
                  background: theme.accentSoft,
                }}
              >
                <div className="entry-card__top review-card__top">
                  <div>
                    <h3>{favorite.artistRaw}</h3>
                    <div className="review-previous">
                      <span className="review-previous__label">Previously:</span>
                      <p className="muted review-previous__value">
                        {getSavedFavoritePreviousLabel(favorite)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="review-close-button"
                    onClick={() => removeReviewFavorite(favorite.favoriteKey)}
                    title="Close review"
                    aria-label="Close review"
                  >
                    <X size={16} />
                  </button>
                </div>
              {/* Show suggestion chips with danger styling */}
                <div className="suggestions suggestions--review">
                  {favorite.suggestions.length > 0 ? (
                    <>
                    <div className="suggestions__title suggestions__title--review">
                      You may be looking for this instead
                    </div>
                    <div className="suggestion-list">
                      {favorite.suggestions.map((suggestion) => {
                        const isSuggestionFavorite = favoriteIdSet.has(suggestion.id);
                        const suggestionTheme = getStageTheme(
                          suggestion.stageCanonical || suggestion.stage
                        );
                        const isStageChanged =
                          getCanonicalStageName(suggestion.stageCanonical || suggestion.stage) !==
                          getCanonicalStageName(favorite.stageCanonical || favorite.stage);
                        return (
                          <div
                            key={suggestion.id}
                            className="suggestion-card suggestion-card--review"
                            style={getReviewSuggestionCardStyle(
                              suggestionTheme,
                              isStageChanged
                            )}
                          >
                            <div>
                              <strong>{getEntryDisplayName(suggestion)}</strong>
                              <p className="muted">{getEntryMetaLabel(suggestion)}</p>
                            </div>
                            <FavoriteStar
                              active={isSuggestionFavorite}
                              onClick={() => toggleFavorite(suggestion.id)}
                              title="Toggle suggested favourite"
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
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default memo(ReviewsView);
