export const dqUiTokens = {
  colors: {
    bg: '#09090b',
    white: '#ffffff',
    black: '#111111',
    blackSoft: 'rgba(17, 17, 17, 0.7)',
    whiteSoftStrong: 'rgba(255, 255, 255, 0.74)',
    appBackground:
      'radial-gradient(circle at 14% 18%, rgba(11, 219, 239, .12), transparent 26%), radial-gradient(circle at 82% 16%, rgba(255, 0, 139, .1), transparent 24%), radial-gradient(circle at 22% 78%, rgba(0, 255, 0, .08), transparent 24%), radial-gradient(circle at 76% 74%, rgba(161, 0, 255, .1), transparent 28%), radial-gradient(circle at 52% 46%, rgba(241, 227, 0, .05), transparent 30%), linear-gradient(180deg, #12161c, #0f1318)',
    surface: 'rgba(255, 255, 255, 0.04)',
    panel: 'rgba(255, 255, 255, 0.05)',
    panelStrong: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderFaint: 'rgba(255, 255, 255, 0.06)',
    text: 'rgba(255, 255, 255, 0.92)',
    textSoft: 'rgba(255, 255, 255, 0.65)',
    primary: '#bc9b5e',
    primarySoft: '#f6ecd4',
    primaryMuted: '#ccb072',
    primarySurface: 'rgba(188, 155, 94, 0.18)',
    primarySurfaceStrong: 'rgba(188, 155, 94, 0.22)',
    accent: '#ef4444',
    accentSoft: '#fecaca',
    yellow: '#facc15',
    favoriteSurface: 'rgba(133, 77, 14, 0.3)',
    favoriteBorder: 'rgba(250, 204, 21, 0.26)',
    favoriteSurfaceHover: 'rgba(217, 119, 6, 0.24)',
    favoriteSurfaceStrong: 'rgba(217, 119, 6, 0.28)',
    favoriteBorderHover: 'rgba(251, 191, 36, 0.48)',
    favoriteBorderStrong: 'rgba(251, 191, 36, 0.54)',
    favoriteTextSoft: '#fde68a',
    favoriteTextStrong: '#fef3c7',
    info: '#60a5fa',
    infoSurface: 'rgba(37, 99, 235, 0.22)',
    infoBorder: 'rgba(96, 165, 250, 0.28)',
    warning: '#f59e0b',
    warningSurface: 'rgba(180, 83, 9, 0.22)',
    warningBorder: 'rgba(245, 158, 11, 0.28)',
    success: '#bbf7d0',
    successSurface: 'rgba(21, 128, 61, 0.22)',
    successBorder: 'rgba(34, 197, 94, 0.28)',
    dangerSurface: 'rgba(127, 29, 29, 0.3)',
    dangerSurfaceHover: 'rgba(127, 29, 29, 0.4)',
    dangerSurfaceStrong: 'rgba(127, 29, 29, 0.52)',
    dangerBorder: 'rgba(239, 68, 68, 0.26)',
    dangerBorderStrong: 'rgba(239, 68, 68, 0.38)',
    dangerTextSoft: 'rgba(254, 202, 202, 0.82)',
    backdrop: 'rgba(9, 9, 11, 0.42)',
  },
  effects: {
    backgroundBlurFilter: 'blur(24px) saturate(140%)',
    backgroundBlurFilterFloating: 'blur(14px) saturate(120%)',
    backgroundBlurSurface: 'linear-gradient(180deg, #1c222aad, #161b228f)',
    backgroundBlurSurfaceHover: 'linear-gradient(180deg, #242b34c7, #1b2128b8)',
    transitionFast: '0.2s ease',
    transitionUi: '0.16s ease',
  },
  radius: {
    md: '14px',
    lg: '20px',
    xl: '24px',
    rounded: '999px',
  },
  spacing: {
    xs: '6px',
    sm: '8px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    xxl: '22px',
    xxxl: '24px',
  },
  layout: {
    maxWidth: '1200px',
    inlinePadding: 'clamp(16px, 3vw, 32px)',
    blockPaddingTop: '24px',
    blockPaddingBottom: '40px',
    mobileBottomNavControlSize: '42px',
  },
};

export function createDqUiThemeCss(tokens = dqUiTokens) {
  return `
    .dq-ui-theme {
      --dq-ui-bg: ${tokens.colors.bg};
      --dq-ui-color-white: ${tokens.colors.white};
      --dq-ui-color-black: ${tokens.colors.black};
      --dq-ui-color-black-soft: ${tokens.colors.blackSoft};
      --dq-ui-color-white-soft-strong: ${tokens.colors.whiteSoftStrong};
      --dq-ui-surface: ${tokens.colors.surface};
      --dq-ui-panel: ${tokens.colors.panel};
      --dq-ui-panel-strong: ${tokens.colors.panelStrong};
      --dq-ui-border: ${tokens.colors.border};
      --dq-ui-border-subtle: ${tokens.colors.borderSubtle};
      --dq-ui-border-faint: ${tokens.colors.borderFaint};
      --dq-ui-text: ${tokens.colors.text};
      --dq-ui-text-soft: ${tokens.colors.textSoft};
      --dq-ui-primary: ${tokens.colors.primary};
      --dq-ui-primary-soft: ${tokens.colors.primarySoft};
      --dq-ui-primary-muted: ${tokens.colors.primaryMuted};
      --dq-ui-primary-surface: ${tokens.colors.primarySurface};
      --dq-ui-primary-surface-strong: ${tokens.colors.primarySurfaceStrong};
      --dq-ui-accent: ${tokens.colors.accent};
      --dq-ui-accent-soft: ${tokens.colors.accentSoft};
      --dq-ui-yellow: ${tokens.colors.yellow};
      --dq-ui-favorite-surface: ${tokens.colors.favoriteSurface};
      --dq-ui-favorite-border: ${tokens.colors.favoriteBorder};
      --dq-ui-favorite-surface-hover: ${tokens.colors.favoriteSurfaceHover};
      --dq-ui-favorite-surface-strong: ${tokens.colors.favoriteSurfaceStrong};
      --dq-ui-favorite-border-hover: ${tokens.colors.favoriteBorderHover};
      --dq-ui-favorite-border-strong: ${tokens.colors.favoriteBorderStrong};
      --dq-ui-favorite-text-soft: ${tokens.colors.favoriteTextSoft};
      --dq-ui-favorite-text-strong: ${tokens.colors.favoriteTextStrong};
      --dq-ui-info: ${tokens.colors.info};
      --dq-ui-info-surface: ${tokens.colors.infoSurface};
      --dq-ui-info-border: ${tokens.colors.infoBorder};
      --dq-ui-warning: ${tokens.colors.warning};
      --dq-ui-warning-surface: ${tokens.colors.warningSurface};
      --dq-ui-warning-border: ${tokens.colors.warningBorder};
      --dq-ui-success: ${tokens.colors.success};
      --dq-ui-success-surface: ${tokens.colors.successSurface};
      --dq-ui-success-border: ${tokens.colors.successBorder};
      --dq-ui-danger-surface: ${tokens.colors.dangerSurface};
      --dq-ui-danger-surface-hover: ${tokens.colors.dangerSurfaceHover};
      --dq-ui-danger-surface-strong: ${tokens.colors.dangerSurfaceStrong};
      --dq-ui-danger-border: ${tokens.colors.dangerBorder};
      --dq-ui-danger-border-strong: ${tokens.colors.dangerBorderStrong};
      --dq-ui-danger-text-soft: ${tokens.colors.dangerTextSoft};
      --dq-ui-backdrop: ${tokens.colors.backdrop};
      --dq-ui-radius-md: ${tokens.radius.md};
      --dq-ui-radius-lg: ${tokens.radius.lg};
      --dq-ui-radius-xl: ${tokens.radius.xl};
      --dq-ui-radius-rounded: ${tokens.radius.rounded};
      --dq-ui-space-xs: ${tokens.spacing.xs};
      --dq-ui-space-sm: ${tokens.spacing.sm};
      --dq-ui-space-md: ${tokens.spacing.md};
      --dq-ui-space-lg: ${tokens.spacing.lg};
      --dq-ui-space-xl: ${tokens.spacing.xl};
      --dq-ui-space-xxl: ${tokens.spacing.xxl};
      --dq-ui-space-xxxl: ${tokens.spacing.xxxl};
      --dq-ui-layout-max-width: ${tokens.layout.maxWidth};
      --dq-ui-layout-inline-padding: ${tokens.layout.inlinePadding};
      --dq-ui-layout-block-padding-top: ${tokens.layout.blockPaddingTop};
      --dq-ui-layout-block-padding-bottom: ${tokens.layout.blockPaddingBottom};
      --dq-ui-layout-mobile-bottom-nav-control-size: ${tokens.layout.mobileBottomNavControlSize};
      --dq-ui-layout-mobile-bottom-nav-offset: calc(
        var(--dq-ui-layout-mobile-bottom-nav-control-size) +
        (var(--dq-ui-space-xs) * 2) +
        1px +
        env(safe-area-inset-bottom, 0px)
      );
      color: var(--dq-ui-text);
      font-family: 'Roboto', Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --dq-ui-background-blur-filter: ${tokens.effects.backgroundBlurFilter};
      --dq-ui-background-blur-filter-floating: ${tokens.effects.backgroundBlurFilterFloating};
      --dq-ui-background-blur-surface: ${tokens.effects.backgroundBlurSurface};
      --dq-ui-background-blur-surface-hover: ${tokens.effects.backgroundBlurSurfaceHover};
      --dq-ui-transition-fast: ${tokens.effects.transitionFast};
      --dq-ui-transition-ui: ${tokens.effects.transitionUi};
    }

    .dq-ui-theme,
    .dq-ui-theme *,
    .dq-ui-theme *::before,
    .dq-ui-theme *::after {
      box-sizing: border-box;
    }

    .dq-ui-theme button,
    .dq-ui-theme input {
      font: inherit;
    }
  `;
}
