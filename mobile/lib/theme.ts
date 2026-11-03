// MOJO brand tokens — "Bright, calm, cared-for" (light mode primary)
// Spec: MOJO_PREMIUM_UI_UPGRADE.md

export const colors = {
  // ── Canvas & surfaces ─────────────────────────────────────────────────────
  bg:          "#F6F9FC",   // canvas — off-white, never pure grey
  bgCard:      "#FFFFFF",   // white surface
  bgCardAlt:   "#F1F5FA",   // slightly tinted surface
  bgCardHigh:  "#EEF3F9",   // elevated / hover tint
  border:      "#E6ECF2",   // hairline
  borderLight: "#EEF3F9",

  // ── Primary — Lagoon teal ─────────────────────────────────────────────────
  teal:      "#14B8A6",     // lagoon-500 · brand hero
  tealHover: "#0D9488",     // lagoon-600 · button fill
  tealMuted: "#CCFBEF",     // lagoon-100 · chip bg
  tealDim:   "rgba(20,184,166,0.10)",
  tealBadge: "rgba(20,184,166,0.14)",

  // ── Info / blue ───────────────────────────────────────────────────────────
  blue:    "#4A8AFF",
  blueDim: "#EFF4FF",

  // ── Emergency / ruby (SOS + critical ONLY) ────────────────────────────────
  emergency:    "#EF4444",  // ruby-500
  emergencyDim: "#FFF1F1",

  // ── Warning / sun (medication reminders) ─────────────────────────────────
  amber:    "#FFC24B",      // sun-400
  amberDim: "#FFF4D6",      // sun-100

  // ── Success / mint ────────────────────────────────────────────────────────
  success:    "#22C08A",    // mint-500
  successDim: "#ECFDF9",    // lagoon-50

  // ── Text / ink ────────────────────────────────────────────────────────────
  text:          "#0F1B2D", // ink
  textSecondary: "#5B6B7F", // ink-muted
  textMuted:     "#8C9AAB", // ink-subtle

  // ── Floating pill tab bar ─────────────────────────────────────────────────
  tabBg:       "#FFFFFF",
  tabActive:   "#0F1B2D",   // ink pill with white icon+label
  tabInactive: "#8C9AAB",

  // ── Controls ─────────────────────────────────────────────────────────────
  toggleActive:   "#14B8A6",
  toggleInactive: "#E6ECF2",
  inputBg:        "#FFFFFF",
  inputBorder:    "#E6ECF2",

  // ── Artboard accent palette ───────────────────────────────────────────────
  heroCard:  "#0F1B2D",     // dark ink hero card background
  iris:      "#6C63FF",     // iris-500 · insights / sleep ring
  irisDim:   "#F1F0FF",     // iris-50
  lagoon700: "#0F766E",     // lagoon-700 · seizure-now tile
  sun:       "#FFC24B",     // sun-400 (same as amber — explicit alias)
  sunDim:    "#FFF4D6",     // sun-100

  // ── Compat aliases (existing code still references these) ─────────────────
  coral:         "#EF4444",   // kept as emergency alias
  coralDim:      "#FFF1F1",
  badgeReviewBg: "rgba(239,68,68,0.10)",
  badgeStableBg: "rgba(20,184,166,0.12)",
}

export const fonts = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 40,
}

export const radius = {
  sm:   10,
  md:   16,
  lg:   20,
  xl:   24,
  xxl:  28,
  full: 9999,
}

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
}

// ── Shadow presets (use in elevation / shadow* props) ─────────────────────────
export const shadows = {
  sm: {
    shadowColor:   "#0F1B2D",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   "#0F1B2D",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     4,
  },
  lg: {
    shadowColor:   "#0F1B2D",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius:  24,
    elevation:     8,
  },
  glowLagoon: {
    shadowColor:   "#14B8A6",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius:  20,
    elevation:     10,
  },
}
