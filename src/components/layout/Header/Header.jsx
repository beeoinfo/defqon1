import { useLayoutEffect, useRef } from 'react';
import { XIcon } from '@phosphor-icons/react';
import logoMark from '../../../assets/logo.svg';
import tribeAvatarSample from '../../../assets/avatars/1.png';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import Box from '../Box';
import Navbar from '../Navbar';
import '../layout.css';
import './Header.css';

const getLayoutRoot = (element) => (
  element?.closest?.('.dq-layout-view, .dq-layout-page') ?? null
);

const getThemeScope = (element) => (
  element?.closest?.('.dq-ui-theme') ?? document.documentElement
);

const Header = ({
  component = 'header',
  brandTitle = 'DEFQON',
  brandLogoSrc = logoMark,
  profileName = 'Usera Testa',
  profileSubtitle = '@test',
  profileImageSrc = tribeAvatarSample,
  navbar = null,
  activeView = null,
  onOpenView = null,
  onOpenSearch = null,
  centerContent = null,
  wideCenterContent = false,
  hideBrand = false,
  showCloseButton = true,
  inlineCloseButton = false,
  isPageView = false,
  pageTitle = null,
  onClosePage = null,
  onUserClick = null,
  className = '',
  children,
  ...props
}) => {
  const Component = component;
  const surfaceRef = useRef(null);
  const mobileNavRef = useRef(null);

  useLayoutEffect(() => {
    const headerSurface = surfaceRef.current;
    const layoutRoot = getLayoutRoot(headerSurface);

    if (!headerSurface || !layoutRoot) {
      return undefined;
    }

    const headerBottom = headerSurface.getBoundingClientRect().bottom;

    layoutRoot.style.setProperty('--dq-layout-header-offset', `${headerBottom}px`);
    layoutRoot.style.setProperty('--dq-layout-header-content-offset', `${headerBottom + 20}px`);

    return () => {
      layoutRoot.style.removeProperty('--dq-layout-header-offset');
      layoutRoot.style.removeProperty('--dq-layout-header-content-offset');
    };
  }, []);

  useLayoutEffect(() => {
    const scope = getThemeScope(surfaceRef.current);

    if (!navbar) {
      scope.style.setProperty('--dq-ui-layout-mobile-bottom-nav-offset', '0px');

      return () => {
        scope.style.removeProperty('--dq-ui-layout-mobile-bottom-nav-offset');
      };
    }

    const mobileNavHeight = mobileNavRef.current?.getBoundingClientRect().height ?? 0;

    scope.style.setProperty('--dq-ui-layout-mobile-bottom-nav-offset', `${mobileNavHeight}px`);

    return () => {
      scope.style.removeProperty('--dq-ui-layout-mobile-bottom-nav-offset');
    };
  }, [navbar]);

  const renderNavbar = (navbarContent, navbarClassName = '') => (
    Array.isArray(navbarContent) || navbarContent === true ? (
      <Navbar
        items={Array.isArray(navbarContent) ? navbarContent : []}
        activeView={activeView}
        onOpenView={onOpenView}
        onOpenSearch={onOpenSearch}
        className={navbarClassName}
      />
    ) : (
      <Navbar className={navbarClassName}>{navbarContent}</Navbar>
    )
  );

  const shouldShowPageTitle = isPageView && Boolean(pageTitle);
  const shouldRenderDesktopNavbar = !isPageView && Boolean(navbar);
  const shouldRenderCenterContent = Boolean(centerContent);
  const shouldRenderInlinePageControls =
    isPageView && shouldRenderCenterContent && inlineCloseButton && showCloseButton;
  const shouldRenderBrand = !hideBrand || shouldShowPageTitle;
  const shouldRenderTrailingProfile = isPageView
    ? showCloseButton && !shouldRenderInlinePageControls
    : !shouldRenderInlinePageControls;

  return (
    <Component
      {...props}
      className={['dq-layout-header', className].filter(Boolean).join(' ')}
    >
      <Box ref={surfaceRef} className="dq-layout-header__surface" gap="var(--dq-ui-space-lg)">
        <Box
          className="dq-layout-container dq-layout-header__row"
          justify={shouldRenderInlinePageControls ? 'center' : 'space-between'}
          direction="row"
          align="center"
          gap="16px"
        >
          {shouldRenderBrand ? (
            <Box className="dq-layout-header__brand" direction="row" align="center" gap="12px">
              {shouldShowPageTitle ? (
                <Title component="span" variant="h2" className="dq-layout-header__page-title">
                  {pageTitle}
                </Title>
              ) : (
                <>
                  <img src={brandLogoSrc} alt="" className="dq-layout-header__brand-mark" />
                  <Title component="span" variant="h2" className="dq-layout-header__brand-title">
                    {brandTitle}
                  </Title>
                </>
              )}
            </Box>
          ) : null}

          {shouldRenderDesktopNavbar ? (
            <Box className="dq-layout-header__nav-slot--desktop" justify="center">
              {navbar ? renderNavbar(navbar) : null}
            </Box>
          ) : null}

          {shouldRenderCenterContent ? (
            <Box
              className={[
                'dq-layout-header__center-slot',
                wideCenterContent ? 'dq-layout-header__center-slot--wide' : '',
                shouldRenderInlinePageControls ? 'dq-layout-header__center-slot--inline-page' : '',
              ].filter(Boolean).join(' ')}
              direction="row"
              align="center"
              justify="center"
              gap="var(--dq-ui-space-sm)"
            >
              {centerContent}
              {shouldRenderInlinePageControls ? (
                <Button
                  className="dq-layout-header__inline-close-button"
                  icon={XIcon}
                  ariaLabel="Close page"
                  variant="ghost"
                  size="md"
                  radius="rounded"
                  onClick={onClosePage}
                />
              ) : null}
            </Box>
          ) : null}

          {shouldRenderTrailingProfile ? (
            <Box className="dq-layout-header__profile" justify="flex-end">
              {isPageView ? (
                <Button
                  icon={XIcon}
                  ariaLabel="Close page"
                  variant="ghost"
                  size="md"
                  onClick={onClosePage}
                />
              ) : (
                <Button
                  size="lg"
                  radius="rounded"
                  imageSrc={profileImageSrc}
                  imageAlt=""
                  subtitle={profileSubtitle}
                  onClick={onUserClick}
                >
                  {profileName}
                </Button>
              )}
            </Box>
          ) : null}
        </Box>

        {!isPageView && children ? (
          <Box className="dq-layout-container" gap="var(--dq-ui-space-lg)">
            {children}
          </Box>
        ) : null}
      </Box>

      {navbar ? (
        <Box ref={mobileNavRef} className="dq-layout-header__mobile-nav" gap="0">
          <Box className="dq-layout-header__mobile-nav-shell" gap="0">
            <Box className="dq-layout-container" gap="0">
              {renderNavbar(navbar, 'dq-layout-header__mobile-navbar')}
            </Box>
          </Box>
        </Box>
      ) : null}
    </Component>
  );
};

export default Header;
