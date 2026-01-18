import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { CarbonFiberTexture } from '../ui/NoiseTexture';
import { FOUNDER_WELCOME_MESSAGE } from '../../constants/founder';
import { colors } from '../../theme';

export function FounderWelcomeCard() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(30, 30, 30, 0.4)"
        />
        <CarbonFiberTexture opacity={0.8} scale={0.5} />
        <View style={styles.glassHighlight} pointerEvents="none" />
        <View style={styles.content}>
          <Text style={styles.waveEmoji}>👋</Text>
          <Text style={styles.messageText}>{FOUNDER_WELCOME_MESSAGE}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: 300,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  waveEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
