import { useLayoutEffect, useRef } from 'react';
import { UserIcon, XIcon } from '@phosphor-icons/react';
import logoMark from '../../../assets/logo.svg';
import tribeAvatarSample from '../../../assets/avatars/1.png';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import Box from '@/components/layout/Box';
import Navbar from '../Navbar';
import '../layout.css';
import './Header.css';

const getLayoutRoot = (element) => (
  element?.closest?.('.dq-layout-view, .dq-layout-page') ?? null
);

const getThemeScope = (element) => (
  element?.closest?.('.dq-ui-theme') ?? document.documentElement
);

const getPixelCustomProperty = (element, propertyName, fallbackValue = 0) => {
  if (!element) {
    return fallbackValue;
  }

  const parsedValue = Number.parseFloat(getComputedStyle(element).getPropertyValue(propertyName));

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

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
  contentTransitionState = 'open',
  hideBrand = false,
  hideDesktopNavbar = false,
  hideProfile = false,
  keepMobileNavbarVisible = false,
  showCloseButton = true,
  inlineCloseButton = false,
  closeButtonAriaLabel = 'Close page',
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
    const stickyGap = getPixelCustomProperty(layoutRoot, '--dq-layout-sticky-gap', 14);

    layoutRoot.style.setProperty('--dq-layout-header-offset', `${headerBottom}px`);
    layoutRoot.style.setProperty('--dq-layout-header-content-offset', `${headerBottom + stickyGap}px`);

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

    const syncMobileNavOffset = () => {
      const mobileNavHeight = mobileNavRef.current?.getBoundingClientRect().height ?? 0;

      scope.style.setProperty('--dq-ui-layout-mobile-bottom-nav-offset', `${mobileNavHeight}px`);
    };

    syncMobileNavOffset();
    window.addEventListener('resize', syncMobileNavOffset, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === 'function' && mobileNavRef.current
        ? new ResizeObserver(syncMobileNavOffset)
        : null;

    resizeObserver?.observe(mobileNavRef.current);

    return () => {
      window.removeEventListener('resize', syncMobileNavOffset);
      resizeObserver?.disconnect();
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
  const shouldRenderDesktopNavbar = !isPageView && Boolean(navbar) && !hideDesktopNavbar;
  const shouldRenderCenterContent = Boolean(centerContent);
  const shouldRenderInlinePageControls =
    shouldRenderCenterContent && inlineCloseButton && showCloseButton;
  const shouldRenderBrand = !hideBrand || shouldShowPageTitle;
  const shouldRenderTrailingProfile = !hideProfile && (
    isPageView
      ? showCloseButton && !shouldRenderInlinePageControls
      : !shouldRenderInlinePageControls
  );

  return (
    <Component
      {...props}
      className={['dq-layout-header', className].filter(Boolean).join(' ')}
      data-content-transition={contentTransitionState}
      data-keep-mobile-navbar-visible={keepMobileNavbarVisible ? 'true' : undefined}
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
            <Box
              className="dq-layout-header__brand dq-layout-header__motion-item dq-layout-header__motion-item--1"
              direction="row"
              align="center"
              gap="12px"
            >
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
            <Box
              className="dq-layout-header__nav-slot--desktop dq-layout-header__motion-item dq-layout-header__motion-item--2"
              justify="center"
            >
              {navbar ? renderNavbar(navbar) : null}
            </Box>
          ) : null}

          {shouldRenderCenterContent ? (
            <Box
              className={[
                'dq-layout-header__center-slot',
                'dq-layout-header__motion-item',
                'dq-layout-header__motion-item--2',
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
                  ariaLabel={closeButtonAriaLabel}
                  variant="ghost"
                  size="md"
                  radius="rounded"
                  onClick={onClosePage}
                />
              ) : null}
            </Box>
          ) : null}

          {shouldRenderTrailingProfile ? (
            <Box
              className="dq-layout-header__profile dq-layout-header__motion-item dq-layout-header__motion-item--3"
              justify="flex-end"
            >
              {isPageView ? (
                <Button
                  icon={XIcon}
                  ariaLabel={closeButtonAriaLabel}
                  variant="ghost"
                  size="md"
                  onClick={onClosePage}
                />
              ) : (
                <Button
                  size="lg"
                  radius="rounded"
                  icon={profileImageSrc ? null : UserIcon}
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
          <Box
            className="dq-layout-header__mobile-nav-shell"
            gap="0"
          >
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
