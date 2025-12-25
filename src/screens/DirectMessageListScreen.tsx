import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Settings } from 'lucide-react-native';
import { useDirectRooms } from '../hooks/useDirectRooms';
import { getMatrixClient } from '../matrixClient';
import { getRoomAvatarUrl, getLastRoomMessageAsync } from '../utils/room';
import { useAuth } from '../context/AuthContext';
import { RoomListItem, RoomItemData } from '../components/room/RoomListItem';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { EmptyState } from '../components/common/EmptyState';

type DirectMessageListScreenProps = {
  onSelectRoom: (roomId: string) => void;
  onCreateChat?: () => void;
  selectedRoomId?: string;
};

export function DirectMessageListScreen({
  onSelectRoom,
  onCreateChat,
  selectedRoomId,
}: DirectMessageListScreenProps) {
  const { directRooms, isLoading } = useDirectRooms();
  const [refreshing, setRefreshing] = useState(false);
  const [roomItems, setRoomItems] = useState<RoomItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const mx = getMatrixClient();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const loadingRef = useRef(false);

  // Load room data with async message fetching
  const loadRoomItems = useCallback(async () => {
    if (!mx || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    const items: RoomItemData[] = [];

    // First pass: create items with basic data (fast)
    for (const room of directRooms) {
      const name = room.name || 'Unknown';
      const unreadCount = room.getUnreadNotificationCount() || 0;
      const avatarUrl = getRoomAvatarUrl(mx, room, 96, true);

      items.push({
        roomId: room.roomId,
        room,
        name,
        lastMessage: '',
        lastEventTime: room.getLastActiveTimestamp() || 0,
        unreadCount,
        avatarUrl,
      });
    }

    // Sort by last active timestamp initially
    items.sort((a, b) => (b.lastEventTime || 0) - (a.lastEventTime || 0));

    // Show items immediately with timestamps
    setRoomItems([...items]);
    setLoading(false);

    // Second pass: fetch actual last messages (async)
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const { message, timestamp } = await getLastRoomMessageAsync(mx, item.room);
        return {
          ...item,
          lastMessage: message,
          lastEventTime: timestamp || item.lastEventTime,
        };
      })
    );

    // Sort by actual message timestamp
    updatedItems.sort((a, b) => (b.lastEventTime || 0) - (a.lastEventTime || 0));
    setRoomItems(updatedItems);
    loadingRef.current = false;
  }, [mx, directRooms]);

  useEffect(() => {
    if (!isLoading && directRooms.length >= 0) {
      loadRoomItems();
    }
  }, [isLoading, directRooms, loadRoomItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoomItems().finally(() => setRefreshing(false));
  }, [loadRoomItems]);

  const renderItem = useCallback(
    ({ item }: { item: RoomItemData }) => (
      <RoomListItem
        item={item}
        isSelected={selectedRoomId === item.roomId}
        onPress={onSelectRoom}
      />
    ),
    [selectedRoomId, onSelectRoom],
  );

  const keyExtractor = useCallback((item: RoomItemData) => item.roomId, []);

  if (isLoading || (loading && roomItems.length === 0)) {
    return <LoadingScreen message="Loading messages..." />;
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
        <EmptyState
          title="No direct messages yet"
          subtitle="Start a conversation to see it here"
          actionLabel={onCreateChat ? 'Create Chat' : undefined}
          onAction={onCreateChat}
        />
      ) : (
        <FlatList
          data={roomItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
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
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
