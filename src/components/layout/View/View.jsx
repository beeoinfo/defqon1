import useHiddenStackLayer from '../../../hooks/useHiddenStackLayer';
import Header from '../Header';
import Box from '@/components/layout/Box';
import '../layout.css';
import './View.css';

const View = ({
  component = 'div',
  navbar = true,
  brandTitle,
  brandLogoSrc,
  profileName,
  profileSubtitle,
  profileImageSrc,
  activeView = null,
  onOpenView = null,
  onOpenSearch = null,
  onBrandClick = null,
  onUserClick = null,
  headerContent = null,
  wideHeaderContent = false,
  hideHeaderBrand = false,
  hideDesktopNavbar = false,
  hideHeaderProfile = false,
  keepMobileNavbarVisible = false,
  inlineHeaderCloseButton = false,
  closeHeaderButtonAriaLabel = 'Close header content',
  onCloseHeaderContent = null,
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
        brandLogoSrc={brandLogoSrc}
        profileName={profileName}
        profileSubtitle={profileSubtitle}
        profileImageSrc={profileImageSrc}
        activeView={activeView}
        onOpenView={onOpenView}
        onOpenSearch={onOpenSearch}
        onBrandClick={onBrandClick}
        onUserClick={onUserClick}
        centerContent={headerContent}
        wideCenterContent={wideHeaderContent}
        hideBrand={hideHeaderBrand}
        hideDesktopNavbar={hideDesktopNavbar}
        hideProfile={hideHeaderProfile}
        keepMobileNavbarVisible={keepMobileNavbarVisible}
        inlineCloseButton={inlineHeaderCloseButton}
        closeButtonAriaLabel={closeHeaderButtonAriaLabel}
        onClosePage={onCloseHeaderContent}
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
