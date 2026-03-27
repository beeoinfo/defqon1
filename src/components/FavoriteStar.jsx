import React from 'react';
import { Star } from 'lucide-react';

export default function FavoriteStar({ active, onClick, title = 'Toggle favorite' }) {
  return (
    <button
      type="button"
      className={active ? 'star-button star-button--active' : 'star-button'}
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      <Star size={16} />
    </button>
  );
}
