export const colors = {
  // Backgrounds
  background: {
    primary: '#0A0A0F',
    secondary: '#1A1A2E',  // dark blue
    tertiary: '#16213E',   // deeper blue
    elevated: '#2A2A3E',
    header: '#2A2A3E',
    input: '#1A1A2E',
    black: '#000000',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    placeholder: '#9CA3AF',
    white: '#E5E7EB', // Double check: white and input color text got swapped
    input: '#FFFFFF',
    lastMessage: '#D1D5DB',
    messageOwn: '#E5E7EB',
    messageOther: '#E5E7EB',
  },

  // Accent / Brand
  accent: {
    primary: '#1A7575',  // dark teal (matches bubble)
    blue: '#3B82F6',
    purple: '#A855F7',
    instagram: '#E4405F',
  },

  // Message bubbles
  message: {
    own: '#0D3B3B',  // electric cyan - dark teal base
    other: '#18181C',  // stealth dark - low friction
    otherGradientStart: '#35384A',
    otherGradientEnd: '#252833',
    otherBorder: 'rgba(255, 255, 255, 0.08)',
  },

  // Borders & Dividers
  border: {
    default: '#2A2A3E',
    light: '#374151',
  },

  // Transparency helpers (base colors for rgba usage)
  transparent: {
    white05: 'rgba(255, 255, 255, 0.05)',
    white08: 'rgba(255, 255, 255, 0.08)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white12: 'rgba(255, 255, 255, 0.12)',
    white15: 'rgba(255, 255, 255, 0.15)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white50: 'rgba(255, 255, 255, 0.5)',
    white90: 'rgba(255, 255, 255, 0.9)',
    black30: 'rgba(0, 0, 0, 0.3)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black60: 'rgba(0, 0, 0, 0.6)',
    inputBar: 'rgba(5, 6, 10, 0.92)',
    purple15: 'rgba(168, 85, 247, 0.15)',
    blue15: 'rgba(59, 130, 246, 0.15)',
    reactionButton: 'rgba(60, 60, 70, 0.95)',
    reactionButtonActive: 'rgba(80, 80, 90, 0.95)',
    roomItem: 'rgba(10, 10, 15, 0.3)',
    roomItemSelected: 'rgba(30, 30, 45, 0.5)',
  },

  // Liquid Glass effect colors (metallic/modern style)
  liquidGlass: {
    // See-through glass effect
    background: 'rgba(28, 32, 38, 0.75)',
    backgroundLight: 'rgba(40, 44, 52, 0.65)',
    // Crisp border - not too bright, just enough definition
    borderTop: 'rgba(255, 255, 255, 0.15)',
    borderBottom: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.15)',
    // Inner glow/highlight
    innerGlow: 'rgba(255, 255, 255, 0.08)',
  },

  // Shadows
  shadow: {
    dark: 'rgba(12, 20, 40, 0.6)',
  },

  // Status / Semantic
  status: {
    online: '#22C55E',
    success: '#10B981',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.8)',
    warning: '#F59E0B',
  },

  // Fallback / Debug
  fallback: {
    blue: '#0000ff',
  },
} as const;

export type Colors = typeof colors;
