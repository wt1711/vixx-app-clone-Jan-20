import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { MessageItem } from './types';
import { formatTimeWithDay, getInitials } from './utils';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      // Only animate for tap-triggered timestamps, not for first-of-hour
      if (!isFirstOfHour) {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(
            300,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.opacity,
          ),
        );

        Animated.timing(animatedOpacity, {
          toValue: showTimestamp ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [showTimestamp, animatedOpacity, isFirstOfHour]);

    const timeString = formatTimeWithDay(item.timestamp);
    const initials = getInitials(item.senderName);
    const imageStyle =
      item.imageInfo?.w && item.imageInfo?.h
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
        console.warn(
          '⚠️ Cannot measure: onLongPress=',
          !!onLongPress,
          'messageRef.current=',
          !!messageRef.current,
        );
      }
    };

    return (
      <View>
        {/* Timestamp shown above message when tapped or first of hour */}
        {shouldShowTimestamp && (
          <Animated.View
            style={[
              styles.timestampRow,
              isFirstOfHour ? { opacity: 1 } : { opacity: animatedOpacity },
            ]}
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
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
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
                item.isOwn
                  ? styles.messageBubbleOwn
                  : styles.messageBubbleOther,
              ]}
            >
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={80}
                reducedTransparencyFallbackColor={
                  item.isOwn ? '#123660' : '#1A1D24'
                }
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
                          item.isOwn
                            ? styles.messageTextOwn
                            : styles.messageTextOther,
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
                      item.isOwn
                        ? styles.messageTextOwn
                        : styles.messageTextOther,
                    ]}
                  >
                    {item.content}
                  </Text>
                )}

                {/* Reactions inside message bubble */}
                {item.reactions && item.reactions.length > 0 && (
                  <View
                    style={styles.reactionsInsideBubble}
                    pointerEvents="box-none"
                  >
                    {item.reactions.map(reaction => (
                      <TouchableOpacity
                        key={reaction.key}
                        style={[
                          item.isOwn
                            ? styles.reactionButtonInsideOwn
                            : styles.reactionButtonInsideOther,
                          reaction.myReaction &&
                            (item.isOwn
                              ? styles.reactionButtonActiveInsideOwn
                              : styles.reactionButtonActiveInsideOther),
                        ]}
                        onPress={() => onReactionPress?.(reaction.key)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.reactionEmojiInside,
                            reaction.count === 1 &&
                              styles.reactionEmojiInsideSingle,
                          ]}
                        >
                          {reaction.key}
                        </Text>
                        {reaction.count > 1 && (
                          <Text
                            style={[
                              item.isOwn
                                ? styles.reactionCountInsideOwn
                                : styles.reactionCountInsideOther,
                              reaction.myReaction &&
                                (item.isOwn
                                  ? styles.reactionCountActiveInsideOwn
                                  : styles.reactionCountActiveInsideOther),
                            ]}
                          >
                            {reaction.count}
                          </Text>
                        )}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    const reactionsEqual =
      JSON.stringify(prevProps.item.reactions) ===
      JSON.stringify(nextProps.item.reactions);
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
  },
);

MessageItemComponent.displayName = 'MessageItem';

const styles = StyleSheet.create({
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
    paddingHorizontal: 4,
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
    paddingHorizontal: 4,
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
    fontSize: 12,
    marginRight: 4,
    lineHeight: 14,
  },
  reactionEmojiInsideSingle: {
    marginRight: 0,
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
});
