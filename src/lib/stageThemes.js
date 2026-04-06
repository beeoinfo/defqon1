import { buildColorTheme } from './colorStyles';

const neutralTheme = {
  accent: "#FFFFFF",
  accentSoft: "rgba(255, 255, 255, 0.08)",
  accentBorder: "rgba(255, 255, 255, 0.14)",
  accentText: "#FFFFFF",
  activeText: "#111111",
};

export function buildStageTheme(color) {
  if (!color) {
    return neutralTheme;
  }

  const theme = buildColorTheme(color);

  return {
    accent: color,
    accentSoft: theme.accentSoft,
    accentBorder: theme.accentBorder,
    accentText: theme.accentText,
    activeText: theme.activeText,
  };
}

export function getCanonicalStageName(stage) {
  if (!stage || typeof stage !== "string") {
    return stage;
  }
  const value = stage.trim();
  const upper = value.toUpperCase();
  const canonicalStages = [
    "RED",
    "BLUE",
    "BLACK",
    "U.V.",
    "MAGENTA",
    "GREEN",
    "YELLOW",
    "GOLD",
    "PINK",
    "PURPLE",
    "INDIGO",
    "ORANGE",
    "SILVER",
  ];
  const match = canonicalStages.find((stageName) => upper.startsWith(stageName.toUpperCase()));
  if (match) {
    return match;
  }
  if (upper.includes("CLOSING")) {
    return "RED";
  }
  return value;
}

export function getStageTheme(stage) {
  const canonicalStage = getCanonicalStageName(stage);
  return buildStageTheme(canonicalStage && canonicalStage.startsWith('#') ? canonicalStage : null);
}
