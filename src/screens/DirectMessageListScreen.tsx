import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Settings } from 'lucide-react-native';
import { useDirectRooms } from '../hooks/room';
import { getMatrixClient } from '../matrixClient';
import { getRoomAvatarUrl, getLastRoomMessageAsync, isMessageFromMe } from '../utils/room';
import { useAuth } from '../context/AuthContext';
import { RoomListItem, RoomItemData } from '../components/room/RoomListItem';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { EmptyState } from '../components/common/EmptyState';
import { SocialAccountService } from '../services/apiService';
import ForceLogOutModal from '../components/ForceLogOutModal';
import PendingInvitationsModal from '../components/PendingInvitationsModal';
import { colors, gradients } from '../theme';

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
  const { directRooms, isLoading, invitedRooms } = useDirectRooms();
  const [refreshing, setRefreshing] = useState(false);
  const [roomItems, setRoomItems] = useState<RoomItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForceLogOut, setShowForceLogOut] = useState(false);
  const [showPendingInvitationsModal, setShowPendingInvitationsModal] = useState(false);
  const mx = getMatrixClient();
  const { logout } = useAuth();
  const socialAccountService = SocialAccountService.getInstance();
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
    const myUserId = mx.getUserId();
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const { message, timestamp, senderId, senderName } = await getLastRoomMessageAsync(mx, item.room);
        const isFromMe = senderId ? isMessageFromMe(senderId, myUserId, item.name, senderName || '') : false;
        return {
          ...item,
          lastMessage: message ? (isFromMe ? `You: ${message}` : message) : '',
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

  const onForceLogout = () => {
    setShowForceLogOut(true);
  }

  const handleCheckConnectedAccount = async () => {
    try {
      setSyncing(true);
      const synced = await socialAccountService.syncSocialAccounts(onForceLogout);
      if (synced) {
        const result = await socialAccountService.getSocialAccounts(onForceLogout);
        const isInstagramAccountConnected = socialAccountService.instagramAccountConnected(result);
        if (!isInstagramAccountConnected) {
          onForceLogout();
          return;
        }
        setSyncing(false);
      }
    } catch (error) {
      console.info('Error syncing social accounts:', error);
    }
  }

  useEffect(() => {
    if (showForceLogOut) {
      setTimeout(logout, 2000);
    }
  }, [showForceLogOut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (socialAccountService.needSync) {
      handleCheckConnectedAccount();
    }
  }, [socialAccountService.needSync]); // eslint-disable-line react-hooks/exhaustive-deps

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
        colors={[...gradients.screenBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor={colors.background.primary}
        />
        <TouchableOpacity
          onPress={logout}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Settings color={colors.text.primary} size={24} />
        </TouchableOpacity>
      </View>
      {syncing ? (
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Syncing your account...</Text>
      </View>
      ) : null}
      {invitedRooms.length > 0 ? (
        <View style={styles.invitedRoomsContainer}>
          <TouchableOpacity onPress={() => setShowPendingInvitationsModal(true)} style={styles.invitedRoomsButton}>
            <Text style={styles.invitedRoomsText}>You have {invitedRooms.length} pending invitation{invitedRooms.length > 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        </View>) : null }
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
              tintColor={colors.accent.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ForceLogOutModal visible={showForceLogOut}/>
      <PendingInvitationsModal visible={showPendingInvitationsModal} invitedRooms={invitedRooms} mx={mx} onClose={() => setShowPendingInvitationsModal(false)}/>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
  },
  settingsButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  invitedRoomsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  invitedRoomsButton: {
    backgroundColor: colors.accent.instagram,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitedRoomsText: {
    fontSize: 16,
    color: colors.text.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
