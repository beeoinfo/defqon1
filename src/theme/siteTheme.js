import { getSurfaceTextColor, mixColors, rgbaString } from '@/lib/colorStyles';
import { DEFAULT_SITE_THEME } from '@/sites/siteRegistry';

const getColor = (color, fallback) => String(color ?? fallback).trim() || fallback;

export const buildSiteThemeStyle = (theme = {}) => {
  const primary = getColor(theme.primary, DEFAULT_SITE_THEME.primary);
  const secondary = getColor(theme.secondary, DEFAULT_SITE_THEME.secondary);

  return {
    '--dq-site-primary': primary,
    '--dq-site-secondary': secondary,
    '--dq-ui-primary': primary,
    '--dq-ui-primary-soft': mixColors(primary, '#ffffff', 0.82),
    '--dq-ui-primary-muted': mixColors(primary, '#ffffff', 0.28),
    '--dq-ui-primary-surface': rgbaString(primary, 0.18),
    '--dq-ui-primary-surface-strong': rgbaString(primary, 0.22),
    '--dq-ui-secondary': secondary,
    '--dq-ui-secondary-soft': mixColors(secondary, '#ffffff', 0.78),
    '--dq-ui-secondary-muted': mixColors(secondary, '#ffffff', 0.32),
    '--dq-ui-secondary-surface': rgbaString(secondary, 0.16),
    '--dq-ui-secondary-surface-strong': rgbaString(secondary, 0.24),
    '--dq-ui-accent': secondary,
    '--dq-ui-accent-strong': secondary,
    '--dq-ui-accent-soft': getSurfaceTextColor(secondary),
  };
};
