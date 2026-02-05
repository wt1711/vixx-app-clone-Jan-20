import {
  MatrixClient,
  MatrixEvent,
  MsgType,
  Room,
  Direction,
} from 'matrix-js-sdk';
import {
  MessageEvent,
  RelationType,
  ContentKey,
} from 'src/types';
import {
  FOUNDER_MATRIX_ID,
} from 'src/config/founder';
import { isFounderRoom } from 'src/utils/room';

// URL parsing utilities
const URL_REGEX =
  /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))/gi;

export type ParsedTextPart =
  | { type: 'text'; content: string }
  | { type: 'url'; content: string };

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

export function parseTextWithUrls(text: string): ParsedTextPart[] {
  const parts: ParsedTextPart[] = [];
  let lastIndex = 0;

  const matches = text.matchAll(URL_REGEX);
  for (const match of matches) {
    const url = match[0];
    const index = match.index!;

    if (index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, index) });
    }

    parts.push({ type: 'url', content: url });
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

export function getFirstUrl(text: string): string | null {
  const urls = extractUrls(text);
  return urls.length > 0 ? urls[0] : null;
}

// Match Instagram URLs including:
// - Posts: /p/ABC123/
// - Reels: /reel/ABC123/ or /reels/ABC123/
// - IGTV: /tv/ABC123/
// - Stories: /stories/username/123456789?query=params
const INSTAGRAM_URL_REGEX =
  /https?:\/\/(?:www\.)?instagram\.com\/(?:stories\/[\w.-]+\/[\d]+(?:\?[^\s\n]*)?|(?:p|reel|reels|tv)\/[\w-]+\/?)/i;

export function isInstagramUrl(url: string): boolean {
  return INSTAGRAM_URL_REGEX.test(url);
}

export function getInstagramUrl(text: string): string | null {
  const match = text.match(INSTAGRAM_URL_REGEX);
  return match ? match[0] : null;
}

export function getInstagramStoryReplyData(
  text: string,
): { replyContent: string; replyTo: string } | null {
  // Match "[Action] to @Username's story" (e.g., Replied, Reacted, etc.)
  // where username can contain Unicode, spaces, emoji
  const replyToRegex = /\w+ to @(.+?)'s story/;
  const match = text.match(replyToRegex);
  if (!match) return null;

  const replyTo = match[1]; // The captured username
  const fullMatch = match[0]; // "Replied to @Username's story"

  // Get the reply content (everything after the "Replied to..." line)
  const replyContentSplit = text.split(fullMatch);
  const replyContent = replyContentSplit?.[1]?.trim();

  if (!replyContent) return null;

  return {
    replyContent,
    replyTo,
  };
}

// Slash command parsing
export function parseMessageContent(text: string): {
  msgtype: MsgType;
  body: string;
} {
  // /me emote command
  if (text.startsWith('/me ')) {
    return { msgtype: MsgType.Emote, body: text.substring(4) };
  }

  // /notice command
  if (text.startsWith('/notice ')) {
    return { msgtype: MsgType.Notice, body: text.substring(8) };
  }

  // Inline replacements
  let body = text;

  if (body.includes('/shrug')) {
    body = body.replace('/shrug', '¯\\_(ツ)_/¯');
  }

  if (body.includes('/tableflip')) {
    body = body.replace('/tableflip', '(╯°□°)╯︵ ┻━┻');
  }

  if (body.includes('/unflip')) {
    body = body.replace('/unflip', '┬─┬ノ( º _ ºノ)');
  }

  return { msgtype: MsgType.Text, body };
}

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
      : new Date().toISOString();
  return { messageBatch, timestampStr };
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
