import React from 'react';

/**
 * A small pill‑shaped button used to filter by day or stage. The
 * appearance of the badge changes based on whether it is active and
 * the provided theme. This component mirrors the original project so
 * that existing styling and logic continue to work.
 *
 * Props:
 *   label (string): Text to display inside the badge.
 *   active (boolean): Whether the badge is currently active.
 *   onClick (function): Handler invoked when the badge is clicked.
 *   theme (object): Colour definitions for the badge. When active the
 *     accent colour is used for the background and border; when
 *     inactive a softer accent is used.
 */
export function getStageBadgeStyles(theme, active) {
  return active
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
}

export default function StageBadge({ label, active, onClick, theme }) {
  const styles = getStageBadgeStyles(theme, active);

  return (
    <button
      type="button"
      className={active ? 'filter-badge filter-chip filter-badge--active' : 'filter-badge filter-chip'}
      onClick={onClick}
      style={styles}
    >
      {label}
    </button>
  );
}
