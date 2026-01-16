import {
  EventTimeline,
  MatrixClient,
  MatrixEvent,
  MsgType,
  Room,
  RoomMember,
  RoomType,
  Direction,
} from 'matrix-js-sdk';
import {
  MessageEvent,
  StateEvent,
  RelationType,
  ContentKey,
} from '../types/matrix/room';
import { FOUNDER_MATRIX_ID, FOUNDER_ROOM_NAME } from '../constants/founder';

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
  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};

export const getDirectRoomAvatarUrl = (
  mx: MatrixClient,
  room: Room,
  size: 32 | 96 = 32,
  useAuthentication = false,
): string | undefined => {
  const mxcUrl = room.getAvatarFallbackMember()?.getMxcAvatarUrl();

  if (!mxcUrl) {
    return getRoomAvatarUrl(mx, room, size, useAuthentication);
  }

  return (
    mx.mxcUrlToHttp(
      mxcUrl,
      size,
      size,
      'crop',
      undefined,
      false,
      useAuthentication,
    ) ?? undefined
  );
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

export const messageEventOnly = (mEvent: MatrixEvent) => {
  const type = mEvent.getType();
  const content = mEvent.getContent();
  return (
    (type === MessageEvent.RoomMessage ||
      type === MessageEvent.RoomMessageEncrypted ||
      type === MessageEvent.Sticker ||
      type === MessageEvent.RoomRedaction ||
      type === MessageEvent.Reaction) &&
    content.msgtype !== MsgType.Notice
  );
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

const isUserIdMatrix = (userId: string) => !userId.includes('meta');

export const getImpersonatedUserId = (
  userId: string,
  members: RoomMember[],
): string => {
  if (members && isUserIdMatrix(userId)) {
    return members.find(member => member.userId === userId)?.userId || userId;
  }
  return userId || '';
};

// Reaction utilities
export const getReactionContent = (
  eventId: string,
  key: string,
  shortcode?: string,
) => ({
  [ContentKey.RelatesTo]: {
    event_id: eventId,
    key,
    rel_type: RelationType.Annotation,
  },
  shortcode,
});

export const getEventReactions = (room: Room, eventId: string) => {
  return room
    .getUnfilteredTimelineSet()
    .relations.getChildEventsForEvent(
      eventId,
      RelationType.Annotation as any,
      MessageEvent.Reaction,
    );
};

export type LastMessageInfo = {
  message: string;
  timestamp: number;
  isReaction?: boolean;
  senderId?: string;
  senderName?: string;
};

/**
 * Formats a message event into a preview string
 */
const formatMessagePreview = (content: Record<string, any>): string => {
  if (content.msgtype === MsgType.Text) {
    return content.body || '';
  } else if (content.msgtype === MsgType.Image) {
    return '📷 Image';
  } else if (content.msgtype === MsgType.Video) {
    return '🎥 Video';
  } else if (content.msgtype === MsgType.File) {
    return '📎 File';
  } else if (content.msgtype === MsgType.Audio) {
    return '🎵 Audio';
  }
  return 'Message';
};

/**
 * Formats a reaction event into a preview string
 */
const formatReactionPreview = (content: Record<string, any>): string => {
  const reactionKey = content[ContentKey.RelatesTo]?.key;
  if (reactionKey) {
    return `Reacted ${reactionKey} to a message`;
  }
  return 'Reacted to a message';
};

/**
 * Finds the last message or reaction from an array of events
 */
const findLastMessageInEvents = (
  events: MatrixEvent[],
): LastMessageInfo | null => {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    const eventType = event.getType();
    const content = event.getContent();

    // Check for reaction events
    if (eventType === MessageEvent.Reaction) {
      return {
        message: formatReactionPreview(content),
        timestamp: event.getTs(),
        isReaction: true,
        senderId: event.getSender() || undefined,
        senderName: event.sender?.name || undefined,
      };
    }

    // Check for regular message events
    if (eventType === MessageEvent.RoomMessage) {
      // Skip notice messages (bot/system messages)
      if (content.msgtype === MsgType.Notice) {
        continue;
      }
      return {
        message: formatMessagePreview(content),
        timestamp: event.getTs(),
        senderId: event.getSender() || undefined,
        senderName: event.sender?.name || undefined,
      };
    }
  }
  return null;
};

/**
 * Gets the last user message from a room timeline, skipping state events and notices.
 * Synchonous version - only checks currently loaded events.
 */
export const getLastRoomMessage = (room: Room): LastMessageInfo => {
  const timeline = room.getLiveTimeline().getEvents();
  const result = findLastMessageInEvents(timeline);
  return result || { message: '', timestamp: 0 };
};

/**
 * Gets the last user message, paginating backwards if needed.
 * Use this when you need to ensure a message is found.
 */
export const getLastRoomMessageAsync = async (
  client: MatrixClient,
  room: Room,
  maxPaginationAttempts = 3,
): Promise<LastMessageInfo> => {
  const timeline = room.getLiveTimeline();
  let events = timeline.getEvents();

  // First check current timeline
  let result = findLastMessageInEvents(events);
  if (result) return result;

  // Paginate backwards to find a message
  let attempts = 0;
  while (attempts < maxPaginationAttempts) {
    const token = timeline.getPaginationToken(Direction.Backward);
    if (!token) break;

    try {
      await client.paginateEventTimeline(timeline, {
        backwards: true,
        limit: 20,
      });

      events = timeline.getEvents();
      result = findLastMessageInEvents(events);
      if (result) return result;

      attempts++;
    } catch (error) {
      console.error('[getLastRoomMessageAsync] Pagination failed:', error);
      break;
    }
  }

  return { message: '', timestamp: 0 };
};

export const isMessageFromMe = (
  sender: string,
  myUserId: string | null | undefined,
  roomName: string,
  senderName: string,
): boolean => {
  // Messages from founder in VIXX Founder room are not from me
  if (roomName === FOUNDER_ROOM_NAME && sender === FOUNDER_MATRIX_ID) {
    return false;
  }
  return sender === myUserId || roomName !== senderName;
};

type RoomContextMessage = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

/**
 * Gets all consecutive messages from the other person at the end of the conversation.
 * Useful when someone sends multiple messages in a row (a batch).
 * Returns the joined text or a fallback message.
 */
export const getLastReceivedMessageBatch = (
  roomContext: RoomContextMessage[],
  fallback: { messageBatch: string; timestampStr: string } = {
    messageBatch: '',
    timestampStr: '',
  },
): { messageBatch: string; timestampStr: string } => {
  const reversed = [...roomContext].reverse();
  const batch: string[] = [];

  // Find the first message that is NOT from me (start of received batch)
  const startIndex = reversed.findIndex(msg => !msg.is_from_me);

  if (startIndex === -1) {
    // No received messages at all
    return fallback || { messageBatch: '', timestampStr: '' };
  }

  // Collect consecutive non-user messages starting from startIndex
  for (let i = startIndex; i < reversed.length; i++) {
    if (reversed[i].is_from_me) {
      break;
    }
    batch.unshift(reversed[i].text);
  }

  const messageBatch =
    batch.length > 0 ? batch.join('\n') : fallback.messageBatch;
  const timestampStr =
    batch.length > 0 ? reversed[startIndex].timestamp : fallback.timestampStr;
  return { messageBatch, timestampStr };
};
