import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Reply } from 'lucide-react-native';
import { BlurView } from '@react-native-community/blur';
import { MessageItem } from '../types';
import { formatTimeWithDay } from '../../../utils/timeFormatter';
import { Avatar } from '../../common/Avatar';
import { ReactionsList } from './Reactions';
import { ReplyPreview } from './ReplyPreview';
import { styles } from './MessageItem.styles';
import { colors } from '../../../theme';

export type MessageItemProps = {
  item: MessageItem;
  onReactionPress?: (key: string) => void;
  onLongPress?: (
    getPosition: () => { x: number; y: number; width: number; height: number },
  ) => void;
  onBubblePress?: () => void;
  onReply?: () => void;
  showTimestamp?: boolean;
  isFirstOfHour?: boolean;
};

function areReactionsEqual(
  prev: MessageItemProps['item']['reactions'],
  next: MessageItemProps['item']['reactions'],
): boolean {
  if (prev === next) return true;

  const a = prev ?? [];
  const b = next ?? [];

  if (a.length !== b.length) return false;

  return a.every(
    (r, i) =>
      r.key === b[i]?.key &&
      r.count === b[i]?.count &&
      r.myReaction === b[i]?.myReaction,
  );
}

function isMessageItemEqual(
  prev: MessageItemProps,
  next: MessageItemProps,
): boolean {
  const { item: prevItem, ...prevRest } = prev;
  const { item: nextItem, ...nextRest } = next;

  // Check top-level props
  if (
    prevRest.showTimestamp !== nextRest.showTimestamp ||
    prevRest.isFirstOfHour !== nextRest.isFirstOfHour
  ) {
    return false;
  }

  // Check item scalar fields
  if (
    prevItem.eventId !== nextItem.eventId ||
    prevItem.content !== nextItem.content ||
    prevItem.timestamp !== nextItem.timestamp ||
    prevItem.imageUrl !== nextItem.imageUrl ||
    prevItem.avatarUrl !== nextItem.avatarUrl
  ) {
    return false;
  }

  // Check replyTo
  if (prevItem.replyTo?.eventId !== nextItem.replyTo?.eventId) {
    return false;
  }

  // Check reactions (reference equality first, then shallow compare)
  return areReactionsEqual(prevItem.reactions, nextItem.reactions);
}

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

const SWIPE_THRESHOLD = 60;

export const MessageItemComponent = React.memo<MessageItemProps>(
  ({
    item,
    onReactionPress,
    onLongPress,
    onBubblePress,
    onReply,
    showTimestamp,
    isFirstOfHour,
  }) => {
    const messageRef = useRef<View>(null);
    const shouldShowTimestamp = showTimestamp || isFirstOfHour;
    const animatedOpacity = useRef(
      new Animated.Value(shouldShowTimestamp ? 1 : 0),
    ).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const replyIconOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isFirstOfHour) return;

      Animated.timing(animatedOpacity, {
        toValue: showTimestamp ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [showTimestamp, animatedOpacity, isFirstOfHour]);

    const timeString = formatTimeWithDay(item.timestamp);

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

    const blurFallbackColor = item.isOwn ? colors.message.own : colors.message.other;
    const isImageMessage = item.msgtype === 'm.image' && item.imageUrl;

    const contentStyle: StyleProp<ViewStyle> = [
      styles.messageBubbleContent,
      isImageMessage && styles.messageBubbleContentImage,
    ];

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

    // Swipe gesture for reply
    const swipeGesture = Gesture.Pan()
      .activeOffsetX(20)
      .failOffsetY([-20, 20])
      .onUpdate((event) => {
        // Only allow right swipe, cap at threshold
        const clampedX = Math.min(Math.max(event.translationX, 0), SWIPE_THRESHOLD);
        translateX.setValue(clampedX);

        // Show reply icon as user swipes
        const opacity = Math.min(clampedX / SWIPE_THRESHOLD, 1);
        replyIconOpacity.setValue(opacity);
      })
      .onEnd((event) => {
        if (event.translationX >= SWIPE_THRESHOLD && onReply) {
          onReply();
        }

        // Animate back to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .runOnJS(true);

    return (
      <View>
        {shouldShowTimestamp && (
          <Animated.View style={timestampStyle}>
            <Text style={styles.timestampText}>{timeString}</Text>
          </Animated.View>
        )}

        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={{ transform: [{ translateX }] }}>
            {/* Reply icon that appears when swiping */}
            <Animated.View
              style={[
                styles.replyIconContainer,
                item.isOwn ? styles.replyIconOwn : styles.replyIconOther,
                { opacity: replyIconOpacity },
              ]}
            >
              <Reply size={20} color={colors.accent.primary} />
            </Animated.View>

            <View ref={messageRef} style={containerStyle}>
              {!item.isOwn && (
                <View style={styles.avatarContainer}>
                  <Avatar avatarUrl={item.avatarUrl} name={item.senderName} />
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
                  <View style={contentStyle}>
                    {item.replyTo && (
                      <ReplyPreview replyTo={item.replyTo} isOwn={item.isOwn} />
                    )}
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
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
  isMessageItemEqual,
);

MessageItemComponent.displayName = 'MessageItem';
