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
 * Check if a room is a metabot system room
 */
const isMetabotRoom = (room: Room | null): boolean => {
  return (!!room && room.name.startsWith('@metabot')) ?? false;
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
  return !!room && !isMetabotRoom(room) && !isSpaceRoom(room);
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
  if (roomName && roomName.startsWith('@metabot')) {
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
