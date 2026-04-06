import './UiThemeScope.css';

export default function UiThemeScope({ children, className = '', padded = false }) {
  const nextClassName = ['dq-ui-theme', padded ? 'dq-ui-theme--padded' : '', className]
    .filter(Boolean)
    .join(' ');

  return <div className={nextClassName}>{children}</div>;
}
