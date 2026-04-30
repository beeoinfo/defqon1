import React from 'react';
import Alert from '../Alert';
import './EmptyState.css';

const EmptyState = ({
  title = 'Nothing to show',
  text = null,
  className = '',
}) => {
  return (
    <Alert variant="neutral" title={title} className={className}>
      {text}
    </Alert>
  );
};

export default EmptyState;
