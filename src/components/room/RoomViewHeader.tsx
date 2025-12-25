import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { ArrowLeft, User } from 'lucide-react-native';
import { Room } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import { getRoomAvatarUrl } from '../../utils/room';

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
        reducedTransparencyFallbackColor="#0A0A0F"
      />
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft color="#FFFFFF" size={24} />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <User color="#9CA3AF" size={16} />
          </View>
        )}
        <Text style={styles.roomName} numberOfLines={1}>
          {roomName}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAIAssistantClick}
        style={styles.aiButton}
      >
        <User color="#FFFFFF" size={24} />
      </TouchableOpacity>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    borderRadius: '50%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiButton: {
    padding: 8,
  },
});
