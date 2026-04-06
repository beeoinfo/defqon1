import './Title.css';

export default function Title({
  component = 'h2',
  variant,
  className = '',
  children,
  ...props
}) {
  const Component = component;
  const resolvedVariant = variant ?? (/^h[1-6]$/.test(component) ? component : 'h2');

  return (
    <Component
      {...props}
      className={['dq-ui-title', `dq-ui-title--${resolvedVariant}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Component>
  );
}
