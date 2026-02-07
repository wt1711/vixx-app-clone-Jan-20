import {
  EventTimeline,
  MatrixClient,
  MatrixEvent,
  Room,
  RoomType,
} from 'matrix-js-sdk';
import { StateEvent, Membership } from 'src/types';
import {
  FOUNDER_ROOM_NAME,
  FOUNDER_ROOM_NAME_LEGACY,
  FOUNDER_AVATAR_URL,
} from 'src/config/founder';
import { isBotUser } from 'src/utils/user';

const getStateEvent = (
  room: Room,
  eventType: StateEvent,
  stateKey = '',
): MatrixEvent | undefined =>
  room
    .getLiveTimeline()
    .getState(EventTimeline.FORWARDS)
    ?.getStateEvents(eventType, stateKey) ?? undefined;

const BOT_ROOM_PATTERNS: RegExp[] = [/Meta bot Room/i, /Instagram Bot Room/i];

export const isBotRoom = (room: Room | null): boolean =>
  !!room?.name && BOT_ROOM_PATTERNS.some(pattern => pattern.test(room.name));

/**
 * Check if a room name indicates a metabot system room
 * @param roomName - The room name string to check
 */
export const isMetabotNameRoom = (
  roomName: string | null | undefined,
): boolean => {
  return !!roomName && roomName.startsWith('@metabot');
};

export const isFounderRoom = (room: Room | null): boolean =>
  !!room?.name &&
  [FOUNDER_ROOM_NAME, FOUNDER_ROOM_NAME_LEGACY].includes(room.name);

/**
 * Check if a room is a Space (organizational container, not a chat room)
 */
const isSpaceRoom = (room: Room): boolean => {
  const event = getStateEvent(room, StateEvent.RoomCreate);
  if (!event) return false; // Assume not a space if state not loaded
  return event.getContent().type === RoomType.Space;
};

export const isGroupChatRoom = (room: Room | null): boolean => {
  // Each room has 4 member: metabot, instagram_, self, and other dm
  return !!room && room.getJoinedMemberCount() > 4;
};

export const isValidRoom = (room: Room | null): boolean => {
  return (
    !!room &&
    // && !isMetabotNameRoom(room.name)
    !isSpaceRoom(room)
  );
};

const hasInviteMembership = (room: Room): boolean =>
  room && room.getMyMembership() === Membership.Invite;

const hasRoomCreateEvent = (room: Room): boolean => {
  const event = getStateEvent(room, StateEvent.RoomCreate);
  return !!event && event.getType() === StateEvent.RoomCreate;
};

const isBotInviter = (room: Room): boolean => {
  const inviter = room.getDMInviter();
  return !!inviter && isBotUser(inviter);
};

export const isValidInvitedRoom = (room: Room | null): boolean => {
  return (
    !!room &&
    isValidRoom(room) &&
    hasRoomCreateEvent(room) &&
    hasInviteMembership(room) &&
    !isBotInviter(room)
  );
};

/**
 * Gets the display name for a room, falling back to other members or metadata
 * Handles cases where room.name returns a Matrix user ID (e.g., @metabot:server.com)
 * Works for both invite and joined rooms
 */
export const getRoomDisplayName = (
  room: Room,
  mx?: MatrixClient | null,
): string => {
  const roomName = room.name;

  // If we have a proper room name (not a user ID), use it
  if (roomName && !roomName.startsWith('@')) {
    return roomName;
  }

  // For any room (invite or joined), try to find other members (non-bot, non-me)
  if (mx) {
    const myUserId = mx.getUserId();
    const allMembers = room.getMembers();

    // Look for a member that isn't me and isn't a bot
    const otherMember = allMembers.find(member => {
      if (!member.userId || member.userId === myUserId) return false;
      // Skip metabot users
      if (member.userId.includes('metabot')) return false;
      // Skip other common bot patterns
      if (member.userId.match(/@.*bot:/i)) return false;
      return true;
    });

    if (otherMember) {
      return (
        otherMember.rawDisplayName || otherMember.name || roomName || 'Unknown'
      );
    }

    // If no other members, check room topic
    const topicEvent = getStateEvent(room, StateEvent.RoomTopic);
    if (topicEvent) {
      const topic = topicEvent.getContent()?.topic;
      if (topic && topic.trim()) {
        return topic;
      }
    }
  }

  // Try getDMInviter for DM rooms (fallback)
  const dmInviterId = room.getDMInviter();
  if (dmInviterId && !dmInviterId.includes('metabot')) {
    const member = room.getMember(dmInviterId);
    if (member) {
      return member.rawDisplayName || member.name || roomName || 'Unknown';
    }
  }

  // Final fallback - clean up the user ID display
  if (isMetabotNameRoom(roomName)) {
    return 'Metabot Chat';
  }

  return roomName || 'Unknown';
};

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
  if (!avatarUrl && isFounderRoom(room)) {
    return FOUNDER_AVATAR_URL;
  }

  // Return undefined if no avatar URL exists
  if (!avatarUrl) {
    return undefined;
  }

  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};

/**
 * Gets all consecutive messages from the same sender that form a "burst"
 * containing the target message. A burst is a group of consecutive messages
 * from the same non-user sender.
 *
 * @param messages - Array of MessageItem objects (can be in any order, will sort by timestamp)
 * @param targetEventId - The eventId of the message to find the burst for
 * @returns Array of MessageItems in the burst (chronological order), or empty array if not found
 */
export const getMessageBurstContaining = <
  T extends {
    eventId: string;
    isOwn: boolean;
    sender: string;
    timestamp: number;
  },
>(
  messages: T[],
  targetEventId: string,
): T[] => {
  // Sort messages by timestamp (oldest first)
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  // Find the target message
  const targetIndex = sorted.findIndex(msg => msg.eventId === targetEventId);
  if (targetIndex === -1) return [];

  const targetMessage = sorted[targetIndex];

  // If it's the user's own message, return just that message
  if (targetMessage.isOwn) return [targetMessage];

  const targetSender = targetMessage.sender;
  const burst: T[] = [targetMessage];

  // Expand backward to find start of burst
  for (let i = targetIndex - 1; i >= 0; i--) {
    const msg = sorted[i];
    if (msg.sender === targetSender && !msg.isOwn) {
      burst.unshift(msg);
    } else {
      break;
    }
  }

  // Expand forward to find end of burst
  for (let i = targetIndex + 1; i < sorted.length; i++) {
    const msg = sorted[i];
    if (msg.sender === targetSender && !msg.isOwn) {
      burst.push(msg);
    } else {
      break;
    }
  }

  return burst;
};

/**
 * Checks if a message is part of the latest incoming (non-own) message burst.
 * Used to restrict intent analysis to only the most recent messages.
 *
 * @param messages - Array of MessageItem objects
 * @param targetEventId - The eventId of the message to check
 * @returns true if the message is in the latest incoming burst
 */
export const isInLatestIncomingBurst = <
  T extends {
    eventId: string;
    isOwn: boolean;
    sender: string;
    timestamp: number;
  },
>(
  messages: T[],
  targetEventId: string,
): boolean => {
  // Sort messages by timestamp (newest first)
  const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  // Find the first non-own message (most recent incoming)
  const firstIncomingIdx = sorted.findIndex(msg => !msg.isOwn);
  if (firstIncomingIdx === -1) return false;

  const sender = sorted[firstIncomingIdx].sender;

  // Check if target is in the consecutive burst from this sender
  for (let i = firstIncomingIdx; i < sorted.length; i++) {
    const msg = sorted[i];
    // Stop if we hit a different sender or own message
    if (msg.sender !== sender || msg.isOwn) break;
    // Found the target in the latest burst
    if (msg.eventId === targetEventId) return true;
  }

  return false;
};

/**
 * Gets the latest burst of messages (either incoming or outgoing).
 * Returns the burst along with metadata about which message is first.
 *
 * @param messages - Array of MessageItem objects
 * @returns Object with burst array, firstEventId, and isOwnBurst flag, or null if no messages
 */
export const getLatestBurst = <
  T extends {
    eventId: string;
    isOwn: boolean;
    sender: string;
    timestamp: number;
  },
>(
  messages: T[],
): { burst: T[]; firstEventId: string; isOwnBurst: boolean } | null => {
  if (messages.length === 0) return null;

  // Sort messages by timestamp (newest first)
  const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  // The most recent message determines the burst type
  const latestMessage = sorted[0];
  const isOwnBurst = latestMessage.isOwn;
  const sender = latestMessage.sender;

  // Collect all consecutive messages from the same sender
  const burst: T[] = [latestMessage];

  for (let i = 1; i < sorted.length; i++) {
    const msg = sorted[i];
    // Stop if we hit a message from a different sender or different ownership
    if (msg.sender !== sender || msg.isOwn !== isOwnBurst) break;
    burst.push(msg);
  }

  // Reverse to get chronological order (oldest first)
  burst.reverse();

  return {
    burst,
    firstEventId: burst[0].eventId,
    isOwnBurst,
  };
};

/**
 * Gets all message bursts from a timeline.
 * A burst is a consecutive sequence of messages from the same sender.
 *
 * @param messages - Array of MessageItem objects
 * @returns Array of burst info objects, each with the burst messages and metadata
 */
export const getAllBursts = <
  T extends {
    eventId: string;
    isOwn: boolean;
    sender: string;
    timestamp: number;
  },
>(
  messages: T[],
): Array<{ burst: T[]; firstEventId: string; isOwnBurst: boolean }> => {
  if (messages.length === 0) return [];

  // Sort messages by timestamp (oldest first)
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  const bursts: Array<{
    burst: T[];
    firstEventId: string;
    isOwnBurst: boolean;
  }> = [];
  let currentBurst: T[] = [];
  let currentSender: string | null = null;
  let currentIsOwn: boolean | null = null;

  for (const msg of sorted) {
    // If this message is from a different sender, close the current burst and start a new one
    if (
      currentSender !== null &&
      (msg.sender !== currentSender || msg.isOwn !== currentIsOwn)
    ) {
      if (currentBurst.length > 0) {
        bursts.push({
          burst: currentBurst,
          firstEventId: currentBurst[0].eventId,
          isOwnBurst: currentIsOwn!,
        });
      }
      currentBurst = [];
    }

    currentBurst.push(msg);
    currentSender = msg.sender;
    currentIsOwn = msg.isOwn;
  }

  // Don't forget the last burst
  if (currentBurst.length > 0 && currentIsOwn !== null) {
    bursts.push({
      burst: currentBurst,
      firstEventId: currentBurst[0].eventId,
      isOwnBurst: currentIsOwn,
    });
  }

  return bursts;
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
