import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { MessageItem } from 'src/components/room/types';
import { formatTimeWithDay } from 'src/utils/timeFormatter';
import { ReactionsList } from 'src/components/room/message/Reactions';
import {
  GifMessage,
  ImageMessage,
  ReplyPreview,
  InstagramImageMessage,
  InstagramStoryReplyMessage,
  InstagramVideoMessage,
  MessageTextWithLinks,
  VideoMessage,
} from 'src/components/room/message/variants';
import { styles } from 'src/components/room/message/MessageItem.styles';
import {
  getInstagramUrl,
  getInstagramStoryReplyData,
} from 'src/utils/urlParser';
import { getMessageVariant, MessageVariant } from 'src/utils/message';
import { isMessageItemEqual } from 'src/components/room/message/MessageItem.utils';

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

type MessageContentProps = {
  item: MessageItem;
  variant: MessageVariant;
  onImagePress?: (imageUrl: string) => void;
  onVideoPress?: (videoUrl: string) => void;
  onLongPress?: () => void;
};

const MessageContent = ({
  item,
  variant,
  onImagePress,
  onVideoPress,
  onLongPress,
}: MessageContentProps) => {
  const textStyle = [
    styles.messageText,
    item.isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];

  switch (variant) {
    case 'instagram-story-reply': {
      const instagramUrl = getInstagramUrl(item.content)!;
      const storyData = getInstagramStoryReplyData(item.content)!;
      return (
        <InstagramStoryReplyMessage
          instagramUrl={instagramUrl}
          imageUrl={item.imageUrl!}
          isOwn={item.isOwn}
          replyTo={storyData.replyTo}
          replyContent={storyData.replyContent}
          onLongPress={onLongPress}
        />
      );
    }

    case 'instagram-image': {
      const instagramUrl = getInstagramUrl(item.content)!;
      return (
        <InstagramImageMessage
          instagramUrl={instagramUrl}
          imageUrl={item.imageUrl!}
          isOwn={item.isOwn}
          onImagePress={onImagePress}
          onLongPress={onLongPress}
        />
      );
    }

    case 'instagram-video': {
      const instagramUrl = getInstagramUrl(item.content)!;
      return (
        <InstagramVideoMessage
          instagramUrl={instagramUrl}
          item={item}
          textStyle={textStyle}
          onVideoPress={onVideoPress}
          onLongPress={onLongPress}
        />
      );
    }

    case 'gif':
      return (
        <GifMessage
          imageUrl={item.imageUrl!}
          imageInfo={item.imageInfo}
          isOwn={item.isOwn}
          onImagePress={onImagePress}
          onLongPress={onLongPress}
        />
      );

    case 'image':
      return (
        <ImageMessage
          imageUrl={item.imageUrl!}
          imageInfo={item.imageInfo}
          content={item.content}
          isOwn={item.isOwn}
          onImagePress={onImagePress}
          onLongPress={onLongPress}
        />
      );

    case 'video':
      return (
        <VideoMessage
          item={item}
          onVideoPress={onVideoPress}
          onLongPress={onLongPress}
          textStyle={textStyle}
          isGift={(item.videoInfo?.['fi.mau.gif'] as boolean) ?? false}
        />
      );

    default:
      return (
        <MessageTextWithLinks
          content={item.content}
          isOwn={item.isOwn}
          onLongPress={onLongPress}
        />
      );
  }
};

export const MessageItemComponent = React.memo<MessageItemProps>(
  ({
    item,
    onReactionPress,
    onLongPress,
    onBubblePress,
    onReplyPreviewPress,
    onImagePress,
    onVideoPress,
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

    const variant = getMessageVariant(item);
    const timeString = formatTimeWithDay(item.timestamp);

    const containerStyle: StyleProp<ViewStyle> = [
      styles.messageContainer,
      item.isOwn ? styles.messageOwn : styles.messageOther,
    ];

    const bubbleStyle: StyleProp<ViewStyle> = [
      styles.messageBubble,
      item.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
      (variant === 'video' || variant === 'gif') && styles.messageBubbleVideo,
      variant.startsWith('instagram') && styles.messageBubbleInstagramStory,
    ];

    const contentStyle: StyleProp<ViewStyle> = [
      styles.messageBubbleContent,
      variant === 'image' && styles.messageBubbleContentImage,
      (variant === 'video' || variant === 'gif') &&
        styles.messageBubbleContentVideo,
      variant === 'instagram-story-reply' && styles.messageBubbleContentImage,
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
                    variant={variant}
                    onImagePress={onImagePress}
                    onVideoPress={onVideoPress}
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
