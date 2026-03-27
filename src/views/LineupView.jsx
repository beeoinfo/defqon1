import React from 'react';
import FavoriteStar from '../components/FavoriteStar';
import EmptyState from '../components/EmptyState';
import { getStageTheme } from '../lib/stageThemes';

export default function LineupView({ groupedEntries, favorites, toggleFavorite }) {
  return (
    <section className="content-grid">
      {Object.keys(groupedEntries).length === 0 ? (
        <EmptyState text="Aucune entrée trouvée." />
      ) : (
        Object.entries(groupedEntries).map(([day, dayStages]) => (
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
                            color: theme.activeText,
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
  );
}
