import Header from '../Header';
import Box from '../Box';
import '../layout.css';
import './View.css';

const View = ({
  component = 'div',
  header = null,
  navbar = null,
  className = '',
  children,
  ...props
}) => {
  const Component = component;

  return (
    <Component
      {...props}
      className={['dq-layout-view', className].filter(Boolean).join(' ')}
    >
      <Header navbar={navbar}>{header}</Header>
      <Box component="main" className="dq-layout-main dq-layout-view__main dq-layout-container dq-layout-main-shell">
        {children}
      </Box>
    </Component>
  );
};

export default View;
