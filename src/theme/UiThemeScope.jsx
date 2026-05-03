import { activeSite } from '@/sites/siteDefinitions';
import { buildSiteThemeStyle } from './siteTheme';
import './UiThemeScope.css';

const activeSiteThemeStyle = buildSiteThemeStyle(activeSite.theme);

export default function UiThemeScope({
  children,
  className = '',
  padded = false,
  style,
}) {
  const nextClassName = ['dq-ui-theme', padded ? 'dq-ui-theme--padded' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={nextClassName}
      data-site-slug={activeSite.slug}
      style={{
        ...activeSiteThemeStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
