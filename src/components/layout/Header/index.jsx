import '../layout.css';
import './Header.css';
import logoMark from '../../../assets/logo.svg';
import tribeAvatarSample from '../../../assets/avatars/1.png';
import Box from '../Box/index';
import Button from '../../primitives/Button/index';
import Title from '../../primitives/Title/index';
import Navbar from '../Navbar/index';

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

  return (
    <Component
      {...props}
      className={['dq-layout-header', className].filter(Boolean).join(' ')}
    >
      <Box className="dq-layout-header__surface" gap="var(--dq-ui-space-lg)">
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
            {navbar ? <Navbar>{navbar}</Navbar> : null}
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
        <Box className="dq-layout-header__mobile-nav" gap="0">
          <Box className="dq-layout-header__mobile-nav-shell" gap="0">
            <Box className="dq-layout-container" gap="0">
              <Navbar className="dq-layout-header__mobile-navbar">{navbar}</Navbar>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Component>
  );
}
