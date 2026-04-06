import './View.css';
import '../layout.css';
import Header from '../Header/index';

export default function View({
  component = 'div',
  header = null,
  navbar = null,
  className = '',
  children,
  ...props
}) {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-view', className].filter(Boolean).join(' ')}
    >
      <Header navbar={navbar}>{header}</Header>
      <main className="dq-layout-main dq-layout-view__main dq-layout-container dq-layout-main-shell">
        {children}
      </main>
    </Component>
  );
}
