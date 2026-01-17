import React, { useEffect, useRef, useMemo } from 'react';
import {
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
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { MessageItem } from '../types';
import { formatTimeWithDay } from '../../../utils/timeFormatter';
import { ReactionsList } from './Reactions';
import { ReplyPreview } from './ReplyPreview';
import { LinkPreview } from './LinkPreview';
import { styles } from './MessageItem.styles';
import { colors } from '../../../theme';
import { MsgType } from '../../../types/matrix/room';
import {
  parseTextWithUrls,
  getFirstUrl,
  getInstagramUrl,
  getInstagramStoryReplyData,
} from '../../../utils/urlParser';
import { InstagramImageMessage } from './InstagramImageMessage';
import { InstagramStoryReplyMessage } from './InstagramStoryReplyMessage';
import { isVideoUrl } from '../../../hooks/useLinkPreview';
import { Instagram } from 'lucide-react-native';
import { VideoMessage } from './VideoMessage';

export type MessageItemProps = {
  item: MessageItem;
  onReactionPress?: (key: string) => void;
  onLongPress?: (
    getPosition: () => { x: number; y: number; width: number; height: number },
  ) => void;
  onBubblePress?: () => void;
  onReplyPreviewPress?: (eventId: string) => void;
  onImagePress?: (imageUrl: string) => void;
  onVideoPress?: (videoUrl: string) => void;
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
    return (
      <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />
    );
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
      {firstUrl && (
        <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />
      )}
    </View>
  );
};

const MessageContent = ({
  item,
  imageStyle,
  onImagePress,
  onVideoPress,
  onLongPress,
}: {
  item: MessageItem;
  imageStyle: StyleProp<ImageStyle>;
  onImagePress?: (imageUrl: string) => void;
  onVideoPress?: (videoUrl: string) => void;
  onLongPress?: () => void;
}) => {
  const textStyle = [
    styles.messageText,
    item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];

  const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;
  const isVideoMessage = item.msgtype === MsgType.Video && item.videoUrl;

  // Check for Instagram URL in content (for stories, posts, reels, etc.)
  // This works for both image and video messages that contain Instagram URLs
  const instagramUrl = getInstagramUrl(item.content);
  const instagramStoryReplyData = instagramUrl
    ? getInstagramStoryReplyData(item.content)
    : null;

  // Instagram story reply: show story reply UI
  if (isImageMessage && instagramUrl && instagramStoryReplyData) {
    return (
      <InstagramStoryReplyMessage
        instagramUrl={instagramUrl}
        imageUrl={item.imageUrl!}
        isOwn={item.isOwn}
        replyTo={instagramStoryReplyData.replyTo}
        replyContent={instagramStoryReplyData.replyContent}
        onLongPress={onLongPress}
      />
    );
  }

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

  if (isVideoMessage) {
    // If video has Instagram URL, show it above the video
    if (instagramUrl) {
      return (
        <View>
          <Pressable
            onPress={() => Linking.openURL(instagramUrl).catch(() => {})}
            style={styles.instagramUrlContainer}
          >
            <Instagram size={16} color={colors.accent.instagram} />
            <Text style={textStyle} numberOfLines={1}>
              View on Instagram
            </Text>
          </Pressable>
          <VideoMessage
            item={item}
            onVideoPress={onVideoPress}
            onLongPress={onLongPress}
            textStyle={textStyle}
          />
        </View>
      );
    }
    return (
      <VideoMessage
        item={item}
        onVideoPress={onVideoPress}
        onLongPress={onLongPress}
        textStyle={textStyle}
        isGift={(item.videoInfo?.['fi.mau.gif'] as boolean) ?? false}
      />
    );
  }

  return (
    <MessageTextWithLinks
      content={item.content}
      isOwn={item.isOwn}
      onLongPress={onLongPress}
    />
  );
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
      const shapeStyle = item.isOwn
        ? styles.messageImageOwn
        : styles.messageImageOther;
      if (w && h) {
        return [
          styles.messageImage,
          shapeStyle,
          styles.messageImageWithRatio,
          { aspectRatio: w / h, maxWidth: 250 },
        ];
      }
      return [styles.messageImage, shapeStyle, styles.messageImageDefault];
    }, [item.imageInfo, item.isOwn]);

    const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;
    const isVideoMessage = item.msgtype === MsgType.Video && item.videoUrl;

    const containerStyle: StyleProp<ViewStyle> = [
      styles.messageContainer,
      item.isOwn ? styles.messageOwn : styles.messageOther,
    ];

    const bubbleStyle: StyleProp<ViewStyle> = [
      styles.messageBubble,
      item.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
      isVideoMessage && styles.messageBubbleVideo,
    ];

    const contentStyle: StyleProp<ViewStyle> = [
      styles.messageBubbleContent,
      isImageMessage && styles.messageBubbleContentImage,
      isVideoMessage && styles.messageBubbleContentVideo,
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

      // Trigger haptic feedback on long press
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

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
          <View style={styles.messageBubbleWrapper}>
            <Pressable
              onPress={onBubblePress}
              onLongPress={handleLongPress}
              delayLongPress={500}
            >
              <View style={bubbleStyle}>
                <View style={contentStyle}>
                  <MessageContent
                    item={item}
                    imageStyle={imageStyle}
                    onImagePress={onImagePress}
                    onLongPress={handleLongPress}
                  />
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
