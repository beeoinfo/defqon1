import Alert from './Alert';

const EmptyState = ({
  title = 'Nothing to show',
  text,
}) => (
  <Alert variant="neutral" title={title}>
    {text}
  </Alert>
);

export default EmptyState;
