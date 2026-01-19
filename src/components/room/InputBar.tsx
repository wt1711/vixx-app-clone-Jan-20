import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { ImageIcon, Sparkles } from 'lucide-react-native';
import { colors } from '../../theme';

type InputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onPickImage: () => void;
  onGenerateAI: () => void;
  isUploading: boolean;
  isSending: boolean;
  isGeneratingResponse: boolean;
  showAIButton: boolean;
  pulseAnim: Animated.Value;
  sparkleColor: string;
  shouldAnimateSparkle: boolean;
};

export function InputBar({
  value,
  onChangeText,
  onSubmit,
  onPickImage,
  onGenerateAI,
  isUploading,
  isSending,
  isGeneratingResponse,
  showAIButton,
  pulseAnim,
  sparkleColor,
  shouldAnimateSparkle,
}: InputBarProps) {
  return (
    <View style={styles.container}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={25}
        reducedTransparencyFallbackColor={colors.transparent.blurFallbackLight}
      />
      <View style={styles.darkOverlay} pointerEvents="none" />
      <View style={styles.glassHighlight} pointerEvents="none" />

      {/* Left - Attachment Button */}
      <TouchableOpacity
        style={[styles.iconButton, isUploading && styles.disabled]}
        onPress={onPickImage}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={colors.text.messageOwn} />
        ) : (
          <ImageIcon color={colors.text.messageOwn} size={20} />
        )}
      </TouchableOpacity>

      {/* Center - Text Input */}
      <TextInput
        style={styles.textInput}
        placeholder="Abcxyz"
        placeholderTextColor={colors.text.placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={5000}
        onSubmitEditing={onSubmit}
        editable={!isSending && !isUploading}
      />

      {/* Right - VIXX AI Button */}
      {showAIButton && (
        <TouchableOpacity
          style={[styles.iconButton, styles.aiButton]}
          onPress={onGenerateAI}
          disabled={isGeneratingResponse}
        >
          <Animated.View
            style={
              shouldAnimateSparkle
                ? { transform: [{ scale: pulseAnim }] }
                : undefined
            }
          >
            <Sparkles
              color={isGeneratingResponse ? sparkleColor : colors.accent.primary}
              size={20}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.transparent.black70,
    borderRadius: 22,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.transparent.white12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.input,
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 100,
  },
  disabled: {
    opacity: 0.5,
  },
  aiButton: {
    // No background - orange icon only
  },
});
