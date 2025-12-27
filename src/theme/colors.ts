export const colors = {
  // Backgrounds
  background: {
    primary: '#0A0A0F',
    secondary: '#1A1A2E',
    tertiary: '#16213E',
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
    white: '#FFFFFF',
    input: '#E5E7EB',
    lastMessage: '#D1D5DB',
    messageOwn: '#E4E7EB',
    messageOther: '#F3F4F6',
  },

  // Accent / Brand
  accent: {
    primary: '#FF6B35',
    purple: '#A855F7',
    instagram: '#E4405F',
  },

  // Message bubbles
  message: {
    own: '#3B82F6',
    other: '#1A1D24',
  },

  // Borders & Dividers
  border: {
    default: '#2A2A3E',
    light: '#374151',
  },

  // Transparency helpers (base colors for rgba usage)
  transparent: {
    white05: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
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
    reactionButton: 'rgba(60, 60, 70, 0.95)',
    reactionButtonActive: 'rgba(80, 80, 90, 0.95)',
    roomItem: 'rgba(10, 10, 15, 0.3)',
    roomItemSelected: 'rgba(30, 30, 45, 0.5)',
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
