import Footer from '../Footer';
import Header from '../Header';
import Box from '../Box';
import '../layout.css';
import './Page.css';

const Page = ({
  component = 'div',
  header = null,
  footer = null,
  className = '',
  children,
  ...props
}) => {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-page', className].filter(Boolean).join(' ')}
    >
      <Header>{header}</Header>
      <Box component="main" className="dq-layout-main dq-layout-container dq-layout-main-shell">
        {children}
      </Box>
      <Footer>{footer}</Footer>
    </Component>
  );
};

export default Page;
