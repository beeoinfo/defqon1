function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function parseColor(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);

    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }

    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);

  if (!rgbMatch) {
    return null;
  }

  const [r, g, b] = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { r, g, b };
}

export function rgbaString(color, alpha) {
  const parsed = typeof color === 'string' ? parseColor(color) : color;

  if (!parsed) {
    return color;
  }

  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${alpha})`;
}

export function mixColors(color, targetColor, amount) {
  const source = typeof color === 'string' ? parseColor(color) : color;
  const target = typeof targetColor === 'string' ? parseColor(targetColor) : targetColor;

  if (!source || !target) {
    return color;
  }

  const ratio = clamp(amount, 0, 1);
  const mixed = {
    r: Math.round((source.r * (1 - ratio)) + (target.r * ratio)),
    g: Math.round((source.g * (1 - ratio)) + (target.g * ratio)),
    b: Math.round((source.b * (1 - ratio)) + (target.b * ratio)),
  };

  return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
}

export function getContrastTextColor(backgroundColor) {
  const color = parseColor(backgroundColor);

  if (!color) {
    return '#111111';
  }

  const luminance =
    ((0.299 * color.r) + (0.587 * color.g) + (0.114 * color.b)) / 255;

  return luminance > 0.5 ? '#111111' : '#ffffff';
}

export function getSurfaceTextColor(color) {
  const parsed = parseColor(color);

  if (!parsed) {
    return '#ffffff';
  }

  return mixColors(parsed, '#ffffff', 0.82);
}

export function buildColorTheme(color) {
  return {
    accent: color,
    accentSoft: rgbaString(color, 0.16),
    accentBorder: rgbaString(color, 0.28),
    accentText: getSurfaceTextColor(color),
    activeText: getContrastTextColor(color),
  };
}

export function buildGhostButtonColorVars(color) {
  const theme = buildColorTheme(color);
  const activeTextColor = theme.activeText;
  const restTextColor = theme.accentText;

  return {
    '--dq-ui-button-bg': rgbaString(color, 0.08),
    '--dq-ui-button-border-color': theme.accentBorder,
    '--dq-ui-button-text-color': restTextColor,
    '--dq-ui-button-hover-bg': theme.accentSoft,
    '--dq-ui-button-hover-border-color': theme.accentBorder,
    '--dq-ui-button-hover-text-color': '#ffffff',
    '--dq-ui-button-focus-bg': color,
    '--dq-ui-button-focus-border-color': color,
    '--dq-ui-button-focus-text-color': activeTextColor,
    '--dq-ui-button-active-bg': color,
    '--dq-ui-button-active-border-color': color,
    '--dq-ui-button-active-text-color': activeTextColor,
    '--dq-ui-button-selected-bg': color,
    '--dq-ui-button-selected-border-color': color,
    '--dq-ui-button-selected-text-color': activeTextColor,
    '--dq-ui-button-selected-hover-bg': color,
    '--dq-ui-button-selected-hover-border-color': color,
    '--dq-ui-button-selected-hover-text-color': activeTextColor,
    '--dq-ui-button-selected-focus-bg': color,
    '--dq-ui-button-selected-focus-border-color': color,
    '--dq-ui-button-selected-focus-text-color': activeTextColor,
    '--dq-ui-button-selected-active-bg': color,
    '--dq-ui-button-selected-active-border-color': color,
    '--dq-ui-button-selected-active-text-color': activeTextColor,
    '--dq-ui-button-subtitle-color': rgbaString(restTextColor, 0.78),
    '--dq-ui-button-hover-subtitle-color': 'rgba(255, 255, 255, 0.8)',
    '--dq-ui-button-focus-subtitle-color': rgbaString(activeTextColor, 0.8),
    '--dq-ui-button-active-subtitle-color': rgbaString(activeTextColor, 0.8),
    '--dq-ui-button-selected-subtitle-color': rgbaString(activeTextColor, 0.8),
    '--dq-ui-button-selected-hover-subtitle-color': rgbaString(activeTextColor, 0.8),
    '--dq-ui-button-selected-focus-subtitle-color': rgbaString(activeTextColor, 0.8),
    '--dq-ui-button-selected-active-subtitle-color': rgbaString(activeTextColor, 0.8),
  };
}
