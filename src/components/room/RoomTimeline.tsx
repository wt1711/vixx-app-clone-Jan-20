import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { BlurView } from '@react-native-community/blur';
import { Room, MatrixEvent, RoomEvent, Direction } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import { getMemberAvatarMxc, getRoomAvatarUrl, messageEventOnly, getEventReactions, getReactionContent } from '../../utils/room';
import { MessageEvent } from '../../types/matrix/room';

type ReactionData = {
  key: string;
  count: number;
  myReaction: boolean;
};

type MessageItem = {
  eventId: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  msgtype?: string;
  isOwn: boolean;
  avatarUrl?: string;
  imageUrl?: string;
  imageInfo?: {
    w?: number;
    h?: number;
    mimetype?: string;
  };
  reactions?: ReactionData[];
};

type RoomTimelineProps = {
  room: Room;
  eventId?: string;
};

// Memoized Message Item Component - moved outside to avoid recreation on every render
const MessageItemComponent = React.memo<{
  item: MessageItem;
  onReactionPress?: (key: string) => void;
  onLongPress?: (getPosition: () => { x: number; y: number; width: number; height: number }) => void;
  onBubblePress?: () => void;
  showTimestamp?: boolean;
  isFirstOfHour?: boolean;
}>(({ item, onReactionPress, onLongPress, onBubblePress, showTimestamp, isFirstOfHour }) => {
  const messageRef = useRef<View>(null);
  const shouldShowTimestamp = showTimestamp || isFirstOfHour;
  const animatedOpacity = useRef(new Animated.Value(shouldShowTimestamp ? 1 : 0)).current;

  useEffect(() => {
    // Only animate for tap-triggered timestamps, not for first-of-hour
    if (!isFirstOfHour) {
      LayoutAnimation.configureNext(LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      ));

      Animated.timing(animatedOpacity, {
        toValue: showTimestamp ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showTimestamp, animatedOpacity, isFirstOfHour]);

  const formatTimeWithDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${time}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const timeString = formatTimeWithDay(item.timestamp);
  const initials = getInitials(item.senderName);
  const imageStyle = item.imageInfo?.w && item.imageInfo?.h
    ? [
        styles.messageImage,
        styles.messageImageWithRatio,
        { aspectRatio: item.imageInfo.w / item.imageInfo.h, maxWidth: 250 },
      ]
    : [styles.messageImage, styles.messageImageDefault];

  const handleLongPress = () => {
    if (onLongPress && messageRef.current) {
      messageRef.current.measure((x, y, width, height, pageX, pageY) => {
        onLongPress(() => ({ x: pageX, y: pageY, width, height }));
      });
    } else {
      console.warn('⚠️ Cannot measure: onLongPress=', !!onLongPress, 'messageRef.current=', !!messageRef.current);
    }
  };

  return (
    <View>
      {/* Timestamp shown above message when tapped or first of hour */}
      {shouldShowTimestamp && (
        <Animated.View
          style={[styles.timestampRow, isFirstOfHour ? { opacity: 1 } : { opacity: animatedOpacity }]}
        >
          <Text style={styles.timestampText}>{timeString}</Text>
        </Animated.View>
      )}

      <View
        ref={messageRef}
        style={[
          styles.messageContainer,
          item.isOwn ? styles.messageOwn : styles.messageOther,
        ]}
      >
        {!item.isOwn && (
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
        )}

        <Pressable
          onPress={onBubblePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={styles.messageBubbleWrapper}
        >
          <View
            style={[
              styles.messageBubble,
              item.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            ]}
          >
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={80}
              reducedTransparencyFallbackColor={item.isOwn ? '#123660' : '#1A1D24'}
            />
            <View style={styles.messageBubbleContent}>
              {/* Render image if it's an image message */}
              {item.msgtype === 'm.image' && item.imageUrl ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={imageStyle}
                    resizeMode="contain"
                  />
                  {item.content && item.content === '📷 Image' && (
                    <Text
                      style={[
                        styles.messageText,
                        item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
                        styles.imageCaption,
                      ]}
                    >
                      {item.content}
                    </Text>
                  )}
                </View>
              ) : (
                <Text
                  style={[
                    styles.messageText,
                    item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
                  ]}
                >
                  {item.content}
                </Text>
              )}

              {/* Reactions inside message bubble */}
              {item.reactions && item.reactions.length > 0 && (
                <View style={styles.reactionsInsideBubble} pointerEvents="box-none">
                  {item.reactions.map((reaction) => (
                    <TouchableOpacity
                      key={reaction.key}
                      style={[
                        item.isOwn ? styles.reactionButtonInsideOwn : styles.reactionButtonInsideOther,
                        reaction.myReaction && (item.isOwn ? styles.reactionButtonActiveInsideOwn : styles.reactionButtonActiveInsideOther),
                      ]}
                      onPress={() => onReactionPress?.(reaction.key)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.reactionEmojiInside}>{reaction.key}</Text>
                      <Text style={[
                        item.isOwn ? styles.reactionCountInsideOwn : styles.reactionCountInsideOther,
                        reaction.myReaction && (item.isOwn ? styles.reactionCountActiveInsideOwn : styles.reactionCountActiveInsideOther),
                      ]}>
                        {reaction.count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  const reactionsEqual = JSON.stringify(prevProps.item.reactions) === JSON.stringify(nextProps.item.reactions);
  return (
    prevProps.item.eventId === nextProps.item.eventId &&
    prevProps.item.content === nextProps.item.content &&
    prevProps.item.timestamp === nextProps.item.timestamp &&
    prevProps.item.imageUrl === nextProps.item.imageUrl &&
    prevProps.item.avatarUrl === nextProps.item.avatarUrl &&
    prevProps.showTimestamp === nextProps.showTimestamp &&
    prevProps.isFirstOfHour === nextProps.isFirstOfHour &&
    reactionsEqual
  );
});

MessageItemComponent.displayName = 'MessageItem';

// Helper function to get reactions for an event
const getReactionsForEvent = (room: Room, targetEventId: string, myUserId: string): ReactionData[] => {
  try {
    const relations = getEventReactions(room, targetEventId);
    if (!relations) return [];

    const sortedReactions = relations.getSortedAnnotationsByKey() || [];
    return sortedReactions.map(([key, eventsSet]) => {
      const events = Array.from(eventsSet);
      const myReaction = events.find(e => e.getSender() === myUserId);
      return {
        key: key as string,
        count: events.length,
        myReaction: !!myReaction,
      };
    }).filter(r => r.count > 0);
  } catch (error) {
    console.info('Error getting reactions:', error);
    return [];
  }
};


export function RoomTimeline({ room, eventId }: RoomTimelineProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const mx = getMatrixClient();
  const isInitialLoad = useRef(true);

  const mapEventToMessage = useCallback((event: MatrixEvent): MessageItem | null => {
    if (!mx || event.getType() !== 'm.room.message') return null;

    const content = event.getContent();
    const sender = event.getSender() || '';
    const senderMember = room.getMember(sender);
    const senderName = senderMember?.name || sender.split('@')[0]?.split(':')[0] || 'Unknown';
    const roomName = room.name || 'Unknown';
    const isOwn = sender === mx.getUserId() || roomName !== senderName;
    const avatarUrl = isOwn ? undefined: getMemberAvatarMxc(mx, room, sender) || getRoomAvatarUrl(mx, room, 96, true);

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
        imageUrl = mx.mxcUrlToHttp(mxcUrl, 400, 400, 'scale', undefined, false, true) || undefined;
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
    const reactions = getReactionsForEvent(room, currentEventId, mx.getUserId() || '');

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
  }, [mx, room]);

  const getEventFromMessage = () => {
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    
    const messageItems: MessageItem[] = events
      .map(mapEventToMessage)
      .filter((item): item is MessageItem => item !== null);
    return {messageItems, timeline};
  }

  const loadMessages = useCallback(async () => {
    if (!mx || !room) return;
    
    let {messageItems, timeline} = getEventFromMessage();

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
      const currentFirstMessageId = messages.length > 0 ? messages[0].eventId : null;

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
          const newIndex = messages.findIndex(m => m.eventId === currentFirstMessageId);
          if (newIndex >= 0) {
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
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
          flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
        }, 200);
      }
    }
  }, [eventId, messages]);

  // All hooks must be called before any conditional returns
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    // Check if user scrolled near the top (within 200px)
    if (contentOffset.y < 200 && canLoadMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [canLoadMore, loadingMore, loadMoreMessages]);

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
    []
  );

  // Reaction toggle handler
  const handleReactionToggle = useCallback(async (targetEventId: string, reactionKey: string) => {
    if (!mx) return;

    try {
      const relations = getEventReactions(room, targetEventId);
      const sortedReactions = relations?.getSortedAnnotationsByKey() || [];
      const [, reactionsSet] = sortedReactions.find(([k]) => k === reactionKey) || [];
      const reactions = reactionsSet ? Array.from(reactionsSet) : [];
      const myReaction = reactions.find(e => e.getSender() === mx.getUserId());

      if (myReaction && myReaction.isRelation()) {
        // Remove reaction
        await mx.redactEvent(room.roomId, myReaction.getId() || '');
      } else {
        // Add reaction
        await mx.sendEvent(
          room.roomId,
          MessageEvent.Reaction as any,
          getReactionContent(targetEventId, reactionKey)
        );
      }
      // Reload messages to update reactions
      loadMessages();
    } catch (error) {
      console.info('Error toggling reaction:', error);
    }
  }, [mx, room, loadMessages]);

  // Add reaction handler - accepts optional emoji
  const handleAddReaction = useCallback((targetEventId: string, emoji?: string) => {
    // Use provided emoji or default to 👍
    const reactionEmoji = emoji || '👍';
    handleReactionToggle(targetEventId, reactionEmoji);
  }, [handleReactionToggle]);

  // State for showing quick reactions modal
  const [quickReactionsEventId, setQuickReactionsEventId] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // State for showing timestamp on message tap
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Calculate which messages are first of their hour
  const firstOfHourIds = React.useMemo(() => {
    const ids = new Set<string>();
    let lastHour: number | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp);
      const msgHour = msgDate.getFullYear() * 1000000 + (msgDate.getMonth() + 1) * 10000 + msgDate.getDate() * 100 + msgDate.getHours();

      if (lastHour === null || msgHour !== lastHour) {
        ids.add(msg.eventId);
        lastHour = msgHour;
      }
    }

    return ids;
  }, [messages]);

  const handleBubblePress = useCallback((eventId: string) => {
    setSelectedMessageId(prev => prev === eventId ? null : eventId);
  }, []);

  const handleMessageLongPress = useCallback((targetEventId: string, getPosition: () => { x: number; y: number; width: number; height: number }) => {
    const position = getPosition();
    setModalPosition(position);
    setQuickReactionsEventId(targetEventId);
  }, []);

  const handleCloseQuickReactions = useCallback(() => {
    setQuickReactionsEventId(null);
    setModalPosition(null);
  }, []);

  const handleQuickReactionSelect = useCallback((emoji: string, targetEventId: string) => {
    handleAddReaction(targetEventId, emoji);
    setQuickReactionsEventId(null);
    setModalPosition(null);
  }, [handleAddReaction]);

  // Memoized render function
  const renderMessage = useCallback(({ item }: { item: MessageItem }) => {
    const handleLongPress = (getPosition: () => { x: number; y: number; width: number; height: number }) => {
      handleMessageLongPress(item.eventId, getPosition);
    };
    return (
      <MessageItemComponent
        item={item}
        onReactionPress={(key: string) => handleReactionToggle(item.eventId, key)}
        onLongPress={handleLongPress}
        onBubblePress={() => handleBubblePress(item.eventId)}
        showTimestamp={selectedMessageId === item.eventId}
        isFirstOfHour={firstOfHourIds.has(item.eventId)}
      />
    );
  }, [handleReactionToggle, handleMessageLongPress, handleBubblePress, selectedMessageId, firstOfHourIds]);

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
      
      {/* Quick Reactions Modal */}
      <Modal
        visible={quickReactionsEventId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseQuickReactions}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseQuickReactions}
        >
          <View style={styles.quickReactionsModalContainer} pointerEvents="box-none">
            {quickReactionsEventId && (
              <View 
                style={[
                  styles.quickReactionsPicker,
                  // eslint-disable-next-line react-native/no-inline-styles
                  modalPosition ? {
                    position: 'absolute',
                    top: Math.max(10, Math.min(modalPosition.y - 60, Dimensions.get('window').height - 100)),
                    left: 10,
                  } : styles.quickReactionsPickerCentered
                ]} 
                pointerEvents="auto"
              >
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.quickReactionButton}
                    onPress={() => {
                      handleQuickReactionSelect(emoji, quickReactionsEventId);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageOwn: {
    justifyContent: 'flex-end',
  },
  messageOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubbleWrapper: {
    maxWidth: '75%',
  },
  messageBubblePressed: {
    opacity: 0.95,
  },
  messageBubble: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  messageBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timestampRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 4,
  },
  messageImage: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageImageWithRatio: {
    maxWidth: 250,
    maxHeight: 300,
    width: '100%',
  },
  messageImageDefault: {
    width: 250,
    height: 200,
  },
  imageCaption: {
    marginTop: 8,
  },
  messageBubbleOwn: {
    backgroundColor: '#123660',
  },
  messageBubbleOther: {
    backgroundColor: '#1A1D24',
    shadowColor: 'rgba(12, 20, 40, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  messageTextOwn: {
    color: '#E4E7EB',
  },
  messageTextOther: {
    color: '#F3F4F6',
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
  reactionsInsideBubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 4,
    gap: 4,
    alignItems: 'center',
  },
  reactionButtonInsideOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 24,
    marginRight: 2,
  },
  reactionButtonInsideOther: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 24,
    marginRight: 2,
  },
  reactionButtonActiveInsideOwn: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderColor: '#FF6B35',
    borderWidth: 1.5,
  },
  reactionButtonActiveInsideOther: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: '#FF6B35',
    borderWidth: 1.5,
  },
  reactionEmojiInside: {
    fontSize: 16,
    marginRight: 4,
    lineHeight: 18,
  },
  reactionCountInsideOwn: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    minWidth: 14,
    textAlign: 'center',
  },
  reactionCountInsideOther: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    minWidth: 14,
    textAlign: 'center',
  },
  reactionCountActiveInsideOwn: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  reactionCountActiveInsideOther: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionsModalContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  quickReactionsPicker: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  quickReactionsPickerCentered: {
    alignSelf: 'center',
    marginTop: '50%',
  },
  quickReactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  quickReactionEmoji: {
    fontSize: 24,
  },
});

