import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { ChevronLeft, Sparkles, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, gradients } from '../theme';

type SettingsScreenProps = {
  onBack: () => void;
};

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  // Mock AI tokens count
  const aiTokens = 0;

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
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.text.primary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* AI Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Sparkles color={colors.accent.purple} size={24} />
              <Text style={styles.sectionLabel}>VIXX Credits</Text>
            </View>
            <Text style={styles.sectionValue}>{aiTokens}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut color={colors.status.error} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginRight: 28,
  },
  headerSpacer: {
    width: 28,
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
