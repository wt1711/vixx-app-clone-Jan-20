import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { MessageItem, ReactionData } from './types';
import { formatTimeWithDay } from '../../utils/timeFormatter';
import { getInitials } from '../../utils/stringUtils';

export type MessageItemProps = {
  item: MessageItem;
  onReactionPress?: (key: string) => void;
  onLongPress?: (
    getPosition: () => { x: number; y: number; width: number; height: number },
  ) => void;
  onBubblePress?: () => void;
  showTimestamp?: boolean;
  isFirstOfHour?: boolean;
};

// Sub-component for avatar display
const Avatar = ({
  avatarUrl,
  initials,
}: {
  avatarUrl?: string;
  initials: string;
}) => {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

// Sub-component for a single reaction button
const ReactionButton = ({
  reaction,
  isOwn,
  onPress,
}: {
  reaction: ReactionData;
  isOwn: boolean;
  onPress: () => void;
}) => {
  const buttonStyle = useMemo(() => {
    const baseStyle = isOwn
      ? styles.reactionButtonInsideOwn
      : styles.reactionButtonInsideOther;

    if (!reaction.myReaction) {
      return baseStyle;
    }

    const activeStyle = isOwn
      ? styles.reactionButtonActiveInsideOwn
      : styles.reactionButtonActiveInsideOther;

    return [baseStyle, activeStyle];
  }, [isOwn, reaction.myReaction]);

  const countStyle = useMemo(() => {
    const baseStyle = isOwn
      ? styles.reactionCountInsideOwn
      : styles.reactionCountInsideOther;

    if (!reaction.myReaction) {
      return baseStyle;
    }

    const activeStyle = isOwn
      ? styles.reactionCountActiveInsideOwn
      : styles.reactionCountActiveInsideOther;

    return [baseStyle, activeStyle];
  }, [isOwn, reaction.myReaction]);

  const emojiStyle =
    reaction.count > 1
      ? [styles.reactionEmojiInside, { marginRight: 2 }]
      : styles.reactionEmojiInside;

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.6}>
      <Text style={emojiStyle}>{reaction.key}</Text>
      {reaction.count > 1 && <Text style={countStyle}>{reaction.count}</Text>}
    </TouchableOpacity>
  );
};

// Sub-component for reactions list
const ReactionsList = ({
  reactions,
  isOwn,
  onReactionPress,
}: {
  reactions: ReactionData[];
  isOwn: boolean;
  onReactionPress?: (key: string) => void;
}) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  const containerStyle = [
    styles.reactionsContainer,
    isOwn ? styles.reactionsContainerOwn : styles.reactionsContainerOther,
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {reactions.map(reaction => (
        <ReactionButton
          key={reaction.key}
          reaction={reaction}
          isOwn={isOwn}
          onPress={() => onReactionPress?.(reaction.key)}
        />
      ))}
    </View>
  );
};

// Sub-component for message content (text or image)
const MessageContent = ({
  item,
  imageStyle,
}: {
  item: MessageItem;
  imageStyle: StyleProp<ImageStyle>;
}) => {
  const textStyle = [
    styles.messageText,
    item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];

  const isImageMessage = item.msgtype === 'm.image' && item.imageUrl;

  if (isImageMessage) {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={imageStyle}
          resizeMode="contain"
        />
        {item.content === '📷 Image' && (
          <Text style={[textStyle, styles.imageCaption]}>{item.content}</Text>
        )}
      </View>
    );
  }

  return <Text style={textStyle}>{item.content}</Text>;
};

export const MessageItemComponent = React.memo<MessageItemProps>(
  ({
    item,
    onReactionPress,
    onLongPress,
    onBubblePress,
    showTimestamp,
    isFirstOfHour,
  }) => {
    const messageRef = useRef<View>(null);
    const shouldShowTimestamp = showTimestamp || isFirstOfHour;
    const animatedOpacity = useRef(
      new Animated.Value(shouldShowTimestamp ? 1 : 0),
    ).current;

    useEffect(() => {
      if (isFirstOfHour) return;

      // Use only Animated.timing with native driver (no LayoutAnimation to avoid global jank)
      Animated.timing(animatedOpacity, {
        toValue: showTimestamp ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [showTimestamp, animatedOpacity, isFirstOfHour]);

    const timeString = formatTimeWithDay(item.timestamp);
    const initials = getInitials(item.senderName);

    const imageStyle = useMemo<StyleProp<ImageStyle>>(() => {
      const { w, h } = item.imageInfo ?? {};
      if (w && h) {
        return [
          styles.messageImage,
          styles.messageImageWithRatio,
          { aspectRatio: w / h, maxWidth: 250 },
        ];
      }
      return [styles.messageImage, styles.messageImageDefault];
    }, [item.imageInfo]);

    const containerStyle: StyleProp<ViewStyle> = [
      styles.messageContainer,
      item.isOwn ? styles.messageOwn : styles.messageOther,
    ];

    const bubbleStyle: StyleProp<ViewStyle> = [
      styles.messageBubble,
      item.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
    ];

    const blurFallbackColor = item.isOwn ? '#123660' : '#1A1D24';

    const timestampStyle: StyleProp<ViewStyle> = [
      styles.timestampRow,
      { opacity: isFirstOfHour ? 1 : animatedOpacity },
    ];

    const handleLongPress = () => {
      if (!onLongPress || !messageRef.current) {
        console.warn(
          '⚠️ Cannot measure: onLongPress=',
          !!onLongPress,
          'messageRef.current=',
          !!messageRef.current,
        );
        return;
      }

      messageRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        onLongPress(() => ({ x: pageX, y: pageY, width, height }));
      });
    };

    return (
      <View>
        {shouldShowTimestamp && (
          <Animated.View style={timestampStyle}>
            <Text style={styles.timestampText}>{timeString}</Text>
          </Animated.View>
        )}

        <View ref={messageRef} style={containerStyle}>
          {!item.isOwn && (
            <View style={styles.avatarContainer}>
              <Avatar avatarUrl={item.avatarUrl} initials={initials} />
            </View>
          )}

          <Pressable
            onPress={onBubblePress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            style={styles.messageBubbleWrapper}
          >
            <View style={bubbleStyle}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={80}
                reducedTransparencyFallbackColor={blurFallbackColor}
              />
              <View style={styles.messageBubbleContent}>
                <MessageContent item={item} imageStyle={imageStyle} />
              </View>
            </View>
            <ReactionsList
              reactions={item.reactions ?? []}
              isOwn={item.isOwn}
              onReactionPress={onReactionPress}
            />
          </Pressable>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Fast path: check simple properties first
    if (
      prevProps.item.eventId !== nextProps.item.eventId ||
      prevProps.item.content !== nextProps.item.content ||
      prevProps.item.timestamp !== nextProps.item.timestamp ||
      prevProps.item.imageUrl !== nextProps.item.imageUrl ||
      prevProps.item.avatarUrl !== nextProps.item.avatarUrl ||
      prevProps.showTimestamp !== nextProps.showTimestamp ||
      prevProps.isFirstOfHour !== nextProps.isFirstOfHour
    ) {
      return false;
    }

    // Same reference means equal (fast path)
    if (prevProps.item.reactions === nextProps.item.reactions) {
      return true;
    }

    // Shallow comparison for reactions (avoid JSON.stringify)
    const prevReactions = prevProps.item.reactions ?? [];
    const nextReactions = nextProps.item.reactions ?? [];

    if (prevReactions.length !== nextReactions.length) {
      return false;
    }

    return prevReactions.every((r, i) => {
      const next = nextReactions[i];
      return (
        r.key === next?.key &&
        r.count === next?.count &&
        r.myReaction === next?.myReaction
      );
    });
  },
);

MessageItemComponent.displayName = 'MessageItem';

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 18,
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
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    bottom: -10,
    gap: 2,
    alignItems: 'center',
  },
  reactionsContainerOwn: {
    left: 8,
  },
  reactionsContainerOther: {
    left: 8,
  },
  reactionButtonInsideOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(60, 60, 70, 0.95)',
    minHeight: 20,
    minWidth: 20,
  },
  reactionButtonInsideOther: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(60, 60, 70, 0.95)',
    minHeight: 20,
    minWidth: 20,
  },
  reactionButtonActiveInsideOwn: {
    backgroundColor: 'rgba(80, 80, 90, 0.95)',
  },
  reactionButtonActiveInsideOther: {
    backgroundColor: 'rgba(80, 80, 90, 0.95)',
  },
  reactionEmojiInside: {
    fontSize: 10,
    marginRight: 0,
    lineHeight: 14,
  },
  reactionEmojiInsideSingle: {
    marginRight: 0,
  },
  reactionCountInsideOwn: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginLeft: 2,
  },
  reactionCountInsideOther: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginLeft: 2,
  },
  reactionCountActiveInsideOwn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reactionCountActiveInsideOther: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
