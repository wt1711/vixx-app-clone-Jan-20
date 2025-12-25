import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Settings } from 'lucide-react-native';

const Gradient = LinearGradient as any;
import { Room } from 'matrix-js-sdk';
import { useDirectRooms } from '../hooks/useDirectRooms';
import { getMatrixClient } from '../matrixClient';
import { getRoomAvatarUrl, getLastRoomMessage } from '../utils/room';
import { useAuth } from '../context/AuthContext';

type DirectMessageListScreenProps = {
  onSelectRoom: (roomId: string) => void;
  onCreateChat?: () => void;
  selectedRoomId?: string;
};

type RoomItem = {
  roomId: string;
  room: Room;
  name: string;
  lastMessage?: string;
  lastEventTime?: number;
  unreadCount: number;
  avatarUrl?: string;
};

export function DirectMessageListScreen({
  onSelectRoom,
  onCreateChat,
  selectedRoomId,
}: DirectMessageListScreenProps) {
  const { directRooms, isLoading } = useDirectRooms();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const mx = getMatrixClient();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The useDirectRooms hook will automatically update via event listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const roomItems: RoomItem[] = useMemo(() => {
    setLoading(true);
    if (!mx) return [];

    return directRooms.map((room: Room) => {
      // Use room.name directly - Matrix SDK handles the display name correctly
      // This matches the NextJS implementation
      const name = room.name || 'Unknown';

      // Get last message from room timeline
      const { message: lastMessage, timestamp: lastEventTime } = getLastRoomMessage(room);

      const unreadCount = room.getUnreadNotificationCount() || 0;
      const avatarUrl = getRoomAvatarUrl(mx, room, 96, true);

      setLoading(false);

      return {
        roomId: room.roomId,
        room,
        name,
        lastMessage,
        lastEventTime,
        unreadCount,
        avatarUrl,
      };
    });
  }, [directRooms, mx]);

  const renderRoomItem = ({ item }: { item: RoomItem }) => {
    const formatTime = (
      timestamp?: number,
    ): { text: string; isRecent: boolean } => {
      if (!timestamp) return { text: '', isRecent: false };
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 60) {
        return { text: `${minutes}m ago`, isRecent: true };
      } else if (hours < 24) {
        return { text: `${hours}h ago`, isRecent: true };
      } else if (days === 1) {
        return { text: 'Yesterday', isRecent: false };
      } else if (days < 7) {
        return {
          text: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isRecent: false,
        };
      } else {
        return {
          text: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          isRecent: false,
        };
      }
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const isSelected = selectedRoomId === item.roomId;

    return (
      <TouchableOpacity
        onPress={() => onSelectRoom(item.roomId)}
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
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {getInitials(item.name)}
                  </Text>
                </View>
              )}
              {item.unreadCount > 0 && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.roomContent}>
              <View style={styles.roomHeader}>
                <Text
                  style={[
                    styles.roomName,
                    item.unreadCount > 0 && styles.roomNameUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.lastEventTime ? (
                  <Text
                    style={[
                      styles.roomTime,
                      item.unreadCount > 0 && styles.roomTimeUnread,
                    ]}
                  >
                    {formatTime(item.lastEventTime).text}
                  </Text>
                ) : null}
              </View>
              {item.lastMessage ? (
                <Text
                  style={[
                    styles.roomLastMessage,
                    item.unreadCount > 0 && styles.roomLastMessageUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading || loading) {
    return (
      <View style={styles.container}>
        <Gradient
          colors={['#0A0A0F', '#1A1A2E', '#16213E', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={80}
            reducedTransparencyFallbackColor="#0A0A0F"
          />
          <TouchableOpacity style={styles.settingsButton}>
            <Settings color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E', '#0A0A0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor="#0A0A0F"
        />
        <TouchableOpacity
          onPress={logout}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Settings color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>
      {roomItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No direct messages yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation to see it here
          </Text>
          {onCreateChat ? (
            <TouchableOpacity style={styles.emptyButton} onPress={onCreateChat}>
              <Text style={styles.emptyButtonText}>Create Chat</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={roomItems}
          renderItem={renderRoomItem}
          keyExtractor={item => item.roomId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B35"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
