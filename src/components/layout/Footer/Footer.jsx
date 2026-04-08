import Box from '../Box';
import '../layout.css';
import './Footer.css';

const Footer = ({ component = 'footer', className = '', children, ...props }) => {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-footer', className].filter(Boolean).join(' ')}
    >
      <Box className="dq-layout-container dq-layout-footer__shell">{children}</Box>
    </Component>
  );
};

export default Footer;
