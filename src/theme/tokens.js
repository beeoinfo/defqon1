export const dqUiBreakpoints = {
  tablet: 576,
  laptop: 891,
  desktop: 1280,
};

export const dqUiBreakpointMedia = {
  tabletUp: `(min-width: ${dqUiBreakpoints.tablet}px)`,
  laptopUp: `(min-width: ${dqUiBreakpoints.laptop}px)`,
  desktopUp: `(min-width: ${dqUiBreakpoints.desktop}px)`,
  phoneDown: `(max-width: ${dqUiBreakpoints.tablet - 0.02}px)`,
  tabletDown: `(max-width: ${dqUiBreakpoints.laptop - 0.02}px)`,
  laptopDown: `(max-width: ${dqUiBreakpoints.desktop - 0.02}px)`,
};
