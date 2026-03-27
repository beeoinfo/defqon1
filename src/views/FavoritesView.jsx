import React from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getStageTheme } from '../lib/stageThemes';
import { findAlternativeEntries } from '../lib/lineup';

export default function FavoritesView({
  groupedFavorites,
  filteredFavoriteEntries,
  entries,
  favorites,
  toggleFavorite,
}) {
  return (
    <section className="favorites-view">
      {filteredFavoriteEntries.length === 0 ? (
        <EmptyState text="No favorites found for the current filters." />
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
                      // Use a solid tint for stable backgrounds aligned with the stage colour
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
                                const isAlternativeFavorite = favorites.includes(alternative.id);
                                return (
                                      <div key={alternative.id} className="suggestion-card">
                                        <div>
                                          <strong>{alternative.displayName}</strong>
                                          <p className="muted">
                                            {alternative.stage} • {alternative.day}
                                          </p>
                                          {/* No match details displayed in suggestions */}
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
  );
}
