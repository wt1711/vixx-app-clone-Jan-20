import { MatrixClient, Room } from "matrix-js-sdk";
import { useCallback, useState, useEffect } from "react";
import { FlatList, Modal, StyleSheet, Text, View, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { RoomItemData } from "./room/RoomListItem";
import { getRoomAvatarUrl } from "../utils/room";
import { getInitials } from "../utils/stringUtils";

const PendingInvitationsModal = ({visible, invitedRooms, mx, onClose} : {visible: boolean, invitedRooms: Room[], mx: MatrixClient | null, onClose: () => void}) => {
    const [roomItems, setRoomItems] = useState<RoomItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingRoomId, setProcessingRoomId] = useState<{roomId: string, action: 'accept' | 'reject'} | null>(null);

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
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAccept = async (room: Room) => {
      if (!mx || processingRoomId) return;
      
      setProcessingRoomId({roomId: room.roomId, action: 'accept'});
      try {
        await mx.joinRoom(room.roomId);
        Alert.alert('Success', 'Invitation accepted');
        // Remove from list after successful join
        setRoomItems(prev => prev.filter(item => item.roomId !== room.roomId));
      } catch (error: any) {
        console.error('Failed to accept invitation:', error);
        Alert.alert('Error', error.message || 'Failed to accept invitation');
      } finally {
        setProcessingRoomId(null);
      }
    };

    const handleReject = async (room: Room) => {
      if (!mx || processingRoomId) return;
      
      setProcessingRoomId({roomId: room.roomId, action: 'reject'});
      try {
        await mx.leave(room.roomId);
        Alert.alert('Success', 'Invitation rejected');
        // Remove from list after successful leave
        setRoomItems(prev => prev.filter(item => item.roomId !== room.roomId));
      } catch (error: any) {
        console.error('Failed to reject invitation:', error);
        Alert.alert('Error', error.message || 'Failed to reject invitation');
      } finally {
        setProcessingRoomId(null);
      }
    };

    const renderItem = ({ item }: { item: RoomItemData }) => {
      const isProcessing = processingRoomId?.roomId === item.roomId && processingRoomId.action === 'accept';
      const isRejecting = processingRoomId?.roomId === item.roomId && processingRoomId.action === 'reject';

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
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAccept(item.room)}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : null}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleReject(item.room)}
                disabled={isRejecting}
                activeOpacity={0.7}
              >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

  const keyExtractor = useCallback((item: RoomItemData) => item.roomId, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider  >
        <SafeAreaView edges={['top','bottom']} style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.headerCloseButton} onPress={onClose}>
          <Text style={styles.headerCloseButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pending invitations</Text>
        
        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by room name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

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
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
    headerCloseButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 24,
        zIndex: 10,
        elevation: 10,
    },
    headerCloseButtonText: {
        fontSize: 24,
        color: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: 'white',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        color: 'white',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    searchInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
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
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
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
})

export default PendingInvitationsModal;