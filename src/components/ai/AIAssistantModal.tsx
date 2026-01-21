import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Palette, Send, X, Trash2 } from 'lucide-react-native';
import { Room } from 'matrix-js-sdk';
import { useAIAssistant } from 'src/hooks/context/AIAssistantContext';
import { DashboardSection } from './DashboardSection';
import { GlassModule, GlassVariant } from 'src/components/ui';
import { colors } from 'src/config';

// Header pill height + padding - keeps room header visible
const HEADER_VISIBLE_HEIGHT = 44 + 12 + 12; // pill height + top padding + extra margin

type AIAssistantModalProps = {
  visible: boolean;
  onClose: () => void;
  room: Room;
};

export function AIAssistantModal({ visible, onClose }: AIAssistantModalProps) {
  const insets = useSafeAreaInsets();
  const {
    inputValue,
    setInputValue,
    chatHistory,
    isLoading,
    generatedResponse,
    isGeneratingResponse,
    handleSend,
    sendQuickQuestion,
    generateInitialResponse,
    regenerateResponse,
    handleUseSuggestion,
    clearChatHistory,
    contextMessage,
    dashboardMetrics,
    clearContext,
  } = useAIAssistant();

  // Calculate top padding to keep room header (avatar + name) visible
  const topPadding = insets.top + HEADER_VISIBLE_HEIGHT;

  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [glassVariant, setGlassVariant] = useState<GlassVariant>('C'); // Default to Cool blue tint

  // Cycle through glass variants (dev mode only)
  const cycleGlassVariant = () => {
    const variants: GlassVariant[] = ['A', 'B', 'C', 'D', 'E'];
    const currentIndex = variants.indexOf(glassVariant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setGlassVariant(variants[nextIndex]);
  };

  // Animation for dashboard expansion using standard Animated API
  const dashboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dashboardAnim, {
      toValue: isDashboardExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isDashboardExpanded, dashboardAnim]);

  // Animation for send button appear/collapse - single animation to avoid race conditions
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const showSendButton = inputValue.trim().length > 0 || isLoading;

  useEffect(() => {
    Animated.timing(sendButtonAnim, {
      toValue: showSendButton ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // width can't use native driver
    }).start();
  }, [showSendButton, sendButtonAnim]);

  const expandAnimatedStyle = {
    height: dashboardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 280],
    }),
    opacity: dashboardAnim,
    overflow: 'hidden' as const,
  };

  // Reset dashboard when modal closes
  useEffect(() => {
    if (!visible) {
      setIsDashboardExpanded(false);
    }
  }, [visible]);

  // Show empty state only when there's no context, no chat history, and no generated response
  const showEmptyState =
    chatHistory.length === 0 && !generatedResponse && !contextMessage;

  // When context is set but no chat yet, show a helpful prompt
  const showContextPrompt = contextMessage && chatHistory.length === 0 && !generatedResponse;

  const metrics = dashboardMetrics;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: topPadding }]}>
        <View style={styles.modulesContainer}>
          {/* Glass Island 1: Header + Dashboard (MERGED) */}
          <GlassModule style={styles.headerDashboardCard} variant={glassVariant} interactive>
            {/* Header Row */}
            <View style={styles.headerContent}>
              <Text style={styles.title}>Insights</Text>
              <View style={styles.headerActions}>
                {/* Glass style switcher - dev mode only */}
                {__DEV__ && (
                  <TouchableOpacity
                    onPress={cycleGlassVariant}
                    style={styles.styleButton}
                  >
                    <Palette size={16} color={colors.modal.textSecondary} />
                    <Text style={styles.styleButtonText}>{glassVariant}</Text>
                  </TouchableOpacity>
                )}
                {chatHistory.length > 0 && (
                  <TouchableOpacity
                    onPress={clearChatHistory}
                    style={styles.clearButton}
                  >
                    <Trash2 size={18} color={colors.modal.textSecondary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color={colors.modal.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            {metrics && <View style={styles.headerDivider} />}

            {/* Dashboard Metrics Row (tappable) */}
            {metrics && (
              <>
                <TouchableOpacity
                  style={styles.dashboardTouchable}
                  onPress={() => setIsDashboardExpanded(!isDashboardExpanded)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricsRow}>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricEmoji}>{metrics.interestEmoji}</Text>
                      <Text style={styles.metricValue}>{metrics.interestScore}%</Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricEmoji}>{metrics.moodEmoji}</Text>
                      <Text style={styles.metricValue}>{metrics.mood}</Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricEmoji}>📈</Text>
                      <Text style={styles.metricValue}>{metrics.engagementLevel}</Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricEmoji}>💬</Text>
                      <Text style={styles.metricValue}>{metrics.messageCountToday}</Text>
                    </View>
                  </View>
                  {isDashboardExpanded ? (
                    <ChevronUp size={18} color={colors.modal.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={colors.modal.textSecondary} />
                  )}
                </TouchableOpacity>

                {/* Expanded Dashboard (animated) */}
                <Animated.View style={[styles.expandedDashboard, expandAnimatedStyle]}>
                  <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
                    <DashboardSection
                      title="Interest Level"
                      score={metrics.interestScore}
                      label={metrics.interestLabel}
                      indicators={metrics.indicators}
                    />
                    <DashboardSection
                      title="Emotional Tone"
                      primary={metrics.mood}
                      secondary="Based on recent messages"
                    />
                    <DashboardSection
                      title="Engagement"
                      stats={`${metrics.messageCountToday} messages today • ${metrics.avgResponseTime} avg response`}
                    />
                  </ScrollView>
                </Animated.View>
              </>
            )}
          </GlassModule>

          {/* Glass Island 2: Chat Content */}
          <GlassModule style={styles.chatCard} variant={glassVariant} contentStyle={styles.chatCardContent}>
            <ScrollView
              style={styles.chatScrollView}
              contentContainerStyle={styles.chatScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Context message - shows what message user is asking about */}
              {contextMessage && (
                <View style={styles.contextSection}>
                  <Text style={styles.contextLabel}>Context:</Text>
                  <View style={styles.contextBubble}>
                    <Text style={styles.contextText}>{contextMessage}</Text>
                    <TouchableOpacity
                      style={styles.contextDismiss}
                      onPress={clearContext}
                    >
                      <X size={14} color={colors.modal.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {showEmptyState ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Chat with Vixx</Text>
                  <Text style={styles.emptyStateText}>
                    Ask me anything about this conversation, get advice, or analyze messages.
                  </Text>
                </View>
              ) : showContextPrompt ? (
                <View style={styles.contextPrompt}>
                  <Text style={styles.contextPromptText}>
                    What would you like to know about this message?
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestionChipsScroll}
                    contentContainerStyle={styles.suggestionChipsContent}
                  >
                    <TouchableOpacity
                      style={[styles.suggestionChip, isLoading && styles.suggestionChipDisabled]}
                      onPress={() => sendQuickQuestion('What does this mean?')}
                      disabled={isLoading}
                    >
                      <Text style={styles.suggestionChipText}>What does this mean?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.suggestionChip, isLoading && styles.suggestionChipDisabled]}
                      onPress={() => sendQuickQuestion('How should I respond?')}
                      disabled={isLoading}
                    >
                      <Text style={styles.suggestionChipText}>How should I respond?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.suggestionChip, isLoading && styles.suggestionChipDisabled]}
                      onPress={() => sendQuickQuestion('Are they interested?')}
                      disabled={isLoading}
                    >
                      <Text style={styles.suggestionChipText}>Are they interested?</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  {isLoading && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color={colors.accent.teal} />
                      <Text style={styles.loadingText}>Vixx is thinking...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  {generatedResponse && (
                    <View style={styles.generatedResponseContainer}>
                      <Text style={styles.generatedResponseLabel}>
                        Generated Response:
                      </Text>
                      <Text style={styles.generatedResponseText}>
                        {generatedResponse}
                      </Text>
                      <View style={styles.generatedResponseActions}>
                        <TouchableOpacity
                          style={styles.useButton}
                          onPress={() => handleUseSuggestion(generatedResponse)}
                        >
                          <Text style={styles.useButtonText}>Use This</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.regenerateButton}
                          onPress={() => regenerateResponse()}
                          disabled={isGeneratingResponse}
                        >
                          {isGeneratingResponse ? (
                            <ActivityIndicator color={colors.accent.teal} />
                          ) : (
                            <Text style={styles.regenerateButtonText}>
                              Regenerate
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {chatHistory.length > 0 && (
                    <View style={styles.chatHistoryContainer}>
                      {chatHistory.map((item, index) => (
                        <View
                          key={`${item.sender}-${index}`}
                          style={[
                            styles.messageBubble,
                            item.sender === 'user'
                              ? styles.messageUser
                              : styles.messageAI,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              item.sender === 'user'
                                ? styles.messageTextUser
                                : styles.messageTextAI,
                            ]}
                          >
                            {item.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </GlassModule>

          {/* Glass Island 3: Input */}
          <GlassModule style={styles.inputCard} variant={glassVariant}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Abcxyz"
                placeholderTextColor={colors.transparent.white50}
                value={inputValue}
                onChangeText={setInputValue}
                multiline
                editable={!isLoading}
              />
              {/* Animated send button container */}
              <Animated.View
                style={[
                  styles.sendButtonWrapper,
                  {
                    width: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 48],
                    }),
                    opacity: sendButtonAnim,
                    transform: [
                      {
                        scale: sendButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents={showSendButton ? 'auto' : 'none'}
              >
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.text.primary}
                    />
                  ) : (
                    <Send size={20} color={colors.text.primary} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </GlassModule>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay with darker background to show glass islands
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // paddingTop is set dynamically to keep room header visible
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Container for all glass modules with gap
  modulesContainer: {
    flex: 1,
    gap: 12,
  },

  // Glass Island 1: Header + Dashboard (MERGED)
  headerDashboardCard: {
    // GlassModule handles the glass effect
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.modal.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 14,
  },
  styleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.modal.textSecondary,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: colors.modal.textSecondary,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.modal.textSecondary,
  },

  // Divider between header and dashboard
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 16,
  },

  // Dashboard section (within merged card)
  dashboardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 220, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  metricEmoji: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.modal.textPrimary,
  },
  expandedDashboard: {
    // Animation styles applied inline
  },
  dashboardContent: {
    paddingHorizontal: 16,
  },

  // Glass Island 2: Chat Content
  chatCard: {
    flex: 1,
    minHeight: 150,
  },
  chatCardContent: {
    flex: 1,  // Allow content wrapper to expand for ScrollView
  },
  chatScrollView: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
  },
  contextSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.modal.border,
  },
  contextLabel: {
    fontSize: 12,
    color: colors.modal.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contextBubble: {
    backgroundColor: 'rgba(200, 220, 255, 0.10)',
    padding: 12,
    paddingRight: 36,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.teal,
    position: 'relative',
  },
  contextDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  contextText: {
    fontSize: 15,
    color: colors.modal.textPrimary,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.modal.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.modal.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  contextPrompt: {
    paddingVertical: 16,
  },
  contextPromptText: {
    fontSize: 15,
    color: colors.modal.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionChipsScroll: {
    marginHorizontal: -16, // Extend to edges
  },
  suggestionChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionChip: {
    backgroundColor: 'rgba(200, 220, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(200, 220, 255, 0.25)',
  },
  suggestionChipDisabled: {
    opacity: 0.5,
  },
  suggestionChipText: {
    fontSize: 14,
    color: colors.modal.textPrimary,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.modal.textSecondary,
  },
  generatedResponseContainer: {
    backgroundColor: 'rgba(200, 220, 255, 0.12)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  generatedResponseLabel: {
    fontSize: 12,
    color: colors.modal.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  generatedResponseText: {
    fontSize: 15,
    color: colors.modal.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  generatedResponseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  useButton: {
    flex: 1,
    backgroundColor: colors.accent.teal,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  useButtonText: {
    color: colors.modal.background,
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderWidth: 1,
    borderColor: colors.accent.teal,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: colors.accent.teal,
    fontSize: 14,
    fontWeight: '600',
  },
  chatHistoryContainer: {
    // Container for chat messages (replaces FlatList)
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageUser: {
    backgroundColor: 'rgba(30, 30, 35, 0.9)',
    alignSelf: 'flex-end',
  },
  messageAI: {
    backgroundColor: 'rgba(200, 220, 255, 0.15)',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.text.primary,
  },
  messageTextAI: {
    color: colors.modal.textPrimary,
  },

  // Glass Island 3: Input
  inputCard: {
    // GlassModule handles the glass effect
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(200, 220, 255, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: 'transparent',
  },
  sendButtonWrapper: {
    overflow: 'hidden',
    height: 40,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: 'rgba(200, 220, 255, 0.35)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 220, 255, 0.5)',
  },
});
