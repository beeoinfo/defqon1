import '../layout.css';
import './Header.css';
import { useEffect, useRef } from 'react';
import logoMark from '../../../assets/logo.svg';
import tribeAvatarSample from '../../../assets/avatars/1.png';
import Box from '../Box/index';
import Button from '../../primitives/Button/index';
import Title from '../../primitives/Title/index';
import Navbar from '../Navbar/index';

function getLayoutMetricScope(element) {
  return element?.closest?.('.dq-ui-theme') ?? document.documentElement;
}

function useMeasuredLayoutMetric(ref, propertyName) {
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const scope = getLayoutMetricScope(element);

    function syncMetric() {
      scope.style.setProperty(propertyName, `${element.getBoundingClientRect().height}px`);
    }

    syncMetric();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncMetric);

      return () => {
        window.removeEventListener('resize', syncMetric);
        scope.style.removeProperty(propertyName);
      };
    }

    const resizeObserver = new ResizeObserver(syncMetric);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      scope.style.removeProperty(propertyName);
    };
  }, [propertyName, ref]);
}

function renderNavbar(navbar, className = '') {
  return Array.isArray(navbar) ? (
    <Navbar items={navbar} className={className} />
  ) : (
    <Navbar className={className}>{navbar}</Navbar>
  );
}

export default function Header({
  component = 'header',
  brandTitle = 'DEFQON',
  brandLogoSrc = logoMark,
  profileName = 'Usera Testa',
  profileSubtitle = '@test',
  profileImageSrc = tribeAvatarSample,
  navbar = null,
  className = '',
  children,
  ...props
}) {
  const Component = component;
  const surfaceRef = useRef(null);
  const mobileNavRef = useRef(null);

  useMeasuredLayoutMetric(surfaceRef, '--dq-layout-header-measured-offset');
  useMeasuredLayoutMetric(mobileNavRef, '--dq-ui-layout-mobile-bottom-nav-offset');

  useEffect(() => {
    if (navbar) {
      return undefined;
    }

    const scope = getLayoutMetricScope(surfaceRef.current);
    scope.style.setProperty('--dq-ui-layout-mobile-bottom-nav-offset', '0px');

    return () => {
      scope.style.removeProperty('--dq-ui-layout-mobile-bottom-nav-offset');
    };
  }, [navbar]);

  return (
    <Component
      {...props}
      className={['dq-layout-header', className].filter(Boolean).join(' ')}
    >
      <Box ref={surfaceRef} className="dq-layout-header__surface" gap="var(--dq-ui-space-lg)">
        <Box
          className="dq-layout-container dq-layout-header__row"
          direction="row"
          align="center"
          justify="space-between"
          gap="16px"
        >
          <Box className="dq-layout-header__brand" direction="row" align="center" gap="12px">
            <img src={brandLogoSrc} alt="" className="dq-layout-header__brand-mark" />
            <Title component="span" variant="h2" className="dq-layout-header__brand-title">
              {brandTitle}
            </Title>
          </Box>

          <Box className="dq-layout-header__nav-slot--desktop" justify="center">
            {navbar ? renderNavbar(navbar) : null}
          </Box>

          <Box className="dq-layout-header__profile" justify="flex-end">
            <Button
              size="lg"
              radius="rounded"
              imageSrc={profileImageSrc}
              imageAlt=""
              subtitle={profileSubtitle}
            >
              {profileName}
            </Button>
          </Box>
        </Box>

        {children ? (
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
}
