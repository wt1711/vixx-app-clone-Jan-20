import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import { AppNavigator } from '../navigation/AppNavigator';
import { colors } from '../theme';
import { CarbonFiberTexture } from '../components/ui/NoiseTexture';

export default function Home() {
  const { matrixToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.centered}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
          <CarbonFiberTexture opacity={0.6} scale={0.5} />
          <ActivityIndicator size="large" color={colors.accent.instagram} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {!matrixToken ? <Login /> : <AppNavigator />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text.tertiary,
  },
});
