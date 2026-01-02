import React, { useEffect, useRef, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { MessageItem } from '../types';
import { formatTimeWithDay } from '../../../utils/timeFormatter';
import { Avatar } from '../../common/Avatar';
import { ReactionsList } from './Reactions';
import { ReplyPreview } from './ReplyPreview';
import { LinkPreview } from './LinkPreview';
import { styles } from './MessageItem.styles';
import { colors } from '../../../theme';
import { MsgType } from '../../../types/matrix/room';
import { parseTextWithUrls, getFirstUrl, getInstagramUrl } from '../../../utils/urlParser';
import { InstagramImageMessage } from './InstagramImageMessage';
import { isVideoUrl } from '../../../hooks/useLinkPreview';

export type MessageItemProps = {
  item: MessageItem;
  onReactionPress?: (key: string) => void;
  onLongPress?: (
    getPosition: () => { x: number; y: number; width: number; height: number },
  ) => void;
  onBubblePress?: () => void;
  onReplyPreviewPress?: (eventId: string) => void;
  onImagePress?: (imageUrl: string) => void;
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

const MessageTextWithLinks = ({
  content,
  isOwn,
  onLongPress,
}: {
  content: string;
  isOwn: boolean;
  onLongPress?: () => void;
}) => {
  const textStyle = [
    styles.messageText,
    isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];
  const linkStyle = [
    styles.messageText,
    isOwn ? styles.messageTextOwn : styles.messageTextOther,
    styles.linkText,
  ];

  const parts = useMemo(() => parseTextWithUrls(content), [content]);
  const firstUrl = useMemo(() => getFirstUrl(content), [content]);
  const isVideo = firstUrl ? isVideoUrl(firstUrl) : false;

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  // Check if message is only a video URL (with optional whitespace)
  const isVideoOnly = isVideo && content.trim() === firstUrl;

  // For video-only messages, just show the preview
  if (isVideoOnly && firstUrl) {
    return <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />;
  }

  return (
    <View>
      <Text style={textStyle}>
        {parts.map((part, index) => {
          // Hide video URLs in text, only show preview
          if (part.type === 'url' && isVideoUrl(part.content)) {
            return null;
          }
          return part.type === 'url' ? (
            <Text
              key={index}
              style={linkStyle}
              onPress={() => handleLinkPress(part.content)}
            >
              {part.content}
            </Text>
          ) : (
            <Text key={index}>{part.content}</Text>
          );
        })}
      </Text>
      {firstUrl && <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />}
    </View>
  );
};

const MessageContent = ({
  item,
  imageStyle,
  onImagePress,
  onLongPress,
}: {
  item: MessageItem;
  imageStyle: StyleProp<ImageStyle>;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
}) => {
  const textStyle = [
    styles.messageText,
    item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];

  const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;
  const instagramUrl = isImageMessage ? getInstagramUrl(item.content) : null;

  // Instagram image: show clickable URL above the image
  if (isImageMessage && instagramUrl) {
    return (
      <InstagramImageMessage
        instagramUrl={instagramUrl}
        imageUrl={item.imageUrl!}
        imageStyle={imageStyle}
        isOwn={item.isOwn}
        onImagePress={onImagePress}
        onLongPress={onLongPress}
      />
    );
  }

  if (isImageMessage) {
    return (
      <Pressable
        style={styles.imageContainer}
        onPress={() => onImagePress?.(item.imageUrl!)}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={imageStyle}
          resizeMode="contain"
        />
        {item.content === '📷 Image' && (
          <Text style={[textStyle, styles.imageCaption]}>{item.content}</Text>
        )}
      </Pressable>
    );
  }

  return <MessageTextWithLinks content={item.content} isOwn={item.isOwn} onLongPress={onLongPress} />;
};

export const MessageItemComponent = React.memo<MessageItemProps>(
  ({
    item,
    onReactionPress,
    onLongPress,
    onBubblePress,
    onReplyPreviewPress,
    onImagePress,
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
    const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;

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

    return (
      <View>
        {shouldShowTimestamp && (
          <Animated.View style={timestampStyle}>
            <Text style={styles.timestampText}>{timeString}</Text>
          </Animated.View>
        )}

        {/* Reply preview above message - sizes to its own content */}
        {item.replyTo && (
          <View
            style={[
              styles.replyPreviewContainer,
              item.isOwn ? styles.replyPreviewOwn : styles.replyPreviewOther,
            ]}
          >
            <ReplyPreview
              replyTo={item.replyTo}
              isOwn={item.isOwn}
              onPress={
                onReplyPreviewPress
                  ? () => onReplyPreviewPress(item.replyTo!.eventId)
                  : undefined
              }
            />
          </View>
        )}

        <View ref={messageRef} style={containerStyle}>
          {!item.isOwn && (
            <View style={styles.avatarContainer}>
              <Avatar avatarUrl={item.avatarUrl} name={item.senderName} />
            </View>
          )}

          <View style={styles.messageBubbleWrapper}>
            <Pressable
              onPress={onBubblePress}
              onLongPress={handleLongPress}
              delayLongPress={500}
            >
              <View style={bubbleStyle}>
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={80}
                  reducedTransparencyFallbackColor={blurFallbackColor}
                />
                <View style={contentStyle}>
                  <MessageContent item={item} imageStyle={imageStyle} onImagePress={onImagePress} onLongPress={handleLongPress} />
                </View>
              </View>
            </Pressable>
            <ReactionsList
              reactions={item.reactions ?? []}
              isOwn={item.isOwn}
              onReactionPress={onReactionPress}
            />
          </View>
        </View>
      </View>
    );
  },
  isMessageItemEqual,
);

MessageItemComponent.displayName = 'MessageItem';
