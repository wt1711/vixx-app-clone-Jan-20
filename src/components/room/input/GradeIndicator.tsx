import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import type { GradeResult } from 'src/services/aiService';
import { colors } from 'src/config';

type GradeIndicatorProps = {
  gradeResult: GradeResult | null;
  isGrading: boolean;
  visible: boolean;
};

type GradeInfo = {
  emoji: string;
  label: string;
  color: string;
};

function getGradeInfo(score: number): GradeInfo {
  if (score >= 80) {
    return { emoji: '🔥', label: 'Great response!', color: colors.accent.cyan };
  }
  if (score >= 65) {
    return { emoji: '😊', label: 'Solid', color: colors.status.success };
  }
  if (score >= 50) {
    return { emoji: '😐', label: 'Could be better', color: colors.text.secondary };
  }
  return { emoji: '😬', label: 'Might fall flat', color: colors.status.warning };
}

export function GradeIndicator({
  gradeResult,
  isGrading,
  visible,
}: GradeIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastGradeInfo, setLastGradeInfo] = useState<GradeInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Track previous score for pulse animation
  const prevScoreRef = useRef<number | null>(null);

  // Handle visibility - show when visible AND (grading OR has result)
  useEffect(() => {
    const shouldShow = visible && (isGrading || gradeResult !== null);
    setIsVisible(shouldShow);
  }, [visible, isGrading, gradeResult]);

  // Pulse animation when grade changes
  useEffect(() => {
    if (gradeResult && prevScoreRef.current !== gradeResult.score) {
      // Update last grade info
      setLastGradeInfo(getGradeInfo(gradeResult.score));

      // Trigger pulse animation
      scaleAnim.setValue(1.2);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 100,
      }).start();

      prevScoreRef.current = gradeResult.score;
    }
  }, [gradeResult, scaleAnim]);

  const handlePress = useCallback(() => {
    if (gradeResult) {
      setShowTooltip(true);
    }
  }, [gradeResult]);

  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const currentGradeInfo = gradeResult ? getGradeInfo(gradeResult.score) : lastGradeInfo;

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.badge}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isGrading || !gradeResult}
        >
          {/* Glass background */}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor={colors.transparent.blurFallbackLight}
          />
          <View style={styles.darkOverlay} />
          <View style={styles.border} />

          {/* Content */}
          {isGrading ? (
            <ActivityIndicator size="small" color={colors.text.secondary} />
          ) : currentGradeInfo ? (
            <Text style={styles.emoji}>{currentGradeInfo.emoji}</Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>

      {/* Tooltip Modal */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={handleCloseTooltip}
      >
        <TouchableWithoutFeedback onPress={handleCloseTooltip}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.tooltipContainer}>
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={25}
                  reducedTransparencyFallbackColor={colors.background.secondary}
                />
                <View style={styles.tooltipDarkOverlay} />
                <View style={styles.tooltipBorder} />

                <View style={styles.tooltipContent}>
                  {/* Header with emoji and label */}
                  <View style={styles.tooltipHeader}>
                    {currentGradeInfo && (
                      <>
                        <Text style={styles.tooltipEmoji}>
                          {currentGradeInfo.emoji}
                        </Text>
                        <Text
                          style={[
                            styles.tooltipLabel,
                            { color: currentGradeInfo.color },
                          ]}
                        >
                          {currentGradeInfo.label}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Tip text */}
                  {gradeResult?.tip && (
                    <Text style={styles.tooltipTip}>{gradeResult.tip}</Text>
                  )}

                  {/* Got it button */}
                  <TouchableOpacity
                    style={styles.gotItButton}
                    onPress={handleCloseTooltip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gotItText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const BADGE_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    marginRight: 4,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black70,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 1,
    borderTopColor: colors.transparent.white20,
    borderLeftColor: colors.transparent.white15,
    borderBottomColor: colors.transparent.white08,
    borderRightColor: colors.transparent.white10,
  },
  emoji: {
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.transparent.black50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tooltipContainer: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tooltipDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black60,
  },
  tooltipBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderTopColor: colors.transparent.white20,
    borderLeftColor: colors.transparent.white15,
    borderBottomColor: colors.transparent.white08,
    borderRightColor: colors.transparent.white10,
  },
  tooltipContent: {
    padding: 20,
    alignItems: 'center',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tooltipEmoji: {
    fontSize: 24,
  },
  tooltipLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  tooltipTip: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  gotItButton: {
    backgroundColor: colors.transparent.white15,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.transparent.white20,
  },
  gotItText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
