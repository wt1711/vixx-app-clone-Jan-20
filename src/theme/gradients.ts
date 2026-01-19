import { colors } from 'src/theme/colors';

export const gradients = {
  // Main app background gradient (used in screens)
  screenBackground: [
    colors.background.primary,
    colors.background.secondary,
    colors.background.tertiary,
    colors.background.primary,
  ] as const,

  // Header gradient
  header: [
    colors.transparent.black60,
    colors.transparent.black30,
    'transparent',
  ] as const,

  // Bottom fade gradient
  bottomFade: [
    'transparent',
    colors.transparent.black50,
    colors.background.primary,
  ] as const,

  // Bottom fade to black (opaque)
  bottomFadeBlack: ['transparent', colors.transparent.black100] as const,

  // Dark screen background gradient (for modals, detail screens)
  screenDark: [
    colors.background.screenDark,
    colors.background.screenDarkMid,
    colors.background.screenDark,
  ] as const,

  // Room view header gradient overlay
  roomViewHeader: [
    colors.transparent.black85,
    colors.transparent.black40,
    'transparent',
  ] as const,

  // Instagram brand gradient
  instagram: [
    '#F09433', // golden yellow
    '#E6683C', // orange
    '#DC2743', // red
    '#CC2366', // magenta
    '#BC1888', // purple
  ] as const,
} as const;

export type Gradients = typeof gradients;
