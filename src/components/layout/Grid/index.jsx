import './Grid.css';

export default function Grid({
  component = 'div',
  columns = '1fr',
  gap = '16px',
  justify = 'stretch',
  alignContent = 'stretch',
  justifyItems = 'stretch',
  alignItems = 'stretch',
  autoFlow = 'row',
  className = '',
  children,
  style,
  ...props
}) {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-grid', className].filter(Boolean).join(' ')}
      style={{
        '--dq-layout-grid-columns': columns,
        '--dq-layout-grid-gap': gap,
        '--dq-layout-grid-justify': justify,
        '--dq-layout-grid-align-content': alignContent,
        '--dq-layout-grid-justify-items': justifyItems,
        '--dq-layout-grid-align-items': alignItems,
        '--dq-layout-grid-auto-flow': autoFlow,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
