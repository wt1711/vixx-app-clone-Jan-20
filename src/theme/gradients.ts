import { colors } from './colors';

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
} as const;

export type Gradients = typeof gradients;
