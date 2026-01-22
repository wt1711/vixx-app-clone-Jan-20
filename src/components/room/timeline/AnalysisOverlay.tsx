import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from 'src/config';

/**
 * Negative film/x-ray overlay effect for analysis mode.
 * Creates a subtle "looking beneath the surface" feeling with:
 * - Cool blue-gray tint (desaturation effect) with subtle pulse
 * - Vignette darkening at edges
 * - Smooth fade-in animation
 */
export function AnalysisOverlay() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Subtle pulse on the tint layer (single animation for whole overlay)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [fadeAnim, pulseAnim]);

  // Interpolate pulse to subtle opacity change (0.2 to 0.35)
  const tintOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.35],
  });

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      {/* Cool tint layer - creates desaturated/negative film feel with subtle pulse */}
      <Animated.View style={[styles.tintLayer, { opacity: tintOpacity }]} />

      {/* Vignette - top edge */}
      <LinearGradient
        colors={[colors.analysis.vignetteDark, colors.analysis.vignetteLight]}
        style={styles.vignetteTop}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Vignette - bottom edge */}
      <LinearGradient
        colors={[colors.analysis.vignetteLight, colors.analysis.vignetteDark]}
        style={styles.vignetteBottom}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Vignette - left edge */}
      <LinearGradient
        colors={[colors.analysis.vignetteDark, colors.analysis.vignetteLight]}
        style={styles.vignetteLeft}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Vignette - right edge */}
      <LinearGradient
        colors={[colors.analysis.vignetteLight, colors.analysis.vignetteDark]}
        style={styles.vignetteRight}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    // Solid color - opacity controlled by animation
    backgroundColor: 'rgb(20, 30, 50)',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  vignetteLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 50,
  },
  vignetteRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 50,
  },
});
