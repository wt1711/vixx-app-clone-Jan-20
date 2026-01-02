import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  BackHandler,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DirectMessageListScreen } from './DirectMessageListScreen';
import { DirectMessageDetailScreen } from './DirectMessageDetailScreen';
import { SettingsScreen } from './SettingsScreen';
import Login from './Login';
import { colors } from '../theme';

type Screen = 'login' | 'list' | 'detail' | 'settings';

export default function Home() {
  const { matrixToken, isLoading } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Determine current screen for navigation logic
  const currentScreen: Screen = !matrixToken
    ? 'login'
    : showSettings
    ? 'settings'
    : selectedRoomId
    ? 'detail'
    : 'list';

  // Reset navigation state on logout
  useEffect(() => {
    if (!matrixToken) {
      setShowSettings(false);
      setSelectedRoomId(null);
    }
  }, [matrixToken]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // If on settings screen, go back to list
        if (currentScreen === 'settings') {
          setShowSettings(false);
          return true;
        }
        // If on detail screen, go back to list
        if (currentScreen === 'detail' && selectedRoomId) {
          setSelectedRoomId(null);
          return true; // Prevent default back behavior
        }
        // If on list screen, allow default back behavior (exit app)
        return false;
      },
    );

    return () => backHandler.remove();
  }, [currentScreen, selectedRoomId]);

  const handleBack = () => {
    setSelectedRoomId(null);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent.instagram} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {!matrixToken ? (
        <Login />
      ) : showSettings ? (
        <SettingsScreen onBack={handleCloseSettings} />
      ) : selectedRoomId ? (
        <DirectMessageDetailScreen
          roomId={selectedRoomId}
          onBack={handleBack}
        />
      ) : (
        <DirectMessageListScreen
          onSelectRoom={handleSelectRoom}
          onOpenSettings={handleOpenSettings}
        />
      )}
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
