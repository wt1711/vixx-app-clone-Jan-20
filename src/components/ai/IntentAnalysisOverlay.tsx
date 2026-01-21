import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { X, ScanSearch } from 'lucide-react-native';
import { useAIAssistant } from 'src/hooks/context/AIAssistantContext';
import { VixxLogo } from 'src/components/icons';
import { colors } from 'src/config';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export function IntentAnalysisOverlay() {
  const {
    isIntentAnalysisOpen,
    isAnalyzingIntent,
    intentAnalysisResult,
    intentAnalysisError,
    intentAnalysisBurst,
    isAnalyzingOwnMessage,
    closeIntentAnalysis,
    openAskVixx,
  } = useAIAssistant();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isIntentAnalysisOpen) {
      // Animate in: fade background, then scale + fade content
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 18,
            stiffness: 100,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isIntentAnalysisOpen, fadeAnim, scaleAnim, contentOpacity]);

  // Handle "Ask Vixx" button - opens Ask Vixx modal with message context
  const handleAskVixx = useCallback(() => {
    const messageText = intentAnalysisBurst.map(m => m.content).join('\n');
    closeIntentAnalysis();
    openAskVixx(messageText);
  }, [intentAnalysisBurst, closeIntentAnalysis, openAskVixx]);

  if (!isIntentAnalysisOpen) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Light base tint - tap to dismiss */}
      <TouchableWithoutFeedback onPress={closeIntentAnalysis}>
        <Animated.View style={[styles.backdropBase, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Center spotlight gradient - darker in middle, fades toward edges */}
      <Animated.View style={[styles.spotlightWrapper, { opacity: fadeAnim }]} pointerEvents="none">
        <LinearGradient
          colors={[
            colors.transparent.black20,
            colors.transparent.black40,
            colors.transparent.black50,
            colors.transparent.black50,
            colors.transparent.black40,
            colors.transparent.black20,
          ]}
          locations={[0, 0.12, 0.25, 0.75, 0.88, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content container - centered in screen */}
      <View style={styles.contentWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Focused blur behind content */}
          <View style={styles.contentBlurWrapper}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={25}
              reducedTransparencyFallbackColor={colors.background.black}
            />
            <View style={styles.contentBlurTint} />
          </View>

          <TouchableWithoutFeedback>
            <View style={styles.innerContent}>
              {/* Header with scan icon - right-aligned for own messages */}
              <View style={[
                styles.header,
                isAnalyzingOwnMessage && styles.headerOwn,
              ]}>
                <View style={styles.headerIconCircle}>
                  <ScanSearch size={18} color={colors.accent.cyan} />
                </View>
              </View>

              {/* Message Burst - Context Bubbles */}
              {intentAnalysisBurst.length > 0 && (
                <View style={styles.messageBurstSection}>
                  <View style={[
                    styles.burstContainer,
                    isAnalyzingOwnMessage && styles.burstContainerOwn,
                  ]}>
                    {intentAnalysisBurst.map(msg => (
                      <View
                        key={msg.eventId}
                        style={[
                          styles.highlightedBubble,
                          isAnalyzingOwnMessage && styles.highlightedBubbleOwn,
                        ]}
                      >
                        <Text style={styles.bubbleText}>{msg.content}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Analysis Card - solid dark matching negative film */}
              <View style={styles.analysisCard}>
                <ScrollView
                  style={styles.analysisContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Initial Loading State */}
                  {isAnalyzingIntent && (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingDots}>
                        <ActivityIndicator
                          size="small"
                          color={colors.accent.cyan}
                        />
                      </View>
                      <Text style={styles.loadingText}>
                        {isAnalyzingOwnMessage ? 'Đang chấm điểm tin nhắn...' : 'Đang đọc ý nghĩa ẩn...'}
                      </Text>
                    </View>
                  )}

                  {/* Error State */}
                  {intentAnalysisError && !isAnalyzingIntent && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        {intentAnalysisError}
                      </Text>
                    </View>
                  )}

                  {/* Results View */}
                  {intentAnalysisResult && !isAnalyzingIntent && (
                    <View style={styles.resultsContainer}>
                      {/* READ/GRADE Section */}
                      <View style={styles.readSection}>
                        <Text style={styles.sectionLabel}>
                          {isAnalyzingOwnMessage ? 'NHẬN XÉT' : 'PHÂN TÍCH'}
                        </Text>
                        <Text style={styles.readText}>
                          {intentAnalysisResult.stateRead}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* Bottom action pills - Close left, Vixx right */}
              {intentAnalysisResult && !isAnalyzingIntent && (
                <View style={styles.bottomActions}>
                  {/* Close button - bottom left */}
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={closeIntentAnalysis}
                    activeOpacity={0.7}
                  >
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={20}
                      reducedTransparencyFallbackColor={colors.background.secondary}
                    />
                    <View style={styles.actionPillContent}>
                      <X size={20} color={colors.text.primary} />
                    </View>
                  </TouchableOpacity>

                  {/* Ask Vixx button - bottom right */}
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={handleAskVixx}
                    activeOpacity={0.7}
                  >
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={20}
                      reducedTransparencyFallbackColor={colors.background.secondary}
                    />
                    <View style={styles.actionPillContent}>
                      <VixxLogo size={32} color={colors.text.primary} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </View>
  );
}

// Height reserved for input bar at bottom
const INPUT_BAR_HEIGHT = 100;

const styles = StyleSheet.create({
  // Container for inline overlay - extends to bottom for smooth gradient
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Extend all the way down
    zIndex: 1000,
  },
  // Light base tint - covers entire screen
  backdropBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black30,
  },
  // Spotlight gradient wrapper
  spotlightWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  // Content wrapper - centered in screen
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Content container with scale animation
  contentContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },

  // Focused blur behind content area
  contentBlurWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
  },
  contentBlurTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black30,
  },

  innerContent: {
    width: '100%',
    padding: 16,
  },

  // Header with scan icon
  header: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  headerOwn: {
    alignItems: 'flex-end',
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.transparent.cyan15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Message Burst Section
  messageBurstSection: {
    marginBottom: 12,
  },
  burstContainer: {
    alignItems: 'flex-start',
    gap: 6,
  },
  burstContainerOwn: {
    alignItems: 'flex-end',
  },
  highlightedBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '85%',
    backgroundColor: colors.transparent.white08,
  },
  highlightedBubbleOwn: {
    backgroundColor: colors.message.own,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 21,
  },

  // Analysis Card - transparent, part of blurred container
  analysisCard: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.35,
    backgroundColor: colors.transparent.white05,
  },
  analysisContent: {
    padding: 14,
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingDots: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Error State
  errorContainer: {
    backgroundColor: colors.transparent.white08,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    textAlign: 'center',
  },

  // Results Container
  resultsContainer: {
    gap: 0,
  },

  // Section divider
  sectionDivider: {
    borderTopWidth: 0.5,
    borderTopColor: colors.transparent.white08,
    paddingTop: 14,
    marginTop: 14,
  },

  // Section label (shared)
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // READ section
  readSection: {
    paddingBottom: 0,
  },
  readText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },

  // Bottom action pills - inside the card
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  actionPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.transparent.white15,
  },
  actionPillContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
