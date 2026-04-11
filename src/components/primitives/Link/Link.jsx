import './Link.css';

const Link = ({ href, onClick, className = '', children, target, rel, ...props }) => {
  const classNames = ['dq-ui-link', className].filter(Boolean).join(' ');

  if (href) {
    return (
      <a
        {...props}
        href={href}
        target={target}
        rel={rel}
        className={classNames}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...props}
      type="button"
      onClick={onClick}
      className={classNames}
    >
      {children}
    </button>
  );
};

export default Link;
