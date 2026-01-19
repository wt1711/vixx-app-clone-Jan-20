import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import { AppNavigator } from '../navigation/AppNavigator';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { colors } from '../theme';

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
