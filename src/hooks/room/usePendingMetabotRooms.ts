import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomEvent } from 'matrix-js-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMatrixClient } from 'src/services/matrixClient';

const STORAGE_KEY = 'pending_metabot_rooms';

export type PendingRoomData = {
  timestamp: number;
};

export type PendingRoomsMap = Map<string, PendingRoomData>;

/**
 * Hook to manage pending metabot rooms state and persistence
 * This is "The Worker" - handles state, persistence, and auto-join logic
 */
export const usePendingMetabotRooms = () => {
  const [pendingRooms, setPendingRooms] = useState<PendingRoomsMap>(new Map());
  const isInitialLoadDone = useRef(false);
  const mx = getMatrixClient();

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert array of [key, value] pairs back to Map
          const map = new Map<string, PendingRoomData>(parsed);
          setPendingRooms(map);
        }
      } catch (error) {
        console.error('[usePendingMetabotRooms] Failed to load from storage:', error);
      } finally {
        isInitialLoadDone.current = true;
      }
    };

    loadFromStorage();
  }, []);

  // Persist to AsyncStorage when pendingRooms changes (only after initial load)
  useEffect(() => {
    if (!isInitialLoadDone.current) return;

    const saveToStorage = async () => {
      try {
        // Convert Map to array of [key, value] pairs for JSON serialization
        const serializable = Array.from(pendingRooms.entries());
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      } catch (error) {
        console.error('[usePendingMetabotRooms] Failed to save to storage:', error);
      }
    };

    saveToStorage();
  }, [pendingRooms]);

  // Add a room to pending state
  const addPendingRoom = useCallback((roomId: string) => {
    setPendingRooms(prev => {
      const next = new Map(prev);
      next.set(roomId, { timestamp: Date.now() });
      return next;
    });
  }, []);

  // Remove a room from pending state (creates new Map reference for re-renders)
  const removePendingRoom = useCallback((roomId: string) => {
    setPendingRooms(prev => {
      const next = new Map(prev);
      next.delete(roomId);
      return next;
    });
  }, []);

  /**
   * Auto-join a metabot room and add it to pending state
   * This follows the exact flow from the implementation plan:
   * 1. await mx.joinRoom(roomId)
   * 2. Wait for RoomEvent.MyMembership to confirm join
   * 3. Only then add to pending (ensures room name is synced)
   */
  const autoJoinMetabotRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (!mx) {
        console.warn('[usePendingMetabotRooms] No matrix client available');
        return;
      }

      try {
        // Step 1: Join the room
        await mx.joinRoom(roomId);

        // Step 2: Wait for membership confirmation
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            mx.off(RoomEvent.MyMembership, membershipHandler);
            reject(new Error('Timeout waiting for room membership'));
          }, 30000); // 30 second timeout

          const membershipHandler = (room: any) => {
            if (room.roomId === roomId && room.getMyMembership() === 'join') {
              clearTimeout(timeout);
              mx.off(RoomEvent.MyMembership, membershipHandler);
              resolve();
            }
          };

          // Check if already joined (in case event fired before we subscribed)
          const existingRoom = mx.getRoom(roomId);
          if (existingRoom && existingRoom.getMyMembership() === 'join') {
            clearTimeout(timeout);
            resolve();
            return;
          }

          mx.on(RoomEvent.MyMembership, membershipHandler);
        });

        // Step 3: After confirmed join, add to pending
        addPendingRoom(roomId);
      } catch (error) {
        console.error('[usePendingMetabotRooms] Failed to auto-join room:', roomId, error);
        throw error;
      }
    },
    [mx, addPendingRoom],
  );

  return {
    pendingRooms,
    addPendingRoom,
    removePendingRoom,
    autoJoinMetabotRoom,
    isInitialLoadDone: isInitialLoadDone.current,
  };
};
