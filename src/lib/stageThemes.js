function buildTheme(accent) {
  return {
    accent,
    accentSoft: `${accent}24`,
    accentBorder: `${accent}55`,
    accentText: "#FFFFFF", // Inactive stage badges
    activeText: "#111111", // Active stage badges + stage card pills
  };
}

export const stageThemes = {
  RED: buildTheme("#FF0000"),
  BLUE: buildTheme("#0BDBEF"),
  BLACK: buildTheme("#878787"),
  "U.V.": buildTheme("#D492FF"),
  MAGENTA: buildTheme("#FF008B"),
  GREEN: buildTheme("#00FF00"),
  YELLOW: buildTheme("#F1E300"),
  GOLD: buildTheme("#BB9551"),
  PINK: buildTheme("#EF81A0"),
  PURPLE: buildTheme("#A100FF"),
  INDIGO: buildTheme("#3842DA"),
  ORANGE: buildTheme("#FF6500"),
  SILVER: buildTheme("#DADADA"),
};

const neutralTheme = {
  accent: "#FFFFFF",
  accentSoft: "rgba(255, 255, 255, 0.08)",
  accentBorder: "rgba(255, 255, 255, 0.14)",
  accentText: "#FFFFFF",
  activeText: "#111111",
};

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

  const match = canonicalStages.find((stageName) =>
    upper.startsWith(stageName.toUpperCase())
  );

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
  return stageThemes[canonicalStage] || neutralTheme;
}