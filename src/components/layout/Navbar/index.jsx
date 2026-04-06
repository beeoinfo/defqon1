import './Navbar.css';

export default function Navbar({ component = 'nav', className = '', children, ...props }) {
  const Component = component;

  return (
    <Component {...props} className={['dq-layout-navbar', className].filter(Boolean).join(' ')}>
      {children}
    </Component>
  );
}
