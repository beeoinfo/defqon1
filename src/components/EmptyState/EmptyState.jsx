import React from 'react';
import useI18n from '@/hooks/useI18n';
import Alert from '../Alert';
import './EmptyState.css';

const EmptyState = ({
  title = 'Nothing to show',
  text = null,
  className = '',
}) => {
  const { t } = useI18n();

  return (
    <Alert variant="neutral" title={t(title)} className={className}>
      {text}
    </Alert>
  );
};

export default EmptyState;
