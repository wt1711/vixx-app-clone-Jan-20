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

// ============================================================================
// Types
// ============================================================================

interface PendingInvitationsModalProps {
  onClose: () => void;
}

interface RoomRowProps {
  item: RoomItemData;
  isLast: boolean;
  isProcessing: boolean;
  onPress: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

const SuccessToast = ({ name }: { name: string }) => (
  <View style={styles.toast}>
    <Check color={colors.status.online} size={24} />
    <View style={styles.toastContent}>
      <Text style={styles.toastTitle}>{name} added</Text>
    </View>
  </View>
);

const SearchInput = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => (
  <View style={styles.searchContainer}>
    {value.length === 0 && (
      <View style={styles.searchPlaceholder} pointerEvents="none">
        <Search color={colors.text.secondary} size={18} />
        <Text style={styles.searchPlaceholderText}>Search</Text>
      </View>
    )}
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

const RoomRow = ({ item, isLast, isProcessing, onPress }: RoomRowProps) => (
  <TouchableOpacity
    style={[styles.roomItem, !isLast && styles.roomItemBorder]}
    onPress={onPress}
    disabled={isProcessing}
    activeOpacity={0.6}
  >
    <View style={styles.avatarContainer}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
      )}
    </View>

    <View style={styles.roomInfo}>
      <Text style={styles.roomName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
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

const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
      {hasSearch ? 'No rooms found' : 'No pending invitations'}
    </Text>
  </View>
);

// ============================================================================
// Hooks
// ============================================================================

const useRoomItems = () => {
  const mx = getMatrixClient();
  const { pendingRooms } = usePendingMetabotRoomsContext();
  const { invitedRooms } = useDirectRooms();

  return useMemo(() => {
    if (!mx) return [];

    const items: RoomItemData[] = [];
    const addedRoomIds = new Set<string>();

    // Add pending metabot rooms
    pendingRooms.forEach((data, roomId) => {
      const room = mx.getRoom(roomId);
      if (!room) return;

      items.push({
        roomId,
        room,
        name: getRoomDisplayName(room, mx),
        lastMessage: '',
        lastEventTime: data.timestamp || room.getLastActiveTimestamp() || 0,
        unreadCount: room.getUnreadNotificationCount() || 0,
        avatarUrl: getRoomAvatarUrl(mx, room, 96, true),
      });
      addedRoomIds.add(roomId);
    });

    // Add regular invited rooms
    for (const room of invitedRooms) {
      if (addedRoomIds.has(room.roomId)) continue;

      items.push({
        roomId: room.roomId,
        room,
        name: getRoomDisplayName(room, mx),
        lastMessage: '',
        lastEventTime: room.getLastActiveTimestamp() || 0,
        unreadCount: room.getUnreadNotificationCount() || 0,
        avatarUrl: getRoomAvatarUrl(mx, room, 96, true),
      });
    }

    return items.sort((a, b) => (b.lastEventTime || 0) - (a.lastEventTime || 0));
  }, [mx, pendingRooms, invitedRooms]);
};

// ============================================================================
// Main Component
// ============================================================================

const PendingInvitationsModal = ({ onClose }: PendingInvitationsModalProps) => {
  const mx = getMatrixClient();
  const { pendingRooms, removePendingRoom } = usePendingMetabotRoomsContext();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const roomItems = useRoomItems();

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return roomItems;
    const query = searchQuery.toLowerCase();
    return roomItems.filter(item => item.name.toLowerCase().includes(query));
  }, [roomItems, searchQuery]);

  const handleAccept = useCallback(
    async (room: Room) => {
      if (!mx || processingIds.has(room.roomId)) return;

      const isPending = pendingRooms.has(room.roomId);
      const roomName = getRoomDisplayName(room, mx);

      setProcessingIds(prev => new Set(prev).add(room.roomId));

      try {
        if (isPending) {
          removePendingRoom(room.roomId);
        } else {
          await mx.joinRoom(room.roomId);
        }

        await new Promise<void>(resolve => setTimeout(resolve, 0));
        setSuccessBanner(roomName);
        setTimeout(() => setSuccessBanner(null), 5000);
      } catch (error: any) {
        console.error('Failed to accept room:', error);
        Alert.alert('Error', error.message || 'Failed to add');
      } finally {
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(room.roomId);
          return next;
        });
      }
    },
    [mx, processingIds, pendingRooms, removePendingRoom],
  );

  const confirmAccept = useCallback(
    (room: Room) => {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      const name = getRoomDisplayName(room, mx);
      Alert.alert('', `Add ${name || 'this conversation'} to your list?`, [
        { text: 'Yes', onPress: () => handleAccept(room) },
        { text: 'No', style: 'cancel' },
      ]);
    },
    [handleAccept, mx],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: RoomItemData; index: number }) => (
      <RoomRow
        item={item}
        isLast={index === filteredRooms.length - 1}
        isProcessing={processingIds.has(item.roomId)}
        onPress={() => confirmAccept(item.room)}
      />
    ),
    [filteredRooms.length, processingIds, confirmAccept],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...gradients.screenDark]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LiquidGlassButton
          style={styles.backPill}
          contentStyle={styles.backPillContent}
          borderRadius={22}
          onPress={onClose}
        >
          <ChevronLeft color={colors.text.primary} size={24} />
        </LiquidGlassButton>
        <Text style={styles.headerTitle}>Add Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {successBanner && <SuccessToast name={successBanner} />}
        <SearchInput value={searchQuery} onChangeText={setSearchQuery} />

        {filteredRooms.length > 0 ? (
          <View style={styles.listSection}>
            <FlatList
              data={filteredRooms}
              renderItem={renderItem}
              keyExtractor={item => item.roomId}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              extraData={processingIds}
            />
          </View>
        ) : (
          <EmptyState hasSearch={!!searchQuery} />
        )}
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

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
  toast: {
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
