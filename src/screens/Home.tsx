import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import { AppNavigator } from '../navigation/AppNavigator';
import { LoadingScreen } from '../components/common/LoadingScreen';

export default function Home() {
  const { matrixToken, isLoading } = useAuth();

  return (
    <SafeAreaProvider>
      {isLoading ? (
        <LoadingScreen showHeader={false} />
      ) : !matrixToken ? (
        <Login />
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}
