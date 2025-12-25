import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Room } from 'matrix-js-sdk';
import { formatRelativeTimeWithRecent } from '../../utils/timeFormatter';
import { getInitials } from '../../utils/stringUtils';

export type RoomItemData = {
  roomId: string;
  room: Room;
  name: string;
  lastMessage?: string;
  lastEventTime?: number;
  unreadCount: number;
  avatarUrl?: string;
};

type RoomListItemProps = {
  item: RoomItemData;
  isSelected: boolean;
  onPress: (roomId: string) => void;
};

function Avatar({ avatarUrl, name }: { avatarUrl?: string; name: string }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

function UnreadIndicator({ count }: { count: number }) {
  if (count <= 0) return null;
  return <View style={styles.unreadDot} />;
}

function TimeStamp({
  timestamp,
  hasUnread,
}: {
  timestamp?: number;
  hasUnread: boolean;
}) {
  if (!timestamp) return null;

  const { text } = formatRelativeTimeWithRecent(timestamp);

  return (
    <Text style={[styles.roomTime, hasUnread && styles.roomTimeUnread]}>
      {text}
    </Text>
  );
}

function LastMessage({
  message,
  hasUnread,
}: {
  message?: string;
  hasUnread: boolean;
}) {
  if (!message) return null;

  return (
    <Text
      style={[styles.roomLastMessage, hasUnread && styles.roomLastMessageUnread]}
      numberOfLines={1}
    >
      {message}
    </Text>
  );
}

export function RoomListItem({ item, isSelected, onPress }: RoomListItemProps) {
  const hasUnread = item.unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(item.roomId)}
      activeOpacity={0.8}
      style={styles.roomItemWrapper}
    >
      <View style={[styles.roomItem, isSelected && styles.roomItemSelected]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor="#1A1A2E"
        />
        <View style={styles.roomItemContent}>
          <View style={styles.avatarContainer}>
            <Avatar avatarUrl={item.avatarUrl} name={item.name} />
            <UnreadIndicator count={item.unreadCount} />
          </View>
          <View style={styles.roomContent}>
            <View style={styles.roomHeader}>
              <Text
                style={[styles.roomName, hasUnread && styles.roomNameUnread]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <TimeStamp timestamp={item.lastEventTime} hasUnread={hasUnread} />
            </View>
            <LastMessage message={item.lastMessage} hasUnread={hasUnread} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomItemWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  roomItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 15, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  roomItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  roomItemSelected: {
    backgroundColor: 'rgba(30, 30, 45, 0.5)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#0A0A0F',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  roomNameUnread: {
    fontWeight: '800',
  },
  roomTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 8,
  },
  roomTimeUnread: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  roomLastMessage: {
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  roomLastMessageUnread: {
    color: '#F3F4F6',
    fontWeight: '800',
  },
});
