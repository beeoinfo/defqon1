import './Element.css';

export default function Element({
  component = 'div',
  className = '',
  children,
  ...props
}) {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-element', className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
}
