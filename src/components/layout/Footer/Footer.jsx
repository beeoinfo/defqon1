import Box from '../Box';
import Link from '../../primitives/Link';
import './Footer.css';

const Footer = ({ component = 'footer', onOpenPage = null, className = '', ...props }) => {
  const Component = component;

  const handleOpenAbout = () => {
    onOpenPage?.('about');
  };

  const handleOpenRoadmap = () => {
    onOpenPage?.('roadmap');
  };

  const handleOpenLegal = () => {
    onOpenPage?.('legal');
  };

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
          <em>v0.2α</em>
        </p>
        <Box className="dq-layout-footer__links" direction="row" wrap="wrap" gap={0}>
          <Link onClick={handleOpenAbout}>About</Link>
          <span className="dq-layout-footer__separator" aria-hidden="true">•</span>
          <Link onClick={handleOpenRoadmap}>Roadmap</Link>
          <span className="dq-layout-footer__separator" aria-hidden="true">•</span>
          <Link onClick={handleOpenLegal}>Legal</Link>
        </Box>
      </Box>
    </Component>
  );
};

export default Footer;
