import React from 'react';

export default function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}
