import { useEffect, useRef } from 'react';
import logoMark from '../../../assets/logo.svg';
import tribeAvatarSample from '../../../assets/avatars/1.png';
import useMeasuredLayoutMetric from '../../../hooks/useMeasuredLayoutMetric';
import Button from '../../primitives/Button';
import Title from '../../primitives/Title';
import Box from '../Box';
import Navbar from '../Navbar';
import '../layout.css';
import './Header.css';

const Header = ({
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
}) => {
  const Component = component;
  const surfaceRef = useRef(null);
  const mobileNavRef = useRef(null);

  useMeasuredLayoutMetric(surfaceRef, '--dq-layout-header-measured-offset');
  useMeasuredLayoutMetric(mobileNavRef, '--dq-ui-layout-mobile-bottom-nav-offset');

  useEffect(() => {
    if (navbar) {
      return undefined;
    }

    const scope = surfaceRef.current?.closest?.('.dq-ui-theme') ?? document.documentElement;
    scope.style.setProperty('--dq-ui-layout-mobile-bottom-nav-offset', '0px');

    return () => {
      scope.style.removeProperty('--dq-ui-layout-mobile-bottom-nav-offset');
    };
  }, [navbar]);

  const renderNavbar = (navbarContent, navbarClassName = '') => (
    Array.isArray(navbarContent) ? (
      <Navbar items={navbarContent} className={navbarClassName} />
    ) : (
      <Navbar className={navbarClassName}>{navbarContent}</Navbar>
    )
  );

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
};

export default Header;
