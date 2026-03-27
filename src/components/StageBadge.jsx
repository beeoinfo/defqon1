import React from 'react';

export default function StageBadge({ label, active, onClick, theme }) {
  const styles = active
    ? {
        background: theme.accent,
        borderColor: theme.accent,
        color: theme.activeText,
        boxShadow: `0 0 0 1px ${theme.accentBorder} inset`,
      }
    : {
        background: theme.accentSoft,
        borderColor: theme.accentBorder,
        color: theme.accentText,
      };

  return (
    <button
      type="button"
      className={active ? 'filter-badge filter-badge--active' : 'filter-badge'}
      onClick={onClick}
      style={styles}
    >
      {label}
    </button>
  );
}
