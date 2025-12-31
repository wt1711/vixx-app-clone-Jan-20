import { MatrixClient, Room } from 'matrix-js-sdk';
import { useCallback, useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
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
import { BlurView } from '@react-native-community/blur';
import { Search, Check, ChevronLeft } from 'lucide-react-native';
import { colors, gradients } from '../theme';
import { RoomItemData } from './room/RoomListItem';
import { getRoomAvatarUrl } from '../utils/room';
import { getInitials } from '../utils/stringUtils';

const PendingInvitationsModal = ({
  visible,
  invitedRooms,
  mx,
  onClose,
}: {
  visible: boolean;
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
    if (visible) {
      loadRoomItems();
    }
  }, [visible, loadRoomItems]);

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

  const renderItem = ({ item }: { item: RoomItemData }) => {
    const isProcessing =
      processingRoomId?.roomId === item.roomId &&
      processingRoomId.action === 'accept';
    // const isRejecting =
    //   processingRoomId?.roomId === item.roomId &&
    //   processingRoomId.action === 'reject';

    return (
      <View style={styles.roomItem}>
        <View style={styles.roomItemContent}>
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

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => confirmAccept(item.room)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>Confirm</Text>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleReject(item.room)}
              disabled={isRejecting}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
              {isRejecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    );
  };

  const keyExtractor = useCallback((item: RoomItemData) => item.roomId, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[...gradients.screenBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={80}
            reducedTransparencyFallbackColor={colors.background.primary}
          />
          <Text style={styles.headerTitle}>Add Chat</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft color={colors.text.primary} size={28} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Success Toast */}
          {successBanner ? (
            <View style={styles.successfullyAddedToast}>
              <Check color="#22C55E" size={24} />
              <View style={styles.toastContent}>
                <Text style={styles.toastTitle}>{successBanner} added</Text>
              </View>
            </View>
          ) : null}

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Search color="#9CA3AF" size={20} style={styles.searchIcon} />
          </View>

          <FlatList
            data={filteredRooms}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No rooms found' : 'No pending invitations'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.transparent.white10,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  backButton: {
    padding: 8,
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
    paddingRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  roomItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roomItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 18,
    fontWeight: '600',
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    borderColor: colors.border.light,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});

export default PendingInvitationsModal;
