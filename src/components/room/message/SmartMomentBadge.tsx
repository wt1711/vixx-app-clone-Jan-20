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
import { SmartMoment, getMomentColor } from 'src/utils/smartMoments';

type SmartMomentBadgeProps = {
  moment: SmartMoment | null;
  isAnalyzing: boolean;
  isOwn: boolean;
  onPress?: () => void;
};

export function SmartMomentBadge({
  moment,
  isAnalyzing,
  isOwn,
  onPress,
}: SmartMomentBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate in when showing
  useEffect(() => {
    if (isAnalyzing || moment) {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }).start();
    }
  }, [isAnalyzing, moment, scaleAnim]);

  // Pulse when moment type changes
  useEffect(() => {
    if (moment) {
      pulseAnim.setValue(1.2);
      Animated.spring(pulseAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 80,
      }).start();
    }
  }, [moment?.type, pulseAnim]);

  if (!isAnalyzing && !moment) {
    return null;
  }

  // Get accent color for the moment type
  const accentColor = moment ? getMomentColor(moment.type) : undefined;

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
        <View
          style={[
            styles.border,
            accentColor && { borderColor: accentColor + '40' }, // 25% opacity accent
          ]}
        />

        {isAnalyzing ? (
          <ActivityIndicator size="small" color={colors.text.secondary} />
        ) : moment ? (
          <Text style={styles.emoji}>{moment.emoji}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const BADGE_SIZE = 24;
const BADGE_BORDER_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    // Inline positioning - not absolute, flows with content
    marginLeft: 6,
    marginRight: 6,
    alignSelf: 'center',
  },
  containerOwn: {
    // No additional positioning needed for inline
  },
  containerOther: {
    // No additional positioning needed for inline
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_BORDER_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow to lift badge off bubble
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black70,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BADGE_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
  },
  emoji: {
    fontSize: 14,
  },
});
