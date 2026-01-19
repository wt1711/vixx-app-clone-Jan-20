import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from 'src/context/AuthContext';
import Login from 'src/screens/Login';
import { AppNavigator } from 'src/navigation/AppNavigator';
import { LoadingScreen } from 'src/components/common/LoadingScreen';
import { colors } from 'src/theme';

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
          <AppNavigator />
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
