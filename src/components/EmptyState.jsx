import React from 'react';

/**
 * Render a simple empty state message. This component is used across
 * multiple pages when no results are available after filtering or
 * searching. It accepts a single text prop to display a friendly
 * message to the user.
 *
 * Props:
 *   text (string): Message to show inside the empty state.
 */
export default function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}