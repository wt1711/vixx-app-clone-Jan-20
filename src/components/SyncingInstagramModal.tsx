import React, { useEffect, useRef } from 'react';
import { colors, gradients } from '../theme';
import { StyleSheet, Text, View, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const LOGO_URL =
  'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/90ic679nh3wp43mbosisg';

interface SyncingInstagramModalProps {
  visible: boolean;
}

export default function SyncingInstagramModal({
  visible,
}: SyncingInstagramModalProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
          <LinearGradient
            colors={[...gradients.screenBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <Animated.Image
              source={{ uri: LOGO_URL }}
              style={[styles.logo, { transform: [{ rotate }] }]}
              resizeMode="contain"
            />
            <Text style={styles.syncingText}>Setting up your account...</Text>
            <Text style={styles.syncingSubtext}>Hang tight for a minute.</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderColor: colors.border.light,
    borderRadius: 9999,
    borderWidth: 3,
  },
  syncingText: {
    marginTop: 32,
    fontSize: 20,
    fontWeight: '500',
    color: colors.text.primary,
  },
  syncingSubtext: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.input,
  },
});
