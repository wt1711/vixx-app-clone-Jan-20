import React, { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { LiquidGlassButton } from 'src/components/ui/LiquidGlassButton';
import { ChevronLeft, User, ScanSearch } from 'lucide-react-native';
import { Room } from 'matrix-js-sdk';
import { getMatrixClient } from 'src/services/matrixClient';
import { getRoomAvatarUrl, isFounderRoom } from 'src/utils/room';
import { useAIAssistant } from 'src/hooks/context/AIAssistantContext';
import { VixxLogo } from 'src/components/icons/VixxLogo';
import { colors, gradients } from 'src/config';

type RoomViewHeaderProps = {
  room: Room;
  onBack: () => void;
  onOptionsPress?: () => void;
};

export function RoomViewHeader({ room, onBack }: RoomViewHeaderProps) {
  const mx = getMatrixClient();
  const insets = useSafeAreaInsets();
  const { toggleAIAssistant, isAnalysisModeActive, toggleAnalysisMode } =
    useAIAssistant();

  const roomName = room.name || 'Unknown';
  const avatarUrl = mx ? getRoomAvatarUrl(mx, room, 96, true) : undefined;
  const isFounderChat = isFounderRoom(room);

  const handlePress = useCallback(() => {
    onBack();
  }, [onBack]);

  // Calculate overlay height: safe area + padding + pill height + padding + 5px
  const overlayHeight = insets.top + 6 + PILL_HEIGHT + 6 + 5;

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {/* Gradient overlay - 85% at top with smooth fade for glass pill effect */}
      <LinearGradient
        colors={[...gradients.roomViewHeader]}
        locations={[0, 0.6, 1]}
        style={[styles.gradientOverlay, { height: overlayHeight }]}
        pointerEvents="none"
      />
      <View style={styles.headerContent}>
        {/* Back button - iOS Liquid Glass */}
        <LiquidGlassButton
          style={styles.backPill}
          contentStyle={styles.backPillContent}
          borderRadius={PILL_HEIGHT / 2}
          onPress={handlePress}
        >
          <ChevronLeft color={colors.text.primary} size={24} />
        </LiquidGlassButton>

        {/* Profile pill - iOS Liquid Glass */}
        <LiquidGlassButton
          style={styles.profilePill}
          contentStyle={styles.profilePillContent}
          borderRadius={PILL_HEIGHT / 2}
        >
          <TouchableOpacity style={styles.profileSection} activeOpacity={0.7}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User color={colors.text.secondary} size={16} />
              </View>
            )}
            <Text style={styles.roomName} numberOfLines={1}>
              {roomName}
            </Text>
          </TouchableOpacity>
        </LiquidGlassButton>

        {/* Spacer to push buttons to the right */}
        <View style={styles.spacer} />

        {/* Combined Scan + Vixx pill - iOS Liquid Glass (hidden for founder chat) */}
        {!isFounderChat && (
          <LiquidGlassButton
            style={styles.combinedPill}
            contentStyle={styles.combinedPillContent}
            borderRadius={PILL_HEIGHT / 2}
          >
            {/* Scan button */}
            <TouchableOpacity
              style={[
                styles.combinedButton,
                isAnalysisModeActive && styles.combinedButtonActive,
              ]}
              onPress={toggleAnalysisMode}
              activeOpacity={0.7}
            >
              <ScanSearch
                size={22}
                color={
                  isAnalysisModeActive
                    ? colors.accent.cyan
                    : colors.text.primary
                }
              />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.pillDivider} />

            {/* Vixx button */}
            <TouchableOpacity
              style={styles.combinedButton}
              onPress={() => toggleAIAssistant(true)}
              activeOpacity={0.7}
            >
              <VixxLogo size={32} color={colors.text.primary} />
            </TouchableOpacity>
          </LiquidGlassButton>
        )}
      </View>
    </View>
  );
}

const PILL_HEIGHT = 44;

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  backPill: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
  },
  backPillContent: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  profilePill: {
    height: PILL_HEIGHT,
  },
  profilePillContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 16,
    height: PILL_HEIGHT,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: 180,
  },
  spacer: {
    flex: 1,
  },
  combinedPill: {
    height: PILL_HEIGHT,
  },
  combinedPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  combinedButton: {
    width: 24,
    height: PILL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  combinedButtonActive: {
    // No background - just rely on icon color change for active state
  },
  pillDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.transparent.white15,
  },
});
