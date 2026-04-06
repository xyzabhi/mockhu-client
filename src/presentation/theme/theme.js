/**
 * Mockhu design system — brand indigo + progress green (never on the same element).
 * Typography: Inter maps to 400/500/600; use semiBold max for UI (not 700+ except wordmark).
 */
export const theme = {
  colors: {
    /** Primary interactive — tabs, chips selected, FAB, CTA fill, avatar ring */
    brand: '#3921b4',
    brandLight: '#EEF2FF',
    brandBorder: '#C7D2FE',
    /** Filled star / starred post */
    starGold: '#E5A50A',
    /** Streak, studied, completion, progress bars only — not mixed with brand on one element */
    progress: '#00D26A',
    progressLight: '#F0FDF4',
    progressBorder: '#86EFAC',
    textPrimary: '#111827',
    textMuted: '#6b7280',
    textHint: '#9CA3AF',
    surface: '#ffffff',
    surfaceSubtle: '#F9FAFB',
    borderSubtle: '#E5E7EB',
    /** Outer app frame only */
    borderStrong: '#111827',
    danger: '#EF4444',
    /** Text on brand-filled buttons */
    onBrand: '#ffffff',
    /** Disabled primary CTA: white fill, brand outline + brand label */
    ctaDisabledBackground: '#ffffff',
    /** Legacy aliases (icons) */
    iconPhone: '#111827',
    iconEmail: '#111827',
    iconFacebook: '#1877F2',
    iconApple: '#111827',
    footerLink: '#9CA3AF',
    footerLinkUnderline: '#D1D5DB',
  },
  /**
   * System dark mode — same keys as `colors`. Use via `useThemeColors()` / ThemeProvider.
   */
  colorsDark: {
    brand: '#7c6fdc',
    brandLight: '#1e1b4b',
    brandBorder: '#4c1d95',
    starGold: '#fbbf24',
    progress: '#34d399',
    progressLight: '#052e16',
    progressBorder: '#166534',
    textPrimary: '#f4f4f5',
    textMuted: '#a1a1aa',
    textHint: '#71717a',
    surface: '#121214',
    surfaceSubtle: '#0a0a0b',
    borderSubtle: '#27272a',
    borderStrong: '#fafafa',
    danger: '#f87171',
    onBrand: '#ffffff',
    ctaDisabledBackground: '#18181b',
    iconPhone: '#e4e4e7',
    iconEmail: '#e4e4e7',
    iconFacebook: '#1877F2',
    iconApple: '#e4e4e7',
    footerLink: '#71717a',
    footerLinkUnderline: '#3f3f46',
  },
  typography: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
    black: 'Inter_900Black',
    thin: 'Inter_100Thin',
    light: 'Inter_300Light',
    extraLight: 'Inter_200ExtraLight',
  },
  /** Prefer these over raw fintSizes for DS alignment */
  fontSizes: {
    screenTitle: 22,
    sectionHead: 13,
    body: 13,
    authorName: 13,
    meta: 11,
    badge: 10,
    navLabel: 10,
    sectionLabel: 10,
    filterChip: 12,
  },
  lineHeight: {
    body: 21,
    meta: 16,
  },
  /** Legacy scale — prefer theme.fontSizes for new DS-aligned UI */
  fintSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,
    xxxxxxl: 56,
  },
  spacing: {
    screenPaddingH: 16,
    cardPaddingV: 12,
    cardPaddingH: 14,
  },
  radius: {
    card: 12,
    pill: 20,
    /** Full pill / “50%” rounding — caps at half of shortest side */
    button: 9999,
    badge: 8,
    input: 12,
  },
  borderWidth: {
    hairline: 0.5,
    default: 1,
    selected: 1.5,
    cta: 2,
  },
};
