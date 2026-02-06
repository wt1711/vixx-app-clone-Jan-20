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
import { isBotUser, getImpersonatedUserId } from 'src/utils/user';

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

/**
 * Check if a room is a metabot system room
 */
const isMetabotRoom = (room: Room | null): boolean => {
  return (!!room && room.name.startsWith('@metabot')) ?? false;
};

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

const BOT_ROOM_PATTERNS: RegExp[] = [/Meta bot Room/i, /Instagram Bot Room/i];

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

export const isInvite = (room: Room | null): boolean => {
  return (
    !!room &&
    isValidRoom(room) &&
    hasRoomCreateEvent(room) &&
    hasInviteMembership(room) &&
    !isBotInviter(room)
  );
};

export const isBotPrivateChat = (roomName: string | undefined): boolean =>
  !!roomName && BOT_ROOM_PATTERNS.some(pattern => pattern.test(roomName));

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
  if (!avatarUrl && isFounderRoom(room.name)) {
    return FOUNDER_AVATAR_URL;
  }

  // Return undefined if no avatar URL exists
  if (!avatarUrl) {
    return undefined;
  }

  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};

const getStateEvent = (
  room: Room,
  eventType: StateEvent,
  stateKey = '',
): MatrixEvent | undefined =>
  room
    .getLiveTimeline()
    .getState(EventTimeline.FORWARDS)
    ?.getStateEvents(eventType, stateKey) ?? undefined;

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
