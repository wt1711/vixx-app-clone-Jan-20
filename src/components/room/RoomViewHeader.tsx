import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { ArrowLeft, User } from 'lucide-react-native';
import { Room } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import { getRoomAvatarUrl } from '../../utils/room';
import { colors } from '../../theme';

type RoomViewHeaderProps = {
  room: Room;
  onBack: () => void;
  onAIAssistantClick: () => void;
};

export function RoomViewHeader({
  room,
  onBack,
  onAIAssistantClick,
}: RoomViewHeaderProps) {
  const mx = getMatrixClient();

  // Use room.name directly - Matrix SDK handles the display name correctly
  // This matches the NextJS implementation
  const roomName = room.name || 'Unknown';

  // Get avatar from fallback member for direct messages, or room avatar
  // Get MXC URL and convert to HTTP with authentication token in URL
  const avatarUrl = mx ? getRoomAvatarUrl(mx, room, 96, true) : undefined;

  return (
    <View style={styles.header}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={80}
        reducedTransparencyFallbackColor={colors.background.primary}
      />
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft color={colors.text.primary} size={24} />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
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
      </View>

      {/* <TouchableOpacity
        onPress={onAIAssistantClick}
        style={styles.aiButton}
      >
        <User color={colors.text.primary} size={24} />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
    overflow: 'hidden',
    backgroundColor: colors.transparent.black30,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.transparent.white30,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  aiButton: {
    padding: 8,
  },
});
