import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { getMatrixClient } from '../../matrixClient';
import { getEventReactions, getReactionContent } from '../../utils/room';
import { MessageEvent } from '../../types/matrix/room';
import { MessageItem, RoomTimelineProps } from './types';
import { MessageItemComponent, QuickReactionsModal, ModalPosition } from './message';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { useRoomTimeline, useTimelineScroll } from '../../hooks/room';
import { useReply } from '../../context/ReplyContext';
import { colors } from '../../theme';

export function RoomTimeline({ room, eventId }: RoomTimelineProps) {
  const mx = getMatrixClient();

  // ─── Data Loading ───────────────────────────────────────────────────────────
  const {
    messages,
    loading,
    loadingMore,
    canLoadMore,
    loadMoreMessages,
    refresh,
  } = useRoomTimeline({ room });

  // ─── Scroll Behavior ────────────────────────────────────────────────────────
  const {
    flatListRef,
    showScrollButton,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
  } = useTimelineScroll({
    messages,
    loading,
    loadingMore,
    canLoadMore,
    loadMoreMessages,
    targetEventId: eventId,
  });

  // ─── Quick Reactions Modal ──────────────────────────────────────────────────
  const [quickReactionsItem, setQuickReactionsItem] = useState<MessageItem | null>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);

  const openQuickReactions = useCallback(
    (item: MessageItem, position: ModalPosition) => {
      setModalPosition(position);
      setQuickReactionsItem(item);
    },
    [],
  );

  const closeQuickReactions = useCallback(() => {
    setQuickReactionsItem(null);
    setModalPosition(null);
  }, []);

  // ─── Reactions ──────────────────────────────────────────────────────────────
  const toggleReaction = useCallback(
    async (targetEventId: string, reactionKey: string) => {
      if (!mx) return;

      try {
        const relations = getEventReactions(room, targetEventId);
        const sortedReactions = relations?.getSortedAnnotationsByKey() || [];
        const [, reactionsSet] =
          sortedReactions.find(([k]) => k === reactionKey) || [];
        const reactions = reactionsSet ? Array.from(reactionsSet) : [];
        const myReaction = reactions.find(e => e.getSender() === mx.getUserId());

        if (myReaction && myReaction.isRelation()) {
          await mx.redactEvent(room.roomId, myReaction.getId() || '');
        } else {
          await mx.sendEvent(
            room.roomId,
            MessageEvent.Reaction as any,
            getReactionContent(targetEventId, reactionKey),
          );
        }
        refresh();
      } catch (error) {
        console.info('Error toggling reaction:', error);
      }
    },
    [mx, room, refresh],
  );

  const handleQuickReactionSelect = useCallback(
    (emoji: string, targetEventId: string) => {
      toggleReaction(targetEventId, emoji);
      closeQuickReactions();
    },
    [toggleReaction, closeQuickReactions],
  );

  // ─── Message Selection (for timestamp) ──────────────────────────────────────
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const handleBubblePress = useCallback((msgEventId: string) => {
    setSelectedMessageId(prev => (prev === msgEventId ? null : msgEventId));
  }, []);

  // ─── Image Viewer ──────────────────────────────────────────────────────────
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const handleImagePress = useCallback((imageUrl: string) => {
    setViewingImageUrl(imageUrl);
  }, []);

  const closeImageViewer = useCallback(() => {
    setViewingImageUrl(null);
  }, []);

  // ─── Reply ─────────────────────────────────────────────────────────────────
  const { setReplyingTo } = useReply();

  const handleReply = useCallback(
    (item: MessageItem) => {
      setReplyingTo({
        eventId: item.eventId,
        sender: item.sender,
        senderName: item.senderName,
        content: item.content,
        msgtype: item.msgtype,
        isOwn: item.isOwn,
      });
    },
    [setReplyingTo],
  );

  const handleReplyFromModal = useCallback(
    () => {
      if (quickReactionsItem) {
        handleReply(quickReactionsItem);
      }
      closeQuickReactions();
    },
    [quickReactionsItem, handleReply, closeQuickReactions],
  );

  // ─── Scroll to Replied Message ─────────────────────────────────────────────
  const scrollToMessage = useCallback(
    (targetEventId: string) => {
      const index = messages.findIndex(msg => msg.eventId === targetEventId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // Center the message in view
        });
        // Briefly highlight the message by selecting it
        setSelectedMessageId(targetEventId);
        // Clear highlight after a short delay
        setTimeout(() => {
          setSelectedMessageId(prev => prev === targetEventId ? null : prev);
        }, 2000);
      }
    },
    [messages, flatListRef],
  );

  // Handle scroll-to-index failures (fallback for variable height items)
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: false,
        });
      }, 100);
    },
    [flatListRef],
  );

  // ─── Hour Separators ────────────────────────────────────────────────────────
  // Messages are in reverse order (newest first) for inverted FlatList,
  // so iterate from end (oldest) to find first message of each hour
  const firstOfHourIds = React.useMemo(() => {
    const ids = new Set<string>();
    let lastHour: number | null = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
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

  // ─── Render Helpers ─────────────────────────────────────────────────────────
  const renderHeader = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
        <Text style={styles.loadingMoreText}>Loading older messages...</Text>
      </View>
    );
  }, [loadingMore]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageItemComponent
        item={item}
        onReactionPress={(key: string) => toggleReaction(item.eventId, key)}
        onLongPress={(getPosition) => {
          const position = getPosition();
          openQuickReactions(item, position);
        }}
        onBubblePress={() => handleBubblePress(item.eventId)}
        onReplyPreviewPress={scrollToMessage}
        onImagePress={handleImagePress}
        showTimestamp={selectedMessageId === item.eventId}
        isFirstOfHour={firstOfHourIds.has(item.eventId)}
      />
    ),
    [toggleReaction, openQuickReactions, handleBubblePress, scrollToMessage, handleImagePress, selectedMessageId, firstOfHourIds],
  );

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        renderItem={renderMessage}
        keyExtractor={(item) => item.eventId}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={renderHeader}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={onScrollToIndexFailed}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        initialNumToRender={20}
        windowSize={21}
        keyboardShouldPersistTaps="handled"
      />

      <ScrollToBottomButton visible={showScrollButton} onPress={scrollToBottom} />

      <QuickReactionsModal
        visible={quickReactionsItem !== null}
        messageItem={quickReactionsItem}
        position={modalPosition}
        onClose={closeQuickReactions}
        onSelectEmoji={handleQuickReactionSelect}
        onReply={handleReplyFromModal}
      />

      <ImageViewing
        images={viewingImageUrl ? [{ uri: viewingImageUrl }] : []}
        imageIndex={0}
        visible={viewingImageUrl !== null}
        onRequestClose={closeImageViewer}
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
    color: colors.text.secondary,
  },
});
