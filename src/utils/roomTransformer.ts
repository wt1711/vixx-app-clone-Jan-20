import { Room, MatrixClient } from 'matrix-js-sdk';
import { MessageEvent } from '../types/matrix/room';
import { formatRelativeTime } from './timeFormatter';

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
 * Patterns for messages that should be hidden from preview
 * Keep in sync with useChatTimeline.ts HIDDEN_MESSAGE_PATTERNS
 */
const HIDDEN_MESSAGE_PATTERNS: RegExp[] = [
  /Failed to load message/i,
  /Your message was not bridged/i,
  /⚠️.*not bridged/i,
];

function shouldHideMessage(text: string): boolean {
  return HIDDEN_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
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
    timestamp: formatRelativeTime(room.getLastActiveTimestamp()),
    unread: room.getUnreadNotificationCount() > 0,
  };
}
