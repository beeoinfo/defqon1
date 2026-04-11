import Box from '../Box';
import Link from '../../primitives/Link';
import './Footer.css';

const Footer = ({ component = 'footer', className = '', ...props }) => {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-footer', className].filter(Boolean).join(' ')}
    >
      <Box
        className="dq-layout-container dq-layout-footer__shell"
        direction="column"
        gap="var(--dq-ui-space-xs)"
        style={{ paddingTop: 'var(--dq-ui-layout-block-padding-top)' }}
      >
        <p className="dq-layout-footer__signature">
          Made with 🩷 by <strong>Dylan Bergozza</strong>
        </p>
        <p className="dq-layout-footer__version">
          <em>v0.2α</em>
        </p>
        <Box className="dq-layout-footer__links" direction="row" gap="10px" wrap="wrap">
          <Link href="#about">About</Link>
          <Link href="#roadmap">Roadmap</Link>
          <Link href="#legal">Legal</Link>
        </Box>
      </Box>
    </Component>
  );
};

export default Footer;
