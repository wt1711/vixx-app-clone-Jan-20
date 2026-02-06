import { Room } from 'matrix-js-sdk';
import { useCallback, useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Search, Check, ChevronLeft } from 'lucide-react-native';
import { LiquidGlassButton } from 'src/components/ui/LiquidGlassButton';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { colors, gradients } from 'src/config';
import type { RoomItemData } from 'src/components/room';
import { getRoomAvatarUrl, getInitials, getRoomDisplayName } from 'src/utils/room';
import { usePendingMetabotRoomsContext } from 'src/hooks/context/PendingMetabotRoomsContext';
import { useDirectRooms } from 'src/hooks/room/useDirectRooms';
import { getMatrixClient } from 'src/services/matrixClient';

/**
 * PendingInvitationsModal - "The UI"
 * Shows pending metabot rooms that have been auto-joined but not yet accepted
 * Uses the pending rooms context to get the list of rooms
 */
const PendingInvitationsModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const mx = getMatrixClient();
  const { pendingRooms, removePendingRoom } = usePendingMetabotRoomsContext();
  const { invitedRooms } = useDirectRooms();

  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Convert pending rooms AND invited rooms to room items for display
  const roomItems = useMemo(() => {
    if (!mx) return [];

    const items: RoomItemData[] = [];
    const addedRoomIds = new Set<string>();

    // Add pending metabot rooms first
    pendingRooms.forEach((data, roomId) => {
      const room = mx.getRoom(roomId);
      if (!room) return;

      const name = getRoomDisplayName(room, mx);
      const avatarUrl = getRoomAvatarUrl(mx, room, 96, true);
      const unreadCount = room.getUnreadNotificationCount() || 0;

      items.push({
        roomId,
        room,
        name,
        lastMessage: '',
        lastEventTime: data.timestamp || room.getLastActiveTimestamp() || 0,
        unreadCount,
        avatarUrl,
      });
      addedRoomIds.add(roomId);
    });

    // Add regular invited rooms (that aren't already in pending)
    for (const room of invitedRooms) {
      if (addedRoomIds.has(room.roomId)) continue;

      const name = getRoomDisplayName(room, mx);
      const avatarUrl = getRoomAvatarUrl(mx, room, 96, true);
      const unreadCount = room.getUnreadNotificationCount() || 0;

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

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => (b.lastEventTime || 0) - (a.lastEventTime || 0));
  }, [mx, pendingRooms, invitedRooms]);

  // Filter rooms by search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return roomItems;
    return roomItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [roomItems, searchQuery]);

  // Handle accept action - works for both pending metabot rooms and regular invites
  const handleAccept = useCallback(async (room: Room) => {
    if (!mx || processingIds.has(room.roomId)) return;

    const isPending = pendingRooms.has(room.roomId);
    const roomName = getRoomDisplayName(room, mx);

    // Step 1: Add to processing (show spinner)
    setProcessingIds(prev => new Set(prev).add(room.roomId));

    try {
      if (isPending) {
        // Pending metabot room - already joined, just remove from pending
        removePendingRoom(room.roomId);
      } else {
        // Regular invite - need to join the room
        await mx.joinRoom(room.roomId);
      }

      // Allow state to propagate
      await new Promise<void>(resolve => setTimeout(resolve, 0));

      // Show success banner
      setSuccessBanner(roomName);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (error: any) {
      console.error('Failed to accept room:', error);
      Alert.alert('Error', error.message || 'Failed to add');
    } finally {
      // Remove from processing
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(room.roomId);
        return next;
      });
    }
  }, [mx, processingIds, pendingRooms, removePendingRoom]);

  const confirmAccept = useCallback((room: Room) => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    const name = getRoomDisplayName(room, mx);
    Alert.alert('', `Add ${name || 'this conversation'} to your list?`, [
      { text: 'Yes', onPress: () => handleAccept(room) },
      { text: 'No', style: 'cancel' },
    ]);
  }, [handleAccept, mx]);

  const renderItem = useCallback(({
    item,
    index,
  }: {
    item: RoomItemData;
    index: number;
  }) => {
    const isProcessing = processingIds.has(item.roomId);
    const isLast = index === filteredRooms.length - 1;

    return (
      <TouchableOpacity
        style={[styles.roomItem, !isLast && styles.roomItemBorder]}
        onPress={() => confirmAccept(item.room)}
        disabled={isProcessing}
        activeOpacity={0.6}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
          )}
        </View>

        {/* Room Name */}
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Add button - Spotify style */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => confirmAccept(item.room)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Text style={styles.addButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [processingIds, filteredRooms.length, confirmAccept]);

  const keyExtractor = useCallback((item: RoomItemData) => item.roomId, []);

  return (
    <View style={styles.container}>
      {/* Subtle gradient for glass refraction effect */}
      <LinearGradient
        colors={[...gradients.screenDark]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header - flat title like Chats header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* Back pill - liquid glass */}
        <LiquidGlassButton
          style={styles.backPill}
          contentStyle={styles.backPillContent}
          borderRadius={22}
          onPress={onClose}
        >
          <ChevronLeft color={colors.text.primary} size={24} />
        </LiquidGlassButton>

        {/* Flat title - like Chats header */}
        <Text style={styles.headerTitle}>Add Chat</Text>

        {/* Spacer for balance */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Success Toast */}
        {successBanner ? (
          <View style={styles.successfullyAddedToast}>
            <Check color={colors.status.online} size={24} />
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle}>{successBanner} added</Text>
            </View>
          </View>
        ) : null}

        {/* Search Input - icon next to placeholder text */}
        <View style={styles.searchContainer}>
          {searchQuery.length === 0 && (
            <View style={styles.searchPlaceholder} pointerEvents="none">
              <Search color={colors.text.secondary} size={18} />
              <Text style={styles.searchPlaceholderText}>Search</Text>
            </View>
          )}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List with inverted border for recessed effect */}
        {filteredRooms.length > 0 ? (
          <View style={styles.listSection}>
            <FlatList
              data={filteredRooms}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              extraData={processingIds}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No rooms found' : 'No pending invitations'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.screenDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backPill: {
    width: 44,
    height: 44,
  },
  backPillContent: {
    flex: 1,
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  successfullyAddedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: colors.transparent.roomItem,
  },
  toastContent: {
    marginLeft: 12,
    flex: 1,
  },
  toastTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.transparent.white08,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchPlaceholder: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    right: 0,
  },
  searchPlaceholderText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginLeft: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    paddingVertical: 0,
    textAlign: 'center',
  },
  listSection: {
    flex: 1,
    borderRadius: 12,
    // Inverted border lighting - darker on top/left (shadowed), lighter on bottom/right
    borderWidth: 1,
    borderTopColor: colors.transparent.black30,
    borderLeftColor: colors.transparent.black20,
    borderBottomColor: colors.transparent.white03,
    borderRightColor: colors.transparent.white02,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  roomItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.transparent.white10,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.secondary,
    fontSize: 20,
    fontWeight: '600',
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.transparent.white30,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
});

export default PendingInvitationsModal;
