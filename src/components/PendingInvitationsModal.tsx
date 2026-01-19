import { MatrixClient, Room } from 'matrix-js-sdk';
import { useCallback, useState, useEffect } from 'react';
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
import { colors, gradients } from 'src/theme';
import { RoomItemData } from 'src/components/room/RoomListItem';
import { getRoomAvatarUrl } from 'src/utils/room';
import { getInitials } from 'src/utils/stringUtils';

const PendingInvitationsModal = ({
  invitedRooms,
  mx,
  onClose,
}: {
  invitedRooms: Room[];
  mx: MatrixClient | null;
  onClose: () => void;
}) => {
  const [roomItems, setRoomItems] = useState<RoomItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingRoomId, setProcessingRoomId] = useState<{
    roomId: string;
    action: 'accept' | 'reject';
  } | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Load room data with async message fetching
  const loadRoomItems = useCallback(async () => {
    if (!mx) return;

    const items: RoomItemData[] = [];

    // First pass: create items with basic data (fast)
    for (const room of invitedRooms) {
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
    setRoomItems(items);
  }, [mx, invitedRooms]);

  useEffect(() => {
    loadRoomItems();
  }, [loadRoomItems]);

  // Filter rooms by search query
  const filteredRooms = roomItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAccept = async (room: Room) => {
    if (!mx || processingRoomId) return;

    setProcessingRoomId({ roomId: room.roomId, action: 'accept' });
    try {
      await mx.joinRoom(room.roomId);
      // Remove from list after successful join
      setRoomItems(prev => prev.filter(item => item.roomId !== room.roomId));
      // Show success banner
      setSuccessBanner(room.name || 'Chat');
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      Alert.alert('Error', error.message || 'Failed to add');
    } finally {
      setProcessingRoomId(null);
    }
  };

  const confirmAccept = (room: Room) => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    Alert.alert('', `Add ${room.name || 'this conversation'} to your list?`, [
      { text: 'Yes', onPress: () => handleAccept(room) },
      { text: 'No', style: 'cancel' },
    ]);
  };

  // const handleReject = async (room: Room) => {
  //   if (!mx || processingRoomId) return;

  //   setProcessingRoomId({ roomId: room.roomId, action: 'reject' });
  //   try {
  //     await mx.leave(room.roomId);
  //     Alert.alert('Success', 'Invitation rejected');
  //     // Remove from list after successful leave
  //     setRoomItems(prev => prev.filter(item => item.roomId !== room.roomId));
  //   } catch (error: any) {
  //     console.error('Failed to reject invitation:', error);
  //     Alert.alert('Error', error.message || 'Failed to reject invitation');
  //   } finally {
  //     setProcessingRoomId(null);
  //   }
  // };

  const renderItem = ({
    item,
    index,
  }: {
    item: RoomItemData;
    index: number;
  }) => {
    const isProcessing =
      processingRoomId?.roomId === item.roomId &&
      processingRoomId.action === 'accept';
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
  };

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
