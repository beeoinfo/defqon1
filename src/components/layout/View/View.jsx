import useHiddenStackLayer from '../../../hooks/useHiddenStackLayer';
import Header from '../Header';
import Box from '@/components/layout/Box';
import '../layout.css';
import './View.css';

const View = ({
  component = 'div',
  navbar = true,
  brandTitle,
  profileName,
  profileSubtitle,
  profileImageSrc,
  activeView = null,
  onOpenView = null,
  onOpenSearch = null,
  onUserClick = null,
  headerTransitionState = 'open',
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
        brandTitle={brandTitle}
        profileName={profileName}
        profileSubtitle={profileSubtitle}
        profileImageSrc={profileImageSrc}
        activeView={activeView}
        onOpenView={onOpenView}
        onOpenSearch={onOpenSearch}
        onUserClick={onUserClick}
        contentTransitionState={headerTransitionState}
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
