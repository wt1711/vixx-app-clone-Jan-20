import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Room, MatrixEvent, RoomEvent, Direction } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import {
  getMemberAvatarMxc,
  getRoomAvatarUrl,
  messageEventOnly,
  getEventReactions,
  getReactionContent,
} from '../../utils/room';
import { MessageEvent } from '../../types/matrix/room';
import { MessageItem, RoomTimelineProps } from './types';
import { getReactionsForEvent } from './utils';
import { MessageItemComponent } from './MessageItem';
import { QuickReactionsModal, ModalPosition } from './QuickReactionsModal';

export function RoomTimeline({ room, eventId }: RoomTimelineProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const mx = getMatrixClient();
  const isInitialLoad = useRef(true);

  const mapEventToMessage = useCallback(
    (event: MatrixEvent): MessageItem | null => {
      if (!mx || event.getType() !== 'm.room.message') return null;

      const content = event.getContent();
      const sender = event.getSender() || '';
      const senderMember = room.getMember(sender);
      const senderName =
        senderMember?.name || sender.split('@')[0]?.split(':')[0] || 'Unknown';
      const roomName = room.name || 'Unknown';
      const isOwn = sender === mx.getUserId() || roomName !== senderName;
      const avatarUrl = isOwn
        ? undefined
        : getMemberAvatarMxc(mx, room, sender) ||
          getRoomAvatarUrl(mx, room, 96, true);

      if (!messageEventOnly(event)) return null;

      let contentText = '';
      let imageUrl: string | undefined;
      let imageInfo: { w?: number; h?: number; mimetype?: string } | undefined;

      if (content.msgtype === 'm.text') {
        contentText = content.body || '';
      } else if (content.msgtype === 'm.image') {
        // Extract image URL from content
        const mxcUrl = content.file?.url || content.url;
        if (mxcUrl && typeof mxcUrl === 'string') {
          // Convert MXC URL to HTTP with authentication
          imageUrl =
            mx.mxcUrlToHttp(
              mxcUrl,
              400,
              400,
              'scale',
              undefined,
              false,
              true,
            ) || undefined;
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

      // Get reactions for this event
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

  const getEventFromMessage = () => {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();

    const messageItems: MessageItem[] = events
      .map(mapEventToMessage)
      .filter((item): item is MessageItem => item !== null);
    return { messageItems, timeline };
  };

  const loadMessages = useCallback(async () => {
    if (!mx || !room) return;

    let { messageItems, timeline } = getEventFromMessage();

    if (messageItems.length < 10 && isInitialLoad.current) {
      await mx.paginateEventTimeline(timeline, {
        backwards: true,
        limit: 50, // Load 10 messages at a time
      });
      const newData = getEventFromMessage();
      messageItems = newData.messageItems;
      timeline = newData.timeline;
    }

    setMessages(messageItems);
    setLoading(false);

    // Check if we can paginate backwards
    setTimeout(() => {
      const paginationToken = timeline.getPaginationToken(Direction.Backward);
      setCanLoadMore(!!paginationToken);
    }, 600);

    // Scroll to bottom after initial load
    if (isInitialLoad.current && messageItems.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        isInitialLoad.current = false;
      }, 1000);
    }
  }, [mx, room, mapEventToMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMoreMessages = useCallback(async () => {
    if (!mx || !room || loadingMore || !canLoadMore) return;

    setLoadingMore(true);
    try {
      const timeline = room.getLiveTimeline();
      const paginationToken = timeline.getPaginationToken(Direction.Backward);

      if (!paginationToken) {
        setCanLoadMore(false);
        setLoadingMore(false);
        return;
      }

      // Store current scroll position
      const currentFirstMessageId =
        messages.length > 0 ? messages[0].eventId : null;

      // Paginate backwards to load older messages
      await mx.paginateEventTimeline(timeline, {
        backwards: true,
        limit: 50, // Load 50 messages at a time
      });

      // Reload messages after pagination
      loadMessages();

      // Try to maintain scroll position
      if (currentFirstMessageId) {
        setTimeout(() => {
          const newIndex = messages.findIndex(
            m => m.eventId === currentFirstMessageId,
          );
          if (newIndex >= 0) {
            flatListRef.current?.scrollToIndex({
              index: newIndex,
              animated: false,
            });
          }
        }, 500);
      }
    } catch (error) {
      console.info('Failed to load more messages:', error);
      setCanLoadMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [mx, room, loadingMore, canLoadMore, messages, loadMessages]);

  useEffect(() => {
    if (!mx || !room) {
      setLoading(false);
      return;
    }

    loadMessages();

    // Listen for new events
    const onRoomTimeline = (event: MatrixEvent, roomObj: Room | undefined) => {
      if (roomObj?.roomId === room.roomId) {
        loadMessages();
        // Auto-scroll to bottom on new message (only if user is at bottom)
        if (event.getType() === 'm.room.message') {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    };

    mx.on(RoomEvent.Timeline, onRoomTimeline);

    return () => {
      mx.off(RoomEvent.Timeline, onRoomTimeline);
    };
  }, [mx, room, loadMessages]);

  // Scroll to specific event if eventId prop is provided
  useEffect(() => {
    if (eventId && messages.length > 0) {
      const targetIndex = messages.findIndex(m => m.eventId === eventId);
      if (targetIndex >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
          });
        }, 200);
      }
    }
  }, [eventId, messages]);

  // All hooks must be called before any conditional returns
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      // Check if user scrolled near the top (within 200px)
      if (contentOffset.y < 200 && canLoadMore && !loadingMore) {
        loadMoreMessages();
      }
    },
    [canLoadMore, loadingMore, loadMoreMessages],
  );

  // Memoized header component
  const renderHeader = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#FF6B35" />
        <Text style={styles.loadingMoreText}>Loading older messages...</Text>
      </View>
    );
  }, [loadingMore]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: MessageItem) => item.eventId, []);

  // Memoized content size change handler
  const handleContentSizeChange = useCallback(() => {
    // Auto-scroll to bottom only on initial load
    if (isInitialLoad.current && messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length]);

  // Optimize FlatList with getItemLayout for better performance
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 80, // Approximate item height
      offset: 80 * index,
      index,
    }),
    [],
  );

  // Reaction toggle handler
  const handleReactionToggle = useCallback(
    async (targetEventId: string, reactionKey: string) => {
      if (!mx) return;

      try {
        const relations = getEventReactions(room, targetEventId);
        const sortedReactions = relations?.getSortedAnnotationsByKey() || [];
        const [, reactionsSet] =
          sortedReactions.find(([k]) => k === reactionKey) || [];
        const reactions = reactionsSet ? Array.from(reactionsSet) : [];
        const myReaction = reactions.find(
          e => e.getSender() === mx.getUserId(),
        );

        if (myReaction && myReaction.isRelation()) {
          // Remove reaction
          await mx.redactEvent(room.roomId, myReaction.getId() || '');
        } else {
          // Add reaction
          await mx.sendEvent(
            room.roomId,
            MessageEvent.Reaction as any,
            getReactionContent(targetEventId, reactionKey),
          );
        }
        // Reload messages to update reactions
        loadMessages();
      } catch (error) {
        console.info('Error toggling reaction:', error);
      }
    },
    [mx, room, loadMessages],
  );

  // Add reaction handler - accepts optional emoji
  const handleAddReaction = useCallback(
    (targetEventId: string, emoji?: string) => {
      // Use provided emoji or default to 👍
      const reactionEmoji = emoji || '👍';
      handleReactionToggle(targetEventId, reactionEmoji);
    },
    [handleReactionToggle],
  );

  // State for showing quick reactions modal
  const [quickReactionsEventId, setQuickReactionsEventId] = useState<
    string | null
  >(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);

  // State for showing timestamp on message tap
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  // Calculate which messages are first of their hour
  const firstOfHourIds = React.useMemo(() => {
    const ids = new Set<string>();
    let lastHour: number | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp);
      const msgHour =
        msgDate.getFullYear() * 1000000 +
        (msgDate.getMonth() + 1) * 10000 +
        msgDate.getDate() * 100 +
        msgDate.getHours();

      if (lastHour === null || msgHour !== lastHour) {
        ids.add(msg.eventId);
        lastHour = msgHour;
      }
    }

    return ids;
  }, [messages]);

  const handleBubblePress = useCallback((eventId: string) => {
    setSelectedMessageId(prev => (prev === eventId ? null : eventId));
  }, []);

  const handleMessageLongPress = useCallback(
    (
      targetEventId: string,
      getPosition: () => {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      const position = getPosition();
      setModalPosition(position);
      setQuickReactionsEventId(targetEventId);
    },
    [],
  );

  const handleCloseQuickReactions = useCallback(() => {
    setQuickReactionsEventId(null);
    setModalPosition(null);
  }, []);

  const handleQuickReactionSelect = useCallback(
    (emoji: string, targetEventId: string) => {
      handleAddReaction(targetEventId, emoji);
      setQuickReactionsEventId(null);
      setModalPosition(null);
    },
    [handleAddReaction],
  );

  // Memoized render function
  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => {
      const handleLongPress = (
        getPosition: () => {
          x: number;
          y: number;
          width: number;
          height: number;
        },
      ) => {
        handleMessageLongPress(item.eventId, getPosition);
      };
      return (
        <MessageItemComponent
          item={item}
          onReactionPress={(key: string) =>
            handleReactionToggle(item.eventId, key)
          }
          onLongPress={handleLongPress}
          onBubblePress={() => handleBubblePress(item.eventId)}
          showTimestamp={selectedMessageId === item.eventId}
          isFirstOfHour={firstOfHourIds.has(item.eventId)}
        />
      );
    },
    [
      handleReactionToggle,
      handleMessageLongPress,
      handleBubblePress,
      selectedMessageId,
      firstOfHourIds,
    ],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        inverted={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        ListHeaderComponent={renderHeader}
        onContentSizeChange={handleContentSizeChange}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        scrollEnabled={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      />

      <QuickReactionsModal
        visible={quickReactionsEventId !== null}
        targetEventId={quickReactionsEventId}
        position={modalPosition}
        onClose={handleCloseQuickReactions}
        onSelectEmoji={handleQuickReactionSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
