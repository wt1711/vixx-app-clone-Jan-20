import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';

// Glass style variants for visual distinction
export type GlassVariant = 'A' | 'B' | 'C' | 'D' | 'E' | 'dark';

export const GLASS_VARIANT_NAMES: Record<GlassVariant, string> = {
  A: 'Crystal',   // Nearly transparent, minimal blur
  B: 'Frost',     // Heavy frosted, almost opaque
  C: 'Cool',      // Blue-tinted with cyan accent
  D: 'Amber',     // Warm cream/amber tinted
  E: 'Liquid',    // Gradient with directional border
  dark: 'Dark',   // Dark blur for dark-themed modals
};

type GlassModuleProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
  interactive?: boolean;
  borderRadius?: number;
};

/**
 * GlassModule - A reusable glass card/island component for light-themed modals
 *
 * Each module is a distinct floating glass island with rounded corners and shadow.
 * Supports 5 different glass variants (A-E) for visual distinction.
 */
export function GlassModule({
  children,
  style,
  contentStyle,
  variant = 'A',
  interactive = false,
  borderRadius = 20,
}: GlassModuleProps) {
  // Get variant-specific settings
  const variantConfig = getVariantConfig(variant);

  // Native LiquidGlassView on iOS 26+
  if (isLiquidGlassSupported) {
    return (
      <View style={[styles.module, { borderRadius }, style]}>
        <LiquidGlassView
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          effect="regular"
          colorScheme="light"
          interactive={interactive}
          tintColor={variantConfig.tintColor}
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  // Fallback: BlurView + variant-specific styling
  return (
    <View style={[styles.module, { borderRadius }, style]}>
      {/* Layer 1: Blur backdrop */}
      <BlurView
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        blurType={variantConfig.blurType}
        blurAmount={variantConfig.blurAmount}
        reducedTransparencyFallbackColor={variantConfig.fallbackColor}
      />

      {/* Layer 2: Variant-specific tint/gradient */}
      {variant === 'E' ? (
        <LinearGradient
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          colors={[
            'rgba(255, 255, 255, 0.95)',
            'rgba(255, 255, 255, 0.75)',
            'rgba(255, 255, 255, 0.85)',
          ]}
          locations={[0, 0.6, 1]}
        />
      ) : (
        <View style={[variantConfig.tintStyle, { borderRadius }]} />
      )}

      {/* Layer 3: Accent border (for variants C, D, E) */}
      {variantConfig.accentBorder && (
        <View style={[variantConfig.accentBorder, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} />
      )}

      {/* Layer 4: Directional border (for variant E) */}
      {variant === 'E' && (
        <View style={[styles.liquidBorder, { borderRadius }]} />
      )}

      {/* Layer 5: Content */}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

// Variant configurations
function getVariantConfig(variant: GlassVariant) {
  switch (variant) {
    case 'A': // Crystal Clear - Nearly transparent
      return {
        blurType: 'xlight' as const,
        blurAmount: 5,
        fallbackColor: 'rgba(255, 255, 255, 0.6)',
        tintColor: 'rgba(255, 255, 255, 0.2)',
        tintStyle: styles.crystalTint,
        accentBorder: null,
      };
    case 'B': // Heavy Frost - Almost opaque
      return {
        blurType: 'light' as const,
        blurAmount: 40,
        fallbackColor: 'rgba(255, 255, 255, 0.98)',
        tintColor: 'rgba(255, 255, 255, 0.8)',
        tintStyle: styles.frostTint,
        accentBorder: null,
      };
    case 'C': // Cool Blue - Blue-gray tint
      return {
        blurType: 'light' as const,
        blurAmount: 20,
        fallbackColor: 'rgba(230, 240, 255, 0.95)',
        tintColor: 'rgba(200, 220, 255, 0.4)',
        tintStyle: styles.coolTint,
        accentBorder: styles.cyanAccent,
      };
    case 'D': // Warm Amber - Cream/amber tint
      return {
        blurType: 'light' as const,
        blurAmount: 25,
        fallbackColor: 'rgba(255, 245, 225, 0.95)',
        tintColor: 'rgba(255, 220, 180, 0.3)',
        tintStyle: styles.amberTint,
        accentBorder: styles.orangeAccent,
      };
    case 'E': // Liquid Glass - Gradient
      return {
        blurType: 'light' as const,
        blurAmount: 15,
        fallbackColor: 'rgba(255, 255, 255, 0.95)',
        tintColor: 'rgba(255, 255, 255, 0.5)',
        tintStyle: null,
        accentBorder: null,
      };
    case 'dark': // Dark Glass - for dark-themed modals
    default:
      return {
        blurType: 'dark' as const,
        blurAmount: 25,
        fallbackColor: 'rgba(0, 0, 0, 0.85)',
        tintColor: 'rgba(0, 0, 0, 0.6)',
        tintStyle: styles.darkTint,
        accentBorder: null,
      };
  }
}

const styles = StyleSheet.create({
  module: {
    overflow: 'hidden',
    // Drop shadow for floating card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    // Don't use flex: 1 here - let the module's style control sizing
    // For flex modules, pass contentStyle={{ flex: 1 }} or use style={{ flex: 1 }}
  },

  // Variant A: Crystal Clear
  crystalTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },

  // Variant B: Heavy Frost
  frostTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },

  // Variant C: Cool Blue
  coolTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(230, 240, 255, 0.85)',
  },
  cyanAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(6, 182, 212, 0.5)',
  },

  // Variant D: Warm Amber
  amberTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 245, 225, 0.88)',
  },
  orangeAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(251, 146, 60, 0.4)',
  },

  // Variant E: Liquid Glass
  liquidBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.50)',
    borderLeftColor: 'rgba(255, 255, 255, 0.30)',
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Variant: Dark Glass
  darkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
});
