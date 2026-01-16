import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Text,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { CarbonFiberTexture } from '../components/ui/NoiseTexture';
import { Settings, Plus } from 'lucide-react-native';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';
import { useDirectRooms } from '../hooks/room';
import { getMatrixClient } from '../matrixClient';
import {
  getRoomAvatarUrl,
  getLastRoomMessageAsync,
  isMessageFromMe,
} from '../utils/room';
import { useAuth } from '../context/AuthContext';
import { RoomListItem, RoomItemData } from '../components/room/RoomListItem';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { EmptyState } from '../components/common/EmptyState';
import { SocialAccountService } from '../services/apiService';
import ForceLogOutModal from '../components/ForceLogOutModal';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { colors } from '../theme';
import { useChatWithFounder } from '../hooks/useChatWithFounder';

type DirectMessageListScreenProps = {
  onSelectRoom: (roomId: string) => void;
  onCreateChat?: () => void;
  onOpenSettings?: () => void;
  onOpenPendingInvitations?: () => void;
  selectedRoomId?: string;
};

export function DirectMessageListScreen({
  onSelectRoom,
  onCreateChat,
  onOpenSettings,
  onOpenPendingInvitations,
  selectedRoomId,
}: DirectMessageListScreenProps) {
  const { directRooms, isLoading, invitedRooms } = useDirectRooms();
  const [refreshing, setRefreshing] = useState(false);
  const [roomItems, setRoomItems] = useState<RoomItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForceLogOut, setShowForceLogOut] = useState(false);
  const mx = getMatrixClient();
  const { logout } = useAuth();
  const socialAccountService = SocialAccountService.getInstance();
  const insets = useSafeAreaInsets();
  const loadingRef = useRef(false);
  const { handleChatWithFounder, founderAvatar } = useChatWithFounder(onSelectRoom);

  const handleFabPress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onOpenPendingInvitations?.();
  }, [onOpenPendingInvitations]);

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
      items.map(async item => {
        const { message, timestamp, senderId, senderName } =
          await getLastRoomMessageAsync(mx, item.room);
        const isFromMe = senderId
          ? isMessageFromMe(senderId, myUserId, item.name, senderName || '')
          : false;
        return {
          ...item,
          lastMessage: message ? (isFromMe ? `You: ${message}` : message) : '',
          lastEventTime: timestamp || item.lastEventTime,
        };
      }),
    );

    // Sort by actual message timestamp
    updatedItems.sort(
      (a, b) => (b.lastEventTime || 0) - (a.lastEventTime || 0),
    );
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
  };

  const handleCheckConnectedAccount = async () => {
    try {
      setSyncing(true);
      const synced = await socialAccountService.syncSocialAccounts(
        onForceLogout,
      );
      if (synced) {
        const result = await socialAccountService.getSocialAccounts(
          onForceLogout,
        );
        const isInstagramAccountConnected =
          socialAccountService.instagramAccountConnected(result);
        if (!isInstagramAccountConnected) {
          onForceLogout();
          return;
        }
        setSyncing(false);
      }
    } catch (error) {
      console.info('Error syncing social accounts:', error);
    }
  };

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
      {/* Solid black background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      {/* Carbon fiber weave texture */}
      <CarbonFiberTexture opacity={0.6} scale={0.5} />
      {syncing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={20} color={colors.accent.primary} />
          <Text style={styles.loadingText}>Syncing your account...</Text>
        </View>
      ) : null}
      {roomItems.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Welcome to VIXX"
            subtitle="Tap + to Add Chat"
            actionLabel={onCreateChat ? 'Create Chat' : undefined}
            onAction={onCreateChat}
          />
          <LiquidGlassButton
            style={styles.emptyStateButton}
            contentStyle={styles.fabContent}
            borderRadius={28}
            onPress={handleFabPress}
          >
            <Plus color={colors.text.primary} size={28} />
          </LiquidGlassButton>
        </View>
      ) : (
        <>
          <View style={[styles.sectionHeaderRow, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.sectionHeader}>Chats</Text>
            {/* Floating pill with founder avatar + settings - liquid glass */}
            <View style={styles.headerPill}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="thinMaterialDark"
                blurAmount={25}
                reducedTransparencyFallbackColor="rgba(30, 35, 45, 0.9)"
              />
              {/* Dark overlay for deeper black */}
              <View style={styles.pillDarkOverlay} pointerEvents="none" />
              {/* Subtle border */}
              <View style={styles.pillGlassHighlight} pointerEvents="none" />
              <TouchableOpacity
                onPress={handleChatWithFounder}
                style={styles.pillButton}
                activeOpacity={0.7}
              >
                <Image source={founderAvatar} style={styles.founderAvatar} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onOpenSettings}
                style={styles.pillButton}
                activeOpacity={0.7}
              >
                <Settings color={colors.text.primary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Inset shadow divider */}
          <View style={styles.listShadow} pointerEvents="none" />
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
        </>
      )}
      {/* FAB - Bottom Right - Liquid Glass with fallback */}
      {roomItems.length > 0 ? (
        <LiquidGlassButton
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          contentStyle={styles.fabContent}
          borderRadius={28}
          onPress={handleFabPress}
        >
          <Plus color={colors.text.primary} size={28} />
        </LiquidGlassButton>
      ) : null}
      <ForceLogOutModal visible={showForceLogOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    // No shadow - recessed dark style
  },
  pillDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 22,
  },
  pillGlassHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.10)',
  },
  pillButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  founderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  listShadow: {
    height: 12,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
  },
  fabContent: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateButton: {
    marginTop: 24,
    width: 56,
    height: 56,
  },
});
