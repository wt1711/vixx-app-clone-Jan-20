import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors } from 'src/theme';
import { CarbonFiberTexture } from 'src/components/ui/NoiseTexture';

type LoadingScreenProps = {
  message?: string;
  showHeader?: boolean;
};

export function LoadingScreen({
  message = 'Loading...',
  showHeader = true,
}: LoadingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background.black },
        ]}
      />
      <CarbonFiberTexture opacity={0.6} scale={0.5} />
      {showHeader && (
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={80}
            reducedTransparencyFallbackColor={colors.background.primary}
          />
          <TouchableOpacity style={styles.settingsButton}>
            <Settings color={colors.text.primary} size={24} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
  },
  settingsButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
