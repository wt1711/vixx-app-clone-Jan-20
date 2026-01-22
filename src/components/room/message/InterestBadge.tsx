import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { colors } from 'src/config';

export type InterestLevel = {
  score: number;
  emoji: string;
  label: string;
};

type InterestBadgeProps = {
  interestLevel: InterestLevel | null;
  isAnalyzing: boolean;
  isOwn: boolean;
  onPress?: () => void;
};

export function getInterestEmoji(score: number): InterestLevel {
  if (score >= 80) {
    return { score, emoji: '🔥', label: 'High interest' };
  }
  if (score >= 65) {
    return { score, emoji: '😊', label: 'Good vibes' };
  }
  if (score >= 50) {
    return { score, emoji: '😐', label: 'Neutral' };
  }
  return { score, emoji: '😬', label: 'Low interest' };
}

export function InterestBadge({
  interestLevel,
  isAnalyzing,
  isOwn,
  onPress,
}: InterestBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate in when showing
  useEffect(() => {
    if (isAnalyzing || interestLevel) {
      // Pop in animation
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }).start();
    }
  }, [isAnalyzing, interestLevel, scaleAnim]);

  // Pulse when score changes
  useEffect(() => {
    if (interestLevel) {
      pulseAnim.setValue(1.2);
      Animated.spring(pulseAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 80,
      }).start();
    }
  }, [interestLevel?.score, pulseAnim]);

  if (!isAnalyzing && !interestLevel) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
        {
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.badge}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isAnalyzing || !onPress}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={15}
          reducedTransparencyFallbackColor={colors.transparent.blurFallbackLight}
        />
        <View style={styles.darkOverlay} />
        <View style={styles.border} />

        {isAnalyzing ? (
          <ActivityIndicator size="small" color={colors.text.secondary} />
        ) : interestLevel ? (
          <View style={styles.content}>
            <Text style={styles.emoji}>{interestLevel.emoji}</Text>
            <Text style={styles.percentage}>{interestLevel.score}%</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const BADGE_HEIGHT = 24;
const BADGE_BORDER_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -6,
    zIndex: 10,
  },
  containerOwn: {
    left: -4,
  },
  containerOther: {
    right: -4,
  },
  badge: {
    height: BADGE_HEIGHT,
    paddingHorizontal: 6,
    borderRadius: BADGE_BORDER_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: BADGE_HEIGHT,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black70,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BADGE_BORDER_RADIUS,
    borderWidth: 1,
    borderTopColor: colors.transparent.white25,
    borderLeftColor: colors.transparent.white18,
    borderBottomColor: colors.transparent.white08,
    borderRightColor: colors.transparent.white10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 12,
  },
  percentage: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
