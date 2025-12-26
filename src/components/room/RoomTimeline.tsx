import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getMatrixClient } from '../../matrixClient';
import { getEventReactions, getReactionContent } from '../../utils/room';
import { MessageEvent } from '../../types/matrix/room';
import { MessageItem, RoomTimelineProps } from './types';
import { MessageItemComponent } from './MessageItem';
import { QuickReactionsModal, ModalPosition } from './QuickReactionsModal';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { useRoomTimeline } from '../../hooks/useRoomTimeline';

const NEAR_BOTTOM_THRESHOLD = 350;
const NEAR_TOP_THRESHOLD = 200;

/**
 * Determines if we should auto-scroll to bottom when new messages arrive.
 * Scrolls if: user is near bottom OR the new message is from the current user.
 */
function shouldAutoScroll(isNearBottom: boolean, isOwnMessage: boolean): boolean {
  return isOwnMessage || isNearBottom;
}

export function RoomTimeline({ room, eventId }: RoomTimelineProps) {
  const {
    messages,
    loading,
    loadingMore,
    canLoadMore,
    loadMoreMessages,
    refresh,
  } = useRoomTimeline({ room });

  const flatListRef = useRef<FlatList>(null);
  const mx = getMatrixClient();
  const isInitialLoad = useRef(true);
  const isNearBottom = useRef(true);
  const prevLastMessageId = useRef<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const screenHeight = useRef(0);

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading && isInitialLoad.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        isInitialLoad.current = false;
      }, 100);
    }
  }, [loading, messages.length]);

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

  // Auto-scroll to bottom when new messages arrive (not when loading older messages)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.eventId ?? null;

    // Only trigger if the last message changed (new message at the end)
    const hasNewMessage =
      lastMessageId !== null && lastMessageId !== prevLastMessageId.current;
    prevLastMessageId.current = lastMessageId;

    if (!hasNewMessage || isInitialLoad.current) return;

    if (shouldAutoScroll(isNearBottom.current, lastMessage?.isOwn ?? false)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      // Store screen height for scroll button visibility
      screenHeight.current = layoutMeasurement.height;

      // Track if user is near bottom
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottom.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;

      // Show scroll button when user is more than 1 screen height from bottom
      setShowScrollButton(distanceFromBottom > layoutMeasurement.height);

      // Load more when near top
      if (contentOffset.y < NEAR_TOP_THRESHOLD && canLoadMore && !loadingMore) {
        loadMoreMessages();
      }
    },
    [canLoadMore, loadingMore, loadMoreMessages],
  );

  // Scroll to bottom handler for the button
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

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
        refresh();
      } catch (error) {
        console.info('Error toggling reaction:', error);
      }
    },
    [mx, room, refresh],
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

      <ScrollToBottomButton visible={showScrollButton} onPress={scrollToBottom} />

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
