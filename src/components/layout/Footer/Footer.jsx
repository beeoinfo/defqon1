import { isStorybookViewEnabled } from '../../../routes/AppRoutes';
import Link from '../../primitives/Link';
import Box from '@/components/layout/Box';
import './Footer.css';

const Footer = ({
  component = 'footer',
  onOpenPage = null,
  onOpenView = null,
  className = '',
  ...props
}) => {
  const Component = component;
  const shouldShowStorybookLink = isStorybookViewEnabled && typeof onOpenView === 'function';

  const footerLinks = [
    {
      id: 'about',
      label: 'About',
      onClick: () => onOpenPage?.('about'),
    },
    {
      id: 'legal',
      label: 'Legal',
      onClick: () => onOpenPage?.('legal'),
    },
    ...(shouldShowStorybookLink ? [{
      id: 'storybook',
      label: 'Storybook',
      onClick: () => onOpenView?.('storybook'),
    }] : []),
  ];

  return (
    <Component
      {...props}
      className={['dq-layout-footer', className].filter(Boolean).join(' ')}
    >
      <Box
        className="dq-layout-container dq-layout-footer__shell"
        direction="column"
        gap="var(--dq-ui-space-xs)"
        style={{ paddingBlock: 'var(--dq-ui-layout-block-padding-top)' }}
      >
        <p className="dq-layout-footer__signature">
          Made with 🩷 by <strong>Dylan Bergozza</strong>
        </p>
        <p className="dq-layout-footer__version">
          <em>v2.1.0</em>
        </p>
        <Box className="dq-layout-footer__links" direction="row" wrap="wrap" gap={0}>
          {footerLinks.map((link) => (
            <span key={link.id} className="dq-layout-footer__link-item">
              <Link onClick={link.onClick}>{link.label}</Link>
            </span>
          ))}
        </Box>
      </Box>
    </Component>
  );
};

export default Footer;
