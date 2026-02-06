import {
  MatrixClient,
  MatrixEvent,
  MsgType,
  Room,
  Direction,
} from 'matrix-js-sdk';
import { MessageEvent, RelationType, ContentKey } from 'src/types';
import { FOUNDER_MATRIX_ID } from 'src/config/founder';
import { isFounderRoom } from 'src/utils/room';
import {
  parseMessagePreview,
  parseReactionPreview,
} from 'src/utils/parsers/messageParser';

/**
 * Patterns for messages that should be hidden from room list preview
 */
const HIDDEN_MESSAGE_PATTERNS: RegExp[] = [
  /Failed to load message/i,
  /Your message was not bridged/i,
  /⚠️.*not bridged/i,
];

export function shouldHideMessage(text: string): boolean {
  return HIDDEN_MESSAGE_PATTERNS.some(pattern => pattern.test(text));
}

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
        message: parseReactionPreview(content),
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
          message: parseMessagePreview(content),
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
  room: Room | null,
  senderName: string,
): boolean => {
  // Primary: check sender ID directly
  if (sender && myUserId && sender === myUserId) {
    return true;
  }
  // Messages from founder in founder room are not from me
  if (isFounderRoom(room) && sender === FOUNDER_MATRIX_ID) {
    return false;
  }
  // Fallback for DMs: if sender name matches room name, it's from the other person
  // In DMs, room name = other person's name, so if sender name differs, it's from me
  const roomName = room?.name;
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
export const getLastReceivedMessageBatchForAI = (
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
      : new Date().toISOString();
  return { messageBatch, timestampStr };
};
