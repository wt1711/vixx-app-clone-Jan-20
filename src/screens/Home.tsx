import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from 'src/hooks/context/AuthContext';
import { PendingMetabotRoomsProvider } from 'src/hooks/context/PendingMetabotRoomsContext';
import Login from 'src/screens/Login';
import { AppNavigator } from 'src/screens/AppNavigator';
import { LoadingScreen } from 'src/components/common/LoadingScreen';
import { colors } from 'src/config';

export default function Home() {
  const { matrixToken, isLoading } = useAuth();

  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        {isLoading ? (
          <LoadingScreen showHeader={false} />
        ) : !matrixToken ? (
          <Login />
        ) : (
          <PendingMetabotRoomsProvider>
            <AppNavigator />
          </PendingMetabotRoomsProvider>
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
});
