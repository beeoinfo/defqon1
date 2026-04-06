import './Page.css';
import '../layout.css';
import Footer from '../Footer/index';
import Header from '../Header/index';

export default function Page({
  component = 'div',
  header = null,
  footer = null,
  className = '',
  children,
  ...props
}) {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-page', className].filter(Boolean).join(' ')}
    >
      <Header>{header}</Header>
      <main className="dq-layout-main dq-layout-container dq-layout-main-shell">{children}</main>
      <Footer>{footer}</Footer>
    </Component>
  );
}
