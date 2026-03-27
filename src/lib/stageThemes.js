export const stageThemes = {
  RED: {
    accent: "#ef4444",
    accentSoft: "rgba(239, 68, 68, 0.14)",
    accentBorder: "rgba(239, 68, 68, 0.28)",
    accentText: "#fecaca",
    activeText: "#ffffff",
  },
  BLUE: {
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.14)",
    accentBorder: "rgba(56, 189, 248, 0.28)",
    accentText: "#dbeafe",
    activeText: "#ffffff",
  },
  "BLUE Night": {
    accent: "#6366f1",
    accentSoft: "rgba(99, 102, 241, 0.14)",
    accentBorder: "rgba(99, 102, 241, 0.28)",
    accentText: "#e0e7ff",
    activeText: "#ffffff",
  },
  BLACK: {
    accent: "#71717a",
    accentSoft: "rgba(113, 113, 122, 0.18)",
    accentBorder: "rgba(113, 113, 122, 0.28)",
    accentText: "#f4f4f5",
    activeText: "#ffffff",
  },
  INDIGO: {
    accent: "#6366f1",
    accentSoft: "rgba(99, 102, 241, 0.14)",
    accentBorder: "rgba(99, 102, 241, 0.28)",
    accentText: "#e0e7ff",
    activeText: "#ffffff",
  },
  "U.V.": {
    accent: "#d946ef",
    accentSoft: "rgba(217, 70, 239, 0.14)",
    accentBorder: "rgba(217, 70, 239, 0.28)",
    accentText: "#fae8ff",
    activeText: "#ffffff",
  },
  MAGENTA: {
    accent: "#ec4899",
    accentSoft: "rgba(236, 72, 153, 0.14)",
    accentBorder: "rgba(236, 72, 153, 0.28)",
    accentText: "#fce7f3",
    activeText: "#ffffff",
  },
  GREEN: {
    accent: "#22c55e",
    accentSoft: "rgba(34, 197, 94, 0.14)",
    accentBorder: "rgba(34, 197, 94, 0.28)",
    accentText: "#dcfce7",
    activeText: "#ffffff",
  },
  YELLOW: {
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.16)",
    accentBorder: "rgba(250, 204, 21, 0.3)",
    accentText: "#fef9c3",
    activeText: "#111111",
  },
  GOLD: {
    accent: "#eab308",
    accentSoft: "rgba(234, 179, 8, 0.16)",
    accentBorder: "rgba(234, 179, 8, 0.3)",
    accentText: "#fef3c7",
    activeText: "#111111",
  },
  ORANGE: {
    accent: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.14)",
    accentBorder: "rgba(249, 115, 22, 0.28)",
    accentText: "#ffedd5",
    activeText: "#ffffff",
  },
  PURPLE: {
    accent: "#a855f7",
    accentSoft: "rgba(168, 85, 247, 0.14)",
    accentBorder: "rgba(168, 85, 247, 0.28)",
    accentText: "#f3e8ff",
    activeText: "#ffffff",
  },
  SILVER: {
    accent: "#cbd5e1",
    accentSoft: "rgba(203, 213, 225, 0.14)",
    accentBorder: "rgba(203, 213, 225, 0.28)",
    accentText: "#f8fafc",
    activeText: "#111111",
  },
  PINK: {
    accent: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.14)",
    accentBorder: "rgba(251, 113, 133, 0.28)",
    accentText: "#ffe4e6",
    activeText: "#ffffff",
  },
};

export function getStageTheme(stage) {
  return (
    stageThemes[stage] || {
      accent: "#ffffff",
      accentSoft: "rgba(255, 255, 255, 0.08)",
      accentBorder: "rgba(255, 255, 255, 0.14)",
      accentText: "#ffffff",
      activeText: "#111111",
    }
  );
}
