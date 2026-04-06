import '../layout.css';
import './Footer.css';
import Box from '../Box/index';

export default function Footer({ component = 'footer', className = '', children, ...props }) {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-footer', className].filter(Boolean).join(' ')}
    >
      <Box className="dq-layout-container dq-layout-footer__shell">{children}</Box>
    </Component>
  );
}
