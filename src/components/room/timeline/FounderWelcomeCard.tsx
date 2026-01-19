import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { CarbonFiberTexture } from 'src/components/ui/NoiseTexture';
import { FOUNDER_WELCOME_MESSAGE } from 'src/config/founder';
import { colors } from 'src/config';

export function FounderWelcomeCard() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor={colors.transparent.blurFallbackDark}
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
    borderTopColor: colors.transparent.white20,
    borderLeftColor: colors.transparent.white15,
    borderBottomColor: colors.transparent.white05,
    borderRightColor: colors.transparent.white08,
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
