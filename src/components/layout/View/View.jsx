import useHiddenStackLayer from '../../../hooks/useHiddenStackLayer';
import Header from '../Header';
import Box from '../Box';
import '../layout.css';
import './View.css';

const View = ({
  component = 'div',
  navbar = true,
  activeView = null,
  onOpenView = null,
  onOpenSearch = null,
  onUserClick = null,
  isHidden = false,
  className = '',
  children,
  ...props
}) => {
  const Component = component;
  const layerRef = useHiddenStackLayer(isHidden);

  return (
    <Component
      {...props}
      ref={layerRef}
      className={['dq-layout-view', isHidden ? 'dq-layout-view--hidden-stack' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Header
        navbar={navbar}
        activeView={activeView}
        onOpenView={onOpenView}
        onOpenSearch={onOpenSearch}
        onUserClick={onUserClick}
      >
        {null}
      </Header>

      <Box component="main" className="dq-layout-main dq-layout-view__main dq-layout-container dq-layout-main-shell">
        {children}
      </Box>
    </Component>
  );
};

export default View;
