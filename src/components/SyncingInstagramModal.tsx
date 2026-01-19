import React, { useEffect, useState } from 'react';
import { colors } from '../theme';
import { StyleSheet, Text, View, Modal, Image } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { ParticleSparkles } from './ui/ParticleSparkles';
import { CarbonFiberTexture } from './ui/NoiseTexture';

const LOGO_URL =
  'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/90ic679nh3wp43mbosisg';

const LOADING_MESSAGES = [
  'Setting up your account...',
  'Syncing your Instagram...',
  'Almost there...',
  'Connecting to servers...',
  'Preparing your inbox...',
];

interface SyncingInstagramModalProps {
  visible: boolean;
}

export default function SyncingInstagramModal({
  visible,
}: SyncingInstagramModalProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [countdown, setCountdown] = useState(60);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Typewriter effect
  useEffect(() => {
    const currentMessage = LOADING_MESSAGES[messageIndex];

    if (isTyping) {
      if (displayedText.length < currentMessage.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setDisplayedText('');
        setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        setIsTyping(true);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, messageIndex, isTyping]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]}
          />
          <CarbonFiberTexture opacity={0.6} scale={0.5} />
          <View style={styles.content}>
            {/* Logo positioned at 20% from top like login screen */}
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: LOGO_URL }}
                style={styles.logo}
                resizeMode="contain"
              />
              <ParticleSparkles
                width={180}
                height={180}
                particleCount={3}
                color="rgba(255, 255, 255, 0.8)"
              />
            </View>
            {/* Text positioned at 50% like login buttons */}
            <View style={styles.textContainer}>
              <Text style={styles.syncingText}>
                {displayedText}
                <Text style={{ opacity: showCursor ? 1 : 0 }}>|</Text>
              </Text>
              <Text style={styles.syncingSubtext}>{countdown}</Text>
            </View>
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
    alignItems: 'center',
  },
  logoContainer: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  textContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
  },
  syncingText: {
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
