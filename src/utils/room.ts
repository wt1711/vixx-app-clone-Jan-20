import React from 'react';
import {
  EventTimeline,
  MatrixClient,
  MatrixEvent,
  Room,
  RoomMember,
  RoomType,
  ClientEvent,
} from 'matrix-js-sdk';
import { StateEvent, MessageEvent, AccountDataType } from 'src/types';
import {
  FOUNDER_ROOM_NAME,
  FOUNDER_ROOM_NAME_LEGACY,
  FOUNDER_AVATAR_URL,
} from 'src/config/founder';
import { parseRelativeTime } from 'src/utils/parsers/timeParser';
import { shouldHideMessage } from 'src/utils/message';

/**
 * Extracts initials from a name string
 * Takes first letter of each word, up to 2 characters
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a room is the founder/team chat room (supports both old and new names)
 */
export const isFounderRoom = (roomName: string | undefined): boolean => {
  if (
    roomName &&
    [FOUNDER_ROOM_NAME, FOUNDER_ROOM_NAME_LEGACY].includes(roomName)
  )
    return true;
  return false;
};

export const getStateEvent = (
  room: Room,
  eventType: StateEvent,
  stateKey = '',
): MatrixEvent | undefined =>
  room
    .getLiveTimeline()
    .getState(EventTimeline.FORWARDS)
    ?.getStateEvents(eventType, stateKey) ?? undefined;

export const getRoomAvatarUrl = (
  mx: MatrixClient,
  room: Room,
  size: 32 | 96 = 32,
  useAuthentication = false,
): string | undefined => {
  const mxcUrl = room.getMxcAvatarUrl();
  const avatarUrl = mxcUrl
    ? mx.mxcUrlToHttp(
        mxcUrl,
        size,
        size,
        'crop',
        undefined,
        false,
        useAuthentication,
      ) ?? undefined
    : undefined;

  // Fallback to founder avatar if this is the founder room
  if (!avatarUrl && isFounderRoom(room.name)) {
    return FOUNDER_AVATAR_URL;
  }

  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};

export const isRoom = (room: Room | null): boolean => {
  if (!room) return false;
  const event = getStateEvent(room, StateEvent.RoomCreate);
  if (!event) return true;
  if (room?.name && room.name.startsWith('@metabot')) return false;
  return event.getContent().type !== RoomType.Space;
};

export const isInvite = (room: Room | null): boolean => {
  if (!room) return false;
  const event = getStateEvent(room, StateEvent.RoomCreate);
  if (!event) return false;
  const membership = room.getMyMembership();
  if (membership !== 'invite') return false;
  if (event.getContent().type === RoomType.Space) return false;
  if (event.getType() !== StateEvent.RoomCreate) return false;
  const inviter = room.getDMInviter();
  if (inviter) {
    // Common bot patterns
    const botPatterns = [
      /bot$/i, // ends with 'bot'
      /^@.*bot:/i, // starts with @...bot:
      /bridge/i, // contains 'bridge'
      /service/i, // contains 'service'
      /admin/i, // contains 'admin'
      /system/i, // contains 'system'
      /notification/i, // contains 'notification'
    ];

    const isBot = botPatterns.some(pattern => pattern.test(inviter));

    if (isBot) return false;
  }

  if (room?.name && room.name.startsWith('@metabot')) return false;

  return true;
};

export const IsBotPrivateChat = (roomName: string | undefined) => {
  if (roomName) {
    // Common bot patterns
    const botPatterns = [/Meta bot Room/i, /Instagram Bot Room/i];

    const isBot = botPatterns.some(pattern => pattern.test(roomName));
    if (isBot) return true;
  }
  return false;
};

const isUserIdMatrix = (userId: string) => !userId.includes('meta');

const getImpersonatedUserId = (
  userId: string,
  members: RoomMember[],
): string => {
  if (members && isUserIdMatrix(userId)) {
    return members.find(member => member.userId === userId)?.userId || userId;
  }
  return userId || '';
};

export const getMemberAvatarMxc = (
  mx: MatrixClient,
  room: Room,
  userId: string,
): string | undefined => {
  // const member = room.getMember(userId); // Revert back to this if needed
  const member = room.getMember(
    getImpersonatedUserId(userId, room.getMembers()),
  );
  const avatarMxc = member?.getMxcAvatarUrl();
  if (!avatarMxc) return undefined;
  const avatarUrl = mx.mxcUrlToHttp(
    avatarMxc,
    96,
    96,
    'crop',
    undefined,
    false,
    true,
  );
  if (!avatarUrl) return undefined;
  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};

/**
 * UI-ready room item for FlatList consumption
 */
export interface RoomListItem {
  /** Unique room identifier (Matrix room ID) */
  id: string;

  /** Display name for the room/conversation */
  name: string;

  /** Avatar URL (mxc:// URL converted to HTTP, or empty string) */
  avatar: string;

  /** Preview of the last message in the room */
  lastMessage: string;

  /** Human-readable timestamp (e.g., "2m ago", "Yesterday") */
  timestamp: string;

  /** Whether the room has unread messages */
  unread: boolean;
}

/**
 * Transforms a Matrix Room into a UI-ready RoomListItem
 */
export function transformRoom(room: Room, client: MatrixClient): RoomListItem {
  // Find the last actual message (MessageEvent.RoomMessage), not state events
  let lastMessage = 'No messages';
  const timeline = room.getLiveTimeline().getEvents();

  for (let i = timeline.length - 1; i >= 0; i--) {
    const event = timeline[i];
    if (event.getType() === MessageEvent.RoomMessage) {
      const body = event.getContent()?.body || '';
      // Skip hidden bot messages
      if (body && !shouldHideMessage(body)) {
        lastMessage = body;
        break;
      }
    }
  }

  let avatar = '';
  const avatarUrl = room.getAvatarUrl(client.baseUrl, 96, 96, 'crop');
  if (avatarUrl) {
    avatar = avatarUrl;
  }

  return {
    id: room.roomId,
    name: room.name || 'Unnamed Room',
    avatar,
    lastMessage,
    timestamp: parseRelativeTime(room.getLastActiveTimestamp()),
    unread: room.getUnreadNotificationCount() > 0,
  };
}

/**
 * Get m.direct account data and extract direct room IDs
 * This matches the NextJS implementation
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
 * Hook to get and track m.direct account data
 * Returns a Set of room IDs that are marked as direct messages
 */
export const useMDirects = (mx: MatrixClient | null): Set<string> => {
  const [mDirects, setMDirects] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!mx) {
      setMDirects(new Set());
      return;
    }

    // Get initial m.direct account data
    const mDirectEvent = mx.getAccountData(AccountDataType.Direct as any);
    if (mDirectEvent) {
      setMDirects(getMDirects(mDirectEvent));
    }

    // Listen for account data updates
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

  return mDirects;
};
