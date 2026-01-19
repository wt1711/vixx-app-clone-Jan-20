import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { getMatrixClient } from 'src/matrixClient';
import {
  getEventReactions,
  getReactionContent,
  isFounderRoom,
} from 'src/utils/room';
import { MessageEvent } from 'src/types';
import { MessageItem, RoomTimelineProps } from '../types';
import {
  MessageItemComponent,
  QuickReactionsModal,
  ModalPosition,
} from '../message';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { FounderWelcomeCard } from './FounderWelcomeCard';
import { useRoomTimeline, useTimelineScroll } from 'src/hooks/room';
import { useReply } from 'src/context/ReplyContext';
import { useInputHeight } from 'src/context/InputHeightContext';
import { colors } from 'src/config';

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
  const [quickReactionsItem, setQuickReactionsItem] =
    useState<MessageItem | null>(null);
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(
    null,
  );

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
        const myReaction = reactions.find(
          e => e.getSender() === mx.getUserId(),
        );

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
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

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

  // ─── Dynamic Padding for Input Height ─────────────────────────────────────
  const { inputHeight } = useInputHeight();

  // Dynamic content container style - paddingTop is visual bottom in inverted list
  const listContentStyle = useMemo(
    () => ({
      paddingTop: inputHeight + 16, // input height + extra spacing
      paddingBottom: 16,
      paddingHorizontal: 16,
    }),
    [inputHeight],
  );

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

  const handleReplyFromModal = useCallback(() => {
    if (quickReactionsItem) {
      handleReply(quickReactionsItem);
    }
    closeQuickReactions();
  }, [quickReactionsItem, handleReply, closeQuickReactions]);

  const handleDeleteFromModal = useCallback(() => {
    if (!quickReactionsItem || !mx) return;

    Alert.alert('Delete Message', 'Are you sure? This cannot be undone', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mx.redactEvent(room.roomId, quickReactionsItem.eventId);
            refresh();
          } catch (error) {
            console.error('Error deleting message:', error);
            Alert.alert('Error', 'Failed to delete message. Please try again.');
          }
          closeQuickReactions();
        },
      },
    ]);
  }, [quickReactionsItem, mx, room.roomId, refresh, closeQuickReactions]);

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
          setSelectedMessageId(prev => (prev === targetEventId ? null : prev));
        }, 2000);
      }
    },
    [messages, flatListRef],
  );

  // Handle scroll-to-index failures (fallback for variable height items)
  const onScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
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

  // ─── Founder Room Check ─────────────────────────────────────────────────────
  const isFounderRoomChat = isFounderRoom(room.name);

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

  const renderFooter = useCallback(() => {
    if (!isFounderRoomChat) return null;
    return <FounderWelcomeCard />;
  }, [isFounderRoomChat]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageItemComponent
        item={item}
        onReactionPress={(key: string) => toggleReaction(item.eventId, key)}
        onLongPress={getPosition => {
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
    [
      toggleReaction,
      openQuickReactions,
      handleBubblePress,
      scrollToMessage,
      handleImagePress,
      selectedMessageId,
      firstOfHourIds,
    ],
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
        keyExtractor={item => item.eventId}
        contentContainerStyle={listContentStyle}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={onScrollToIndexFailed}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        initialNumToRender={20}
        windowSize={21}
        keyboardShouldPersistTaps="handled"
      />

      <ScrollToBottomButton
        visible={showScrollButton}
        onPress={scrollToBottom}
      />

      <QuickReactionsModal
        visible={quickReactionsItem !== null}
        messageItem={quickReactionsItem}
        position={modalPosition}
        onClose={closeQuickReactions}
        onSelectEmoji={handleQuickReactionSelect}
        onReply={handleReplyFromModal}
        onDelete={handleDeleteFromModal}
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
