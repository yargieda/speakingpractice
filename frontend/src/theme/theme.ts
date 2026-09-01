// Central design tokens — sourced from /app/design_guidelines.json
// Personality: iOS-Native Clean / academic. Font weights capped at 500.
// BANNED: no blue / purple / indigo / navy anywhere.

export const colors = {
  surface: "#FAF9F6",
  onSurface: "#1C1917",
  surfaceSecondary: "#FFFFFF",
  surfaceTertiary: "#F0ECE1",
  onSurfaceTertiary: "#292524",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FAF9F6",

  brandPrimary: "#292524", // warm charcoal
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#1B4332", // forest green — IELTS accent
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#9B2226", // rust — ICAO accent
  onBrandTertiary: "#FFFFFF",

  success: "#2D6A4F",
  onSuccess: "#FFFFFF",
  warning: "#E09F3E",
  onWarning: "#1C1917",
  error: "#9E2A2B",
  onError: "#FFFFFF",
  info: "#4A4D4A",
  onInfo: "#FFFFFF",

  // subtle tints for feedback cards
  successTint: "#E6F0EB",
  warningTint: "#FAF0DC",
  errorTint: "#F6E7E7",
  infoTint: "#ECEDEC",

  border: "#E5E5E5",
  borderStrong: "#D4D4D4",
  divider: "#E5E5E5",
  muted: "#78716C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fonts = {
  serif: "Lora-Regular",
  serifMedium: "Lora-Medium",
  sans: "PlusJakartaSans-Regular",
  sansMedium: "PlusJakartaSans-Medium",
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  score: 48,
} as const;

export const shadow = {
  card: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
