import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Room } from 'matrix-js-sdk';
import { formatRelativeTimeWithRecent } from 'src/utils/timeFormatter';
import { getInitials } from 'src/utils/room';
import { colors } from 'src/config';

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
      style={[
        styles.roomLastMessage,
        hasUnread && styles.roomLastMessageUnread,
      ]}
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
      activeOpacity={0.6}
      style={[styles.roomItem, isSelected && styles.roomItemSelected]}
    >
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.transparent.white15,
  },
  roomItemSelected: {
    backgroundColor: colors.transparent.white05,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.secondary,
    fontSize: 22,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent.primary,
    borderWidth: 2,
    borderColor: colors.background.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  roomContent: {
    flex: 1,
    marginRight: 8,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  roomNameUnread: {
    fontWeight: '800',
  },
  roomTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  roomTimeUnread: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  roomLastMessage: {
    fontSize: 15,
    color: colors.text.lastMessage,
    fontWeight: '600',
  },
  roomLastMessageUnread: {
    color: colors.text.messageOther,
    fontWeight: '800',
  },
});
