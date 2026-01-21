import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import { X, Sparkles } from 'lucide-react-native';
import { useAIAssistant } from 'src/hooks/context/AIAssistantContext';
import { colors } from 'src/config';
import { generateFromDirection } from 'src/services/aiService';
import type { ResponseDirection } from 'src/types/intentAnalysis';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewState = 'directions' | 'generating';

export function IntentAnalysisOverlay() {
  const {
    isIntentAnalysisOpen,
    isAnalyzingIntent,
    intentAnalysisResult,
    intentAnalysisError,
    intentAnalysisBurst,
    isAnalyzingOwnMessage,
    closeIntentAnalysis,
    setInputValue,
  } = useAIAssistant();

  // View state for direct flow
  const [viewState, setViewState] = useState<ViewState>('directions');
  const [selectedDirection, setSelectedDirection] = useState<ResponseDirection | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (isIntentAnalysisOpen) {
      setViewState('directions');
      setSelectedDirection(null);
      setGenerationError(null);
    }
  }, [isIntentAnalysisOpen]);

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

  // Handle selecting a direction - generates and inserts directly
  const handleSelectDirection = useCallback(
    async (direction: ResponseDirection) => {
      setSelectedDirection(direction);
      setViewState('generating');
      setGenerationError(null);

      try {
        // Get the message text from the burst
        const messageText = intentAnalysisBurst.map(m => m.content).join('\n');

        const result = await generateFromDirection({
          direction,
          messageText,
          context: [], // Context would come from AIAssistantContext if needed
        });

        // Direct insertion - insert into input and close
        setInputValue(result.message);
        closeIntentAnalysis();
      } catch (error) {
        console.error('Error generating from direction:', error);
        setGenerationError('Failed to generate response. Try again.');
        setViewState('directions');
      }
    },
    [intentAnalysisBurst, setInputValue, closeIntentAnalysis],
  );

  if (!isIntentAnalysisOpen) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Blur background - tap to dismiss */}
      <TouchableWithoutFeedback onPress={closeIntentAnalysis}>
        <Animated.View style={[styles.blurOverlay, { opacity: fadeAnim }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={40}
            reducedTransparencyFallbackColor={colors.transparent.black80}
          />
          <View style={styles.blurTint} />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Content container - positioned above input bar */}
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
          <TouchableWithoutFeedback>
            <View style={styles.innerContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconCircle}>
                    <Sparkles size={18} color={colors.accent.cyan} />
                  </View>
                  <Text style={styles.headerTitle}>
                    {isAnalyzingOwnMessage ? 'Message Grade' : 'Analysis'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeIntentAnalysis}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Message Burst - Context Bubbles */}
              {intentAnalysisBurst.length > 0 && viewState === 'directions' && (
                <View style={styles.messageBurstSection}>
                  <View style={styles.burstContainer}>
                    {intentAnalysisBurst.map(msg => (
                      <View key={msg.eventId} style={styles.highlightedBubble}>
                        <Text style={styles.bubbleText}>{msg.content}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Analysis Card */}
              <View style={styles.analysisCard}>
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={80}
                  reducedTransparencyFallbackColor={colors.liquidGlass.background}
                />
                <View style={styles.analysisCardOverlay} />

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
                        {isAnalyzingOwnMessage ? 'Grading your message...' : 'Analyzing conversation...'}
                      </Text>
                      <Text style={styles.loadingSubtext}>
                        {isAnalyzingOwnMessage ? 'Evaluating effectiveness' : 'Reading between the lines'}
                      </Text>
                    </View>
                  )}

                  {/* Error State */}
                  {(intentAnalysisError || generationError) && !isAnalyzingIntent && viewState !== 'generating' && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>
                        {intentAnalysisError || generationError}
                      </Text>
                    </View>
                  )}

                  {/* Step 1: Directions View */}
                  {viewState === 'directions' && intentAnalysisResult && !isAnalyzingIntent && (
                    <View style={styles.resultsContainer}>
                      {/* READ/GRADE Section */}
                      <View style={styles.readSection}>
                        <Text style={styles.sectionLabel}>
                          {isAnalyzingOwnMessage ? 'FEEDBACK' : 'READ'}
                        </Text>
                        <Text style={styles.readText}>
                          {intentAnalysisResult.stateRead}
                        </Text>
                      </View>

                      {/* RECOMMENDED Direction - Only for incoming messages */}
                      {!isAnalyzingOwnMessage && intentAnalysisResult.recommendedDirection && (
                        <View
                          style={[
                            styles.recommendedSection,
                            styles.sectionDivider,
                          ]}
                        >
                          <Text style={styles.sectionLabel}>RECOMMENDED</Text>
                          <TouchableOpacity
                            style={styles.recommendedPill}
                            onPress={() =>
                              handleSelectDirection(
                                intentAnalysisResult.recommendedDirection,
                              )
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={styles.recommendedText}>
                              {intentAnalysisResult.recommendedDirection.label}
                            </Text>
                            {intentAnalysisResult.recommendedDirection.description && (
                              <Text style={styles.directionDescription}>
                                {intentAnalysisResult.recommendedDirection.description}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* ALTERNATIVE Directions - Horizontal Swipeable - Only for incoming messages */}
                      {!isAnalyzingOwnMessage &&
                        intentAnalysisResult.alternativeDirections &&
                        intentAnalysisResult.alternativeDirections.length > 0 && (
                          <View
                            style={[
                              styles.alternativesSection,
                              styles.sectionDivider,
                            ]}
                          >
                            <Text style={styles.sectionLabel}>ALTERNATIVES</Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.alternativesScrollContent}
                              style={styles.alternativesScrollView}
                            >
                              {intentAnalysisResult.alternativeDirections.map(
                                (dir, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.alternativeChip}
                                    onPress={() => handleSelectDirection(dir)}
                                    activeOpacity={0.7}
                                  >
                                    {dir.emoji && (
                                      <Text style={styles.alternativeEmoji}>
                                        {dir.emoji}
                                      </Text>
                                    )}
                                    <Text style={styles.alternativeChipText}>
                                      {dir.label.split(' ').slice(0, 2).join(' ')}
                                    </Text>
                                  </TouchableOpacity>
                                ),
                              )}
                            </ScrollView>
                          </View>
                        )}
                    </View>
                  )}

                  {/* Generating State */}
                  {viewState === 'generating' && (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingDots}>
                        <ActivityIndicator
                          size="small"
                          color={colors.accent.cyan}
                        />
                      </View>
                      <Text style={styles.loadingText}>
                        Generating response...
                      </Text>
                      {selectedDirection && (
                        <Text style={styles.loadingSubtext}>
                          {selectedDirection.label}
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
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
  // Container for inline overlay (not Modal - allows input bar to show)
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: INPUT_BAR_HEIGHT, // Stop above input bar
    zIndex: 1000,
  },
  // Blur overlay background - only covers area above input bar
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blurTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black40,
  },

  // Content wrapper - positioned at bottom of overlay area
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16, // Small padding from bottom edge
  },

  // Content container with scale animation
  contentContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },

  innerContent: {
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.transparent.cyan15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.transparent.white10,
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
  highlightedBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '85%',
    backgroundColor: colors.transparent.white08,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 21,
  },

  // Analysis Card
  analysisCard: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.45,
    borderWidth: 1,
    borderColor: colors.liquidGlass.borderTop,
  },
  analysisCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.white05,
  },
  analysisContent: {
    padding: 16,
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
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 13,
    color: colors.text.tertiary,
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

  // RECOMMENDED section (directions)
  recommendedSection: {
    paddingBottom: 0,
  },
  recommendedPill: {
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
  },
  directionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },

  // ALTERNATIVES section (horizontal swipeable chips)
  alternativesSection: {
    paddingBottom: 4,
  },
  alternativesScrollView: {
    marginHorizontal: -16, // Extend to edges of card
    marginBottom: -4,
  },
  alternativesScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  alternativeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.transparent.white10,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
    gap: 6,
  },
  alternativeEmoji: {
    fontSize: 16,
  },
  alternativeChipText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
