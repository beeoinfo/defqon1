import React from 'react';

export default function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="summary-card">
      <div className="summary-card__label">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}
