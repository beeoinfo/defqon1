import { Check, History, X } from 'lucide-react';

export default function AdvancedSettingsModal({
  open,
  lineups,
  selectedLineupKey,
  onSelectLineup,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel modal-panel--settings" onClick={(event) => event.stopPropagation()}>
        <div className="modal-panel__header">
          <div>
            <h2>Advanced settings</h2>
            <p className="muted">
              Switch temporarily between available lineup JSON files.
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-callout">
          <History size={16} />
          <div>
            <strong>Temporary session setting</strong>
            <p>
              This choice is not persisted after a page reload. When an older lineup is selected, favorites become read-only.
            </p>
          </div>
        </div>

        <div className="lineup-switcher">
          {lineups.map((lineup) => {
            const isSelected = lineup.key === selectedLineupKey;

            return (
              <button
                key={lineup.key}
                type="button"
                className={
                  isSelected
                    ? 'lineup-switcher__item lineup-switcher__item--active'
                    : 'lineup-switcher__item'
                }
                onClick={() => onSelectLineup(lineup.key)}
              >
                <div className="lineup-switcher__content">
                  <div className="lineup-switcher__title-row">
                    <strong>{lineup.label}</strong>
                    {lineup.isLatest && (
                      <span className="lineup-switcher__badge">Latest</span>
                    )}
                  </div>

                  <span className="muted">
                    {lineup.entries.length} entries
                  </span>
                </div>

                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}