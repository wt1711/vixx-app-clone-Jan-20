import { useState, useEffect, useCallback, useRef } from 'react';
import { MatrixEvent, Room, RoomEvent, Direction, ReceiptType } from 'matrix-js-sdk';
import { getMatrixClient } from '../matrixClient';
import {
  getMemberAvatarMxc,
  getRoomAvatarUrl,
  messageEventOnly,
  isMessageFromMe,
} from '../utils/room';
import { MessageItem } from '../components/room/types';
import { getReactionsForEvent } from '../components/room/utils';

const MIN_MESSAGES_FOR_INITIAL_LOAD = 10;
const PAGINATION_LIMIT = 30;

/**
 * Sends a read receipt for the latest message in the room
 */
async function sendReadReceiptForLatestMessage(
  mx: ReturnType<typeof getMatrixClient>,
  room: Room,
): Promise<void> {
  if (!mx) return;

  try {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();

    // Find the last event (any type, not just messages)
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;

    // Send read receipt
    await mx.sendReadReceipt(lastEvent, ReceiptType.Read);
  } catch (error) {
    // Silently fail - read receipts are not critical
    console.debug('Failed to send read receipt:', error);
  }
}

interface UseRoomTimelineOptions {
  room: Room;
}

interface UseRoomTimelineReturn {
  messages: MessageItem[];
  loading: boolean;
  loadingMore: boolean;
  canLoadMore: boolean;
  loadMoreMessages: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Consolidated hook for room timeline message loading and pagination.
 * Handles initial load, pagination, and real-time updates.
 */
export function useRoomTimeline({
  room,
}: UseRoomTimelineOptions): UseRoomTimelineReturn {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const isInitialLoad = useRef(true);
  const mx = getMatrixClient();

  /**
   * Maps a MatrixEvent to a MessageItem for display
   */
  const mapEventToMessage = useCallback(
    (event: MatrixEvent): MessageItem | null => {
      if (!mx || event.getType() !== 'm.room.message') return null;
      if (!messageEventOnly(event)) return null;

      const content = event.getContent();
      const sender = event.getSender() || '';
      const senderMember = room.getMember(sender);
      const senderName =
        senderMember?.name || sender.split('@')[0]?.split(':')[0] || 'Unknown';
      const roomName = room.name || 'Unknown';
      const isOwn = isMessageFromMe(sender, mx.getUserId(), roomName, senderName);
      const avatarUrl = isOwn
        ? undefined
        : getMemberAvatarMxc(mx, room, sender) ||
          getRoomAvatarUrl(mx, room, 96, true);

      let contentText = '';
      let imageUrl: string | undefined;
      let imageInfo: { w?: number; h?: number; mimetype?: string } | undefined;

      if (content.msgtype === 'm.text') {
        contentText = content.body || '';
      } else if (content.msgtype === 'm.image') {
        const mxcUrl = content.file?.url || content.url;
        if (mxcUrl && typeof mxcUrl === 'string') {
          imageUrl =
            mx.mxcUrlToHttp(mxcUrl, 400, 400, 'scale', undefined, false, true) ||
            undefined;
          imageUrl = `${imageUrl}&access_token=${mx.getAccessToken()}`;
          imageInfo = content.info || content.file?.info;
        }
        contentText = content.body || '📷 Image';
      } else if (content.msgtype === 'm.video') {
        contentText = '🎥 Video';
      } else if (content.msgtype === 'm.file') {
        contentText = '📎 File';
      } else {
        contentText = 'Message';
      }

      const currentEventId = event.getId() || '';
      const reactions = getReactionsForEvent(
        room,
        currentEventId,
        mx.getUserId() || '',
      );

      return {
        eventId: currentEventId,
        sender,
        senderName,
        content: contentText,
        timestamp: event.getTs(),
        msgtype: content.msgtype,
        isOwn,
        avatarUrl: avatarUrl || undefined,
        imageUrl,
        imageInfo,
        reactions,
      };
    },
    [mx, room],
  );

  /**
   * Extracts messages from the current timeline
   */
  const extractMessagesFromTimeline = useCallback(() => {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const messageItems: MessageItem[] = events
      .map(mapEventToMessage)
      .filter((item): item is MessageItem => item !== null)
      .reverse(); // Newest first for inverted FlatList
    return { messageItems, timeline };
  }, [room, mapEventToMessage]);

  /**
   * Updates the canLoadMore state based on pagination token
   */
  const updateCanLoadMore = useCallback((timeline: ReturnType<Room['getLiveTimeline']>) => {
    const paginationToken = timeline.getPaginationToken(Direction.Backward);
    setCanLoadMore(!!paginationToken);
  }, []);

  /**
   * Loads initial messages and paginates if needed
   */
  const loadMessages = useCallback(async () => {
    if (!mx || !room) return;

    let { messageItems, timeline } = extractMessagesFromTimeline();

    // Auto-paginate if we have too few messages on initial load
    if (messageItems.length < MIN_MESSAGES_FOR_INITIAL_LOAD && isInitialLoad.current) {
      const paginationToken = timeline.getPaginationToken(Direction.Backward);
      if (paginationToken) {
        await mx.paginateEventTimeline(timeline, {
          backwards: true,
          limit: PAGINATION_LIMIT,
        });
        const newData = extractMessagesFromTimeline();
        messageItems = newData.messageItems;
        timeline = newData.timeline;
      }
    }

    setMessages(messageItems);
    setLoading(false);
    updateCanLoadMore(timeline);

    // Send read receipt when messages are loaded (marks room as read)
    sendReadReceiptForLatestMessage(mx, room);

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [mx, room, extractMessagesFromTimeline, updateCanLoadMore]);

  /**
   * Loads older messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!mx || !room || loadingMore || !canLoadMore) return;

    setLoadingMore(true);
    try {
      const timeline = room.getLiveTimeline();
      const paginationToken = timeline.getPaginationToken(Direction.Backward);

      if (!paginationToken) {
        setCanLoadMore(false);
        return;
      }

      await mx.paginateEventTimeline(timeline, {
        backwards: true,
        limit: PAGINATION_LIMIT,
      });

      const { messageItems, timeline: newTimeline } = extractMessagesFromTimeline();
      setMessages(messageItems);
      updateCanLoadMore(newTimeline);
    } catch (error) {
      console.info('Failed to load more messages:', error);
      setCanLoadMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [mx, room, loadingMore, canLoadMore, extractMessagesFromTimeline, updateCanLoadMore]);

  /**
   * Refreshes messages from timeline (for use after reactions, etc.)
   */
  const refresh = useCallback(async () => {
    const { messageItems } = extractMessagesFromTimeline();
    setMessages(messageItems);
  }, [extractMessagesFromTimeline]);

  // Initial load and timeline event subscription
  useEffect(() => {
    if (!mx || !room) {
      setLoading(false);
      return;
    }

    loadMessages();

    const onRoomTimeline = (event: MatrixEvent, roomObj: Room | undefined) => {
      if (roomObj?.roomId === room.roomId) {
        refresh();
        // Send read receipt for new messages while viewing the room
        sendReadReceiptForLatestMessage(mx, room);
      }
    };

    mx.on(RoomEvent.Timeline, onRoomTimeline);

    return () => {
      mx.off(RoomEvent.Timeline, onRoomTimeline);
    };
  }, [mx, room, loadMessages, refresh]);

  return {
    messages,
    loading,
    loadingMore,
    canLoadMore,
    loadMoreMessages,
    refresh,
  };
}
