import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
// import { useAuth } from '../context/AuthContext';
import { colors, gradients } from '../theme';
import { getMatrixClient } from '../matrixClient';
import { getCreditsRemaining } from '../services/aiService';
import { useChatWithFounder } from '../hooks/useChatWithFounder';

type SettingsScreenProps = {
  onBack: () => void;
  onSelectRoom: (roomId: string) => void;
};

export function SettingsScreen({ onBack, onSelectRoom }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  // const { logout } = useAuth();
  const mx = getMatrixClient();
  const { handleChatWithFounder, founderAvatar } =
    useChatWithFounder(onSelectRoom);

  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      const userId = mx?.getUserId();
      if (userId) {
        const remaining = await getCreditsRemaining(userId);
        setCredits(remaining);
      }
    };
    fetchCredits();
  }, [mx]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...gradients.screenBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor={colors.background.primary}
        />
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.text.primary} size={28} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* AI Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Image
                source={{
                  uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/90ic679nh3wp43mbosisg',
                }}
                style={styles.vixxLogo}
              />
              <Text style={styles.sectionLabel}>VIXX Credits</Text>
            </View>
            <Text style={styles.sectionValue}>{credits ?? '—'}</Text>
          </View>
        </View>

        {/* Chat with Founder */}
        <TouchableOpacity
          style={styles.section}
          onPress={handleChatWithFounder}
          activeOpacity={0.7}
        >
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Image source={founderAvatar} style={styles.founderAvatar} />
              <Text style={styles.sectionLabel}>Chat with Founder</Text>
            </View>
            <MessageCircle color={colors.text.secondary} size={20} />
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        {/* <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut color={colors.status.error} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    backgroundColor: colors.transparent.white05,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vixxLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  founderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sectionLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.transparent.white05,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.error,
  },
});
