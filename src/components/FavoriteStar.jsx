import React, { memo } from 'react';
import { Star } from 'lucide-react';

/**
 * Render a star icon that toggles the favourite state of an entry. When
 * active the star appears filled according to the CSS in index.css. The
 * button is accessible via title and aria‑label attributes.
 *
 * Props:
 *   active (boolean): Whether the entry is currently marked as a favourite.
 *   onClick (function): Handler invoked when the star is clicked.
 *   title (string): Accessible label for assistive technologies.
 */
function FavoriteStar({ active, onClick, title = 'Toggle favorite' }) {
  return (
    <button
      type="button"
      className={active ? 'star-button star-button--active' : 'star-button'}
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      {/* Size 16 matches the original design */}
      <Star size={16} />
    </button>
  );
}

export default memo(FavoriteStar);
