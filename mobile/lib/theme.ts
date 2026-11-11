// epimoyo brand tokens — "Watching over every heartbeat." (light mode primary)

export const colors = {
  // ── Canvas & surfaces ─────────────────────────────────────────────────────
  bg:          "#F5EFE3",   // Linen — warm page canvas
  bgCard:      "#FFFFFF",   // white card surface
  bgCardAlt:   "#EDE8DF",   // slightly tinted surface
  bgCardHigh:  "#E8E0D4",   // elevated / hover tint
  border:      "#D6CFC4",   // hairline
  borderLight: "#E8E0D4",

  // ── Primary — Pulse Teal ──────────────────────────────────────────────────
  teal:      "#1F7A72",     // Pulse Teal · brand primary
  tealHover: "#12383A",     // Guardian Teal · button fill / hover
  tealMuted: "#CFE0D8",     // Sage Mist · chip bg
  tealDim:   "rgba(31,122,114,0.10)",
  tealBadge: "rgba(31,122,114,0.14)",

  // ── Info ──────────────────────────────────────────────────────────────────
  blue:    "#1F7A72",
  blueDim: "#CFE0D8",

  // ── Emergency / SOS Red (SOS + critical ONLY) ─────────────────────────────
  emergency:    "#C8102E",  // SOS Red — reserved for emergencies only
  emergencyDim: "rgba(200,16,46,0.08)",

  // ── Warning / Honey (attention, reminders, offline) ──────────────────────
  amber:    "#F1C76B",      // Honey
  amberDim: "rgba(241,199,107,0.15)",

  // ── Success / Pulse Teal ──────────────────────────────────────────────────
  success:    "#1F7A72",
  successDim: "#CFE0D8",

  // ── Text / Night Ink ──────────────────────────────────────────────────────
  text:          "#0C1F20", // Night Ink
  textSecondary: "#3A5255", // ink-muted
  textMuted:     "#6B8588", // ink-subtle

  // ── Floating pill tab bar ─────────────────────────────────────────────────
  tabBg:       "#FFFFFF",
  tabActive:   "#0C1F20",   // Night Ink pill
  tabInactive: "#6B8588",

  // ── Controls ─────────────────────────────────────────────────────────────
  toggleActive:   "#1F7A72",
  toggleInactive: "#D6CFC4",
  inputBg:        "#FFFFFF",
  inputBorder:    "#D6CFC4",

  // ── Artboard accent palette ───────────────────────────────────────────────
  heroCard:  "#12383A",     // Guardian Teal · dark hero card background
  iris:      "#1F7A72",     // mapped to Pulse Teal
  irisDim:   "#CFE0D8",     // mapped to Sage Mist
  lagoon700: "#12383A",     // Guardian Teal
  sun:       "#F1C76B",     // Honey
  sunDim:    "rgba(241,199,107,0.15)",

  // ── Named brand tokens ────────────────────────────────────────────────────
  linen:    "#F5EFE3",      // page background (48%)
  guardian: "#12383A",      // Guardian Teal (26%)
  pulse:    "#1F7A72",      // Pulse Teal (12%)
  sage:     "#CFE0D8",      // Sage Mist (6%)
  coral:    "#E8603C",      // Moyo Coral — the ONE main CTA per screen (8%)
  coralDim: "rgba(232,96,60,0.10)",
  honey:    "#F1C76B",      // Honey — charts, attention
  honeyDim: "rgba(241,199,107,0.15)",
  sos:      "#C8102E",      // SOS Red — emergencies only

  // ── Compat aliases ────────────────────────────────────────────────────────
  badgeReviewBg: "rgba(200,16,46,0.10)",
  badgeStableBg: "rgba(31,122,114,0.12)",

  // ── Design system tokens (Phase 2) ───────────────────────────────────────
  surface:           "#FFFFFF",   // Cards (alias for bgCard)
  surfaceDark:       "#15383A",   // Hero cards
  primary:           "#1F7A70",   // Buttons, active states
  primarySoft:       "#D6E6E1",   // Chips, icon backgrounds
  accent:            "#E8674A",   // Steps ring, secondary data
  danger:            "#C8102E",   // SOS, emergency (alias for emergency)
  dangerSoft:        "#FBE4E7",   // Emergency chip bg
  seizure:           "#B4472E",   // Seizure markers in charts (never teal)
  warning:           "#8A5A00",   // Warning text
  warningBg:         "#FBEFD0",   // Warning background
  textOnDark:        "#FFFFFF",   // Text on surfaceDark
  textOnDarkMuted:   "#B8CCC8",   // Secondary text on surfaceDark
}

export const fontFamilies = {
  display:     "Fraunces-SemiBold",     // headlines, big numbers, wordmark
  displayItalic: "Fraunces-Italic",     // italic display (taglines, moments of care)
  // TODO: replace DMSans with PlusJakartaSans after adding to app.json + assets
  body:        "DMSans-Regular",        // body text, labels
  bodyMedium:  "DMSans-Medium",         // medium-weight body
  bodyBold:    "DMSans-Bold",           // bold UI labels, button text
  mono:        "JetBrainsMono-Regular", // BPM, ECG readings, vitals
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
  // Numeric spacing scale
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
}

// ── Shadow presets ────────────────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor:   "#0C1F20",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   "#0C1F20",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     4,
  },
  lg: {
    shadowColor:   "#0C1F20",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius:  24,
    elevation:     8,
  },
  glowLagoon: {
    shadowColor:   "#1F7A72",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius:  20,
    elevation:     10,
  },
}
