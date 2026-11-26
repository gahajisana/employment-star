import type { ThemeConfig } from "antd";

// Scope the reference palette to the homepage, leaving other routes untouched.
export const HOME_THEME: ThemeConfig = {
  cssVar: { key: "home" },
  token: {
    colorPrimary: "#265ff3",
    colorInfo: "#265ff3",
    colorInfoBg: "#bfddff",
    colorError: "#ff3025",
    colorErrorBg: "#fff1f0",
    colorBgLayout: "#f9f8f9",
    colorText: "#1c1c20",
    colorTextSecondary: "#85858f",
    colorTextPlaceholder: "#85858f",
    colorBorder: "#e2e2e8",
    colorBorderSecondary: "#e7e9f0",
    borderRadius: 8,
    borderRadiusLG: 10,
    controlHeight: 38,
    controlHeightSM: 30,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSizeHeading1: 28,
    fontSizeHeading2: 18,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    boxShadowTertiary: "0 3px 12px rgba(25, 35, 65, 0.05)",
  },
  components: {
    Avatar: { borderRadius: 0, colorTextPlaceholder: "#d9d9d9" },
    Button: { primaryShadow: "none", defaultShadow: "none", paddingInline: 18 },
    Card: { bodyPadding: 20, bodyPaddingSM: 18 },
    Form: { itemMarginBottom: 0 },
    Select: { colorTextPlaceholder: "#1c1c20" },
    Tag: { borderRadiusSM: 12 },
    Typography: { titleMarginTop: 0, titleMarginBottom: 0 },
  },
};
