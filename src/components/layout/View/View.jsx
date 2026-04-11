import Header from '../Header';
import Box from '../Box';
import Footer from '../Footer';
import '../layout.css';
import './View.css';

const View = ({
  component = 'div',
  title = null,
  type = 'default',
  navbar = null,
  onClosePage = null,
  onUserClick = null,
  className = '',
  children,
  ...props
}) => {
  const isPageView = type === 'page';
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-view', isPageView ? 'dq-layout-view--page' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Header
        navbar={isPageView ? null : navbar}
        isPageView={isPageView}
        pageTitle={isPageView ? title : null}
        onClosePage={isPageView ? onClosePage : null}
        onUserClick={isPageView ? null : onUserClick}
      >
        {!isPageView ? title : null}
      </Header>

      <Box component="main" className="dq-layout-main dq-layout-view__main dq-layout-container dq-layout-main-shell">
        {children}
      </Box>

      <Footer />
    </Component>
  );
};

export default View;
