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
} from 'src/types';
import {
  getInstagramUrl,
  getInstagramStoryReplyData,
} from 'src/utils/urlParser';
import {
  FOUNDER_MATRIX_ID,
  FOUNDER_ROOM_NAME,
  FOUNDER_ROOM_NAME_LEGACY,
  FOUNDER_AVATAR_URL,
} from 'src/config/founder';

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
    ? (mx.mxcUrlToHttp(
        mxcUrl,
        size,
        size,
        'crop',
        undefined,
        false,
        useAuthentication,
      ) ?? undefined)
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
    if (content.info?.mimetype === 'image/gif') {
      return 'Sent a GIF';
    }
    return 'Sent a photo';
  } else if (content.msgtype === MsgType.Video) {
    return 'Sent a video';
  } else if (content.msgtype === MsgType.File) {
    return 'Sent an attachment';
  } else if (content.msgtype === MsgType.Audio) {
    return 'Sent an audio';
  }
  return 'Sent a message';
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
 * Checks if an event has been redacted (deleted)
 */
const isEventRedacted = (event: MatrixEvent): boolean => {
  // Check if event is marked as redacted
  if (event.isRedacted()) return true;
  // Check for redacted_because in unsigned data
  const unsigned = event.getUnsigned();
  if (unsigned?.redacted_because) return true;
  return false;
};

/**
 * Finds the last message or reaction from an array of events
 * Compares reaction and message timestamps to handle messed up reaction timestamps
 * Skips redacted (deleted) messages
 */
const findLastMessageInEvents = (
  events: MatrixEvent[],
): LastMessageInfo | null => {
  if (events.length === 0) return null;

  let lastReaction: LastMessageInfo | null = null;
  let lastMessage: LastMessageInfo | null = null;

  // Find the latest reaction and latest message
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];

    // Skip redacted (deleted) events
    if (isEventRedacted(event)) continue;

    const eventType = event.getType();
    const content = event.getContent();

    // Find first (latest) reaction
    if (!lastReaction && eventType === MessageEvent.Reaction) {
      lastReaction = {
        message: formatReactionPreview(content),
        timestamp: event.getTs(),
        isReaction: true,
        senderId: event.getSender() || undefined,
        senderName: event.sender?.name || undefined,
      };
    }

    // Find first (latest) message
    if (!lastMessage && eventType === MessageEvent.RoomMessage) {
      if (content.msgtype !== MsgType.Notice) {
        lastMessage = {
          message: formatMessagePreview(content),
          timestamp: event.getTs(),
          senderId: event.getSender() || undefined,
          senderName: event.sender?.name || undefined,
        };
      }
    }

    // If we've found both, we can stop
    if (lastReaction && lastMessage) {
      break;
    }
  }

  // Return whichever has the later timestamp
  if (lastReaction && lastMessage) {
    return lastReaction.timestamp > lastMessage.timestamp
      ? lastReaction
      : lastMessage;
  }
  return lastReaction || lastMessage;
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
  // Primary: check sender ID directly
  if (sender && myUserId && sender === myUserId) {
    return true;
  }
  // Messages from founder in founder room are not from me
  if (isFounderRoom(roomName) && sender === FOUNDER_MATRIX_ID) {
    return false;
  }
  // Fallback for DMs: if sender name matches room name, it's from the other person
  // In DMs, room name = other person's name, so if sender name differs, it's from me

  if (roomName && senderName) {
    return roomName !== senderName;
  }
  return false;
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
    messageBatch: 'Hello',
    timestampStr: '2026-01-01T15:00:00Z',
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
    batch.length > 0
      ? reversed[startIndex].timestamp
      : Date.now().toLocaleString();
  return { messageBatch, timestampStr };
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
  T extends { eventId: string; isOwn: boolean; sender: string; timestamp: number },
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
  T extends { eventId: string; isOwn: boolean; sender: string; timestamp: number },
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
  T extends { eventId: string; isOwn: boolean; sender: string; timestamp: number },
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
  T extends { eventId: string; isOwn: boolean; sender: string; timestamp: number },
>(
  messages: T[],
): Array<{ burst: T[]; firstEventId: string; isOwnBurst: boolean }> => {
  if (messages.length === 0) return [];

  // Sort messages by timestamp (oldest first)
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  const bursts: Array<{ burst: T[]; firstEventId: string; isOwnBurst: boolean }> = [];
  let currentBurst: T[] = [];
  let currentSender: string | null = null;
  let currentIsOwn: boolean | null = null;

  for (const msg of sorted) {
    // If this message is from a different sender, close the current burst and start a new one
    if (currentSender !== null && (msg.sender !== currentSender || msg.isOwn !== currentIsOwn)) {
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

// Message variant utilities
export type MessageVariant =
  | 'instagram-story-reply'
  | 'instagram-image'
  | 'instagram-video'
  | 'gif'
  | 'image'
  | 'video'
  | 'text';

export type MessageVariantInput = {
  content: string;
  msgtype?: string;
  imageUrl?: string;
  videoUrl?: string;
  imageInfo?: {
    mimetype?: string;
  };
};

export function getMessageVariant(item: MessageVariantInput): MessageVariant {
  const instagramUrl = getInstagramUrl(item.content);
  const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;
  const isVideoMessage = item.msgtype === MsgType.Video && item.videoUrl;

  if (isImageMessage && instagramUrl) {
    const storyData = getInstagramStoryReplyData(item.content);
    return storyData ? 'instagram-story-reply' : 'instagram-image';
  }

  if (isVideoMessage && instagramUrl) return 'instagram-video';
  if (isImageMessage && item.imageInfo?.mimetype === 'image/gif') return 'gif';
  if (isImageMessage) return 'image';
  if (isVideoMessage) return 'video';
  return 'text';
}
