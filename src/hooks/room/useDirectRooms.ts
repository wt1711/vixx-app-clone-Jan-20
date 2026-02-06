import { useCallback, useEffect, useState } from 'react';
import { Room, RoomEvent, ClientEvent, MatrixEvent } from 'matrix-js-sdk';
import { getMatrixClient } from 'src/services/matrixClient';
import {
  IsBotPrivateChat,
  isInvite,
  isRoom,
  isGroupChatRoom,
} from 'src/utils/room';
import { AccountDataType } from 'src/types';

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
 */
export const useDirectRooms = () => {
  const [directRooms, setDirectRooms] = useState<Room[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [mDirects, setMDirects] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const mx = getMatrixClient();

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

    // Filter for valid rooms first (shared conditions)
    const validRooms = allRooms.filter(
      room =>
        isRoom(room) &&
        !mDirects.has(room.roomId) &&
        !IsBotPrivateChat(room?.name) &&
        !isGroupChatRoom(room),
    );

    // Split into direct rooms and invited rooms
    const directs: Room[] = [];
    const invited: Room[] = [];
    for (const room of validRooms) {
      if (isInvite(room)) {
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
  }, [mx, mDirects]);

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
