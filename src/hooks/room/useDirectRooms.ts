import { useCallback, useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, ClientEvent, MatrixEvent } from 'matrix-js-sdk';
import { getMatrixClient } from 'src/services/matrixClient';
import {
  isBotRoom,
  isValidInvitedRoom,
  isValidRoom,
  isGroupChatRoom,
  isMetabotNameRoom,
} from 'src/utils/room';
import { AccountDataType, Membership } from 'src/types';
import { usePendingMetabotRoomsContext } from 'src/hooks/context/PendingMetabotRoomsContext';

/**
 * Get m.direct account data and extract direct room IDs
 */
const getMDirects = (mDirectEvent: MatrixEvent | undefined): Set<string> => {
  const roomIds = new Set<string>();
  if (!mDirectEvent) return roomIds;

  const userIdToDirects = mDirectEvent.getContent();

  if (userIdToDirects === undefined) return roomIds;

  Object.keys(userIdToDirects).forEach(userId => {
    const directs = userIdToDirects[userId];
    if (Array.isArray(directs)) {
      directs.forEach(id => {
        if (typeof id === 'string') roomIds.add(id);
      });
    }
  });

  return roomIds;
};

/**
 * Hook to get all direct message rooms
 * Uses m.direct account data to filter rooms (matches NextJS implementation)
 *
 * This is "The Filter" - applies exclusive state logic:
 * - HIDDEN_JOINING: Metabot rooms not yet in pending (auto-join silently)
 * - PENDING_MODAL: Rooms in pending context (excluded from main list)
 * - ACTIVE_CHAT: Joined rooms not in pending (shown in main list)
 */
export const useDirectRooms = () => {
  const [directRooms, setDirectRooms] = useState<Room[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [mDirects, setMDirects] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const mx = getMatrixClient();

  // Track rooms currently being auto-joined to prevent duplicate joins
  const joiningRef = useRef<Set<string>>(new Set());

  // Access pending rooms context
  const { pendingRooms, autoJoinMetabotRoom } = usePendingMetabotRoomsContext();

  // Track m.direct account data
  useEffect(() => {
    if (!mx) {
      setMDirects(new Set());
      return;
    }

    const mDirectEvent = mx.getAccountData(AccountDataType.Direct as any);
    if (mDirectEvent) {
      setMDirects(getMDirects(mDirectEvent));
    }

    const handleAccountData = (event: MatrixEvent) => {
      if (event.getType() === AccountDataType.Direct) {
        setMDirects(getMDirects(event));
      }
    };

    mx.on(ClientEvent.AccountData, handleAccountData);

    return () => {
      mx.off(ClientEvent.AccountData, handleAccountData);
    };
  }, [mx]);

  const updateDirectRooms = useCallback(() => {
    if (!mx) {
      setIsLoading(false);
      return;
    }

    const allRooms = mx.getVisibleRooms();

    // Collect rooms to auto-join (metabot rooms in invite/join state not yet pending)
    const roomsToAutoJoin: string[] = [];

    // Filter for valid rooms first (shared conditions)
    const validRooms = allRooms.filter(
      room =>
        isValidRoom(room) &&
        !mDirects.has(room.roomId) &&
        !isBotRoom(room) &&
        !isGroupChatRoom(room),
    );

    // Split into direct rooms and invited rooms with exclusive state logic
    const directs: Room[] = [];
    const invited: Room[] = [];

    for (const room of validRooms) {
      const roomId = room.roomId;
      const isPending = pendingRooms.has(roomId);
      const isMetabot = isMetabotNameRoom(room.name);
      const membership = room.getMyMembership();

      // EXCLUSIVE STATE LOGIC

      // HIDDEN_JOINING: Metabot room not yet in pending - trigger auto-join
      if (isMetabot && !isPending) {
        const isInviteOrJoin = membership === Membership.Invite || membership === Membership.Join;
        if (isInviteOrJoin && !joiningRef.current.has(roomId)) {
          roomsToAutoJoin.push(roomId);
        }
        // Don't add to any list - hide it completely
        continue;
      }

      // PENDING_MODAL: Room is in pending context - exclude from main list
      if (isPending) {
        // Don't add to directs or invited - it's shown in PendingInvitationsModal
        continue;
      }

      // ACTIVE_CHAT: Normal room processing
      if (isValidInvitedRoom(room)) {
        invited.push(room);
      } else {
        directs.push(room);
      }
    }

    // Sort by last active timestamp (most recent first)
    const sorted = directs.sort((a, b) => {
      return b.getLastActiveTimestamp() - a.getLastActiveTimestamp();
    });

    setDirectRooms(sorted);
    setInvitedRooms(invited);
    setIsLoading(false);

    // Trigger auto-join for metabot rooms (async, non-blocking)
    for (const roomId of roomsToAutoJoin) {
      joiningRef.current.add(roomId);
      autoJoinMetabotRoom(roomId)
        .catch(error => {
          console.error('[useDirectRooms] Auto-join failed:', roomId, error);
        })
        .finally(() => {
          joiningRef.current.delete(roomId);
        });
    }
  }, [mx, mDirects, pendingRooms, autoJoinMetabotRoom]);

  useEffect(() => {
    if (!mx) {
      setIsLoading(false);
      return;
    }

    // Initial load
    updateDirectRooms();

    // Listen for timeline events (new messages)
    mx.on(RoomEvent.Timeline, updateDirectRooms);

    // Listen for room name changes
    mx.on(RoomEvent.Name, updateDirectRooms);

    // Listen for new rooms
    mx.on(ClientEvent.Room, updateDirectRooms);

    // Listen for member changes (people joining/leaving)
    mx.on(RoomEvent.MyMembership, updateDirectRooms);

    // Listen for read receipts (updates unread count)
    mx.on(RoomEvent.Receipt, updateDirectRooms);

    return () => {
      mx.off(RoomEvent.Timeline, updateDirectRooms);
      mx.off(RoomEvent.Name, updateDirectRooms);
      mx.off(ClientEvent.Room, updateDirectRooms);
      mx.off(RoomEvent.MyMembership, updateDirectRooms);
      mx.off(RoomEvent.Receipt, updateDirectRooms);
    };
  }, [mx, updateDirectRooms]);

  return { directRooms, isLoading, invitedRooms };
};
