import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Reply } from 'lucide-react-native';
import { MessageItem } from '../types';
import { ReplyPreview } from './ReplyPreview';
import { colors } from '../../../theme';

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😠', '👍'];

export type ModalPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QuickReactionsModalProps = {
  visible: boolean;
  messageItem: MessageItem | null;
  position: ModalPosition | null;
  onClose: () => void;
  onSelectEmoji: (emoji: string, eventId: string) => void;
  onReply?: () => void;
};

export function QuickReactionsModal({
  visible,
  messageItem,
  position,
  onClose,
  onSelectEmoji,
  onReply,
}: QuickReactionsModalProps) {
  if (!messageItem) return null;

  const handleEmojiPress = (emoji: string) => {
    onSelectEmoji(emoji, messageItem.eventId);
  };

  const handleReplyPress = () => {
    if (onReply) {
      onReply();
    }
  };

  const isImageMessage =
    messageItem.msgtype === 'm.image' && messageItem.imageUrl;
  const blurFallbackColor = messageItem.isOwn
    ? colors.message.own
    : colors.message.other;

  // Calculate vertical position based on message position
  // Reactions row is ~64px, gap is 8px, so we position above the message
  const REACTIONS_HEIGHT = 64;
  const GAP = 8;
  const MIN_TOP = 60; // Minimum distance from top of screen
  const screenHeight = Dimensions.get('window').height;

  const contentTop = useMemo(() => {
    if (!position) return MIN_TOP;
    // Position so the message aligns with original, reactions above it
    const desiredTop = position.y - REACTIONS_HEIGHT - GAP;
    // Clamp to keep within screen bounds
    return Math.max(MIN_TOP, Math.min(desiredTop, screenHeight - 300));
  }, [position, screenHeight]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Background overlay - tappable to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor={colors.background.black}
            />
            <View style={styles.overlayTint} />
          </View>
        </TouchableWithoutFeedback>

        {/* Content - not tappable to close */}
        <View
          style={[styles.modalContent, { marginTop: contentTop }]}
          pointerEvents="box-none"
        >
          {/* Reactions Section */}
          <View
            style={[
              styles.reactionsSection,
              messageItem.isOwn && styles.alignEnd,
            ]}
          >
            {QUICK_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.quickReactionButton}
                onPress={() => handleEmojiPress(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message Section - mirrors original MessageItem layout */}
          <View>
            {/* Reply preview above message */}
            {messageItem.replyTo && (
              <View
                style={[
                  styles.replyPreviewContainer,
                  messageItem.isOwn
                    ? styles.replyPreviewOwn
                    : styles.replyPreviewOther,
                ]}
              >
                <ReplyPreview
                  replyTo={messageItem.replyTo}
                  isOwn={messageItem.isOwn}
                />
              </View>
            )}

            {/* Message container */}
            <View
              style={[
                styles.messageContainer,
                messageItem.isOwn ? styles.messageOwn : styles.messageOther,
              ]}
            >
              <View style={styles.messageBubbleWrapper}>
                <View
                  style={[
                    styles.messageBubble,
                    messageItem.isOwn
                      ? styles.messageBubbleOwn
                      : styles.messageBubbleOther,
                  ]}
                >
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="dark"
                    blurAmount={80}
                    reducedTransparencyFallbackColor={blurFallbackColor}
                  />
                  <View style={styles.messageBubbleContent}>
                    {isImageMessage ? (
                      <Image
                        source={{ uri: messageItem.imageUrl }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.messageText,
                          messageItem.isOwn
                            ? styles.messageTextOwn
                            : styles.messageTextOther,
                        ]}
                      >
                        {messageItem.content}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Actions Menu */}
          <View
            style={[
              styles.actionsSection,
              messageItem.isOwn && styles.alignEnd,
            ]}
          >
            <Text style={styles.actionsTimestamp}>
              {new Date(messageItem.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleReplyPress}
              activeOpacity={0.7}
            >
              <Reply size={22} color={colors.text.primary} />
              <Text style={styles.actionLabel}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlayTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.transparent.black30,
  },
  modalContent: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  alignEnd: {
    alignSelf: 'flex-end',
  },
  reactionsSection: {
    flexDirection: 'row',
    backgroundColor: colors.message.other,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  quickReactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  // Message styles - mirroring MessageItem.styles.ts
  replyPreviewContainer: {
    marginBottom: 4,
    maxWidth: '75%',
  },
  replyPreviewOwn: {
    alignSelf: 'flex-end',
  },
  replyPreviewOther: {
    alignSelf: 'flex-start',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageOwn: {
    justifyContent: 'flex-end',
  },
  messageOther: {
    justifyContent: 'flex-start',
  },
  messageBubbleWrapper: {
    maxWidth: '75%',
  },
  messageBubble: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  messageBubbleOwn: {
    backgroundColor: colors.message.own,
  },
  messageBubbleOther: {
    backgroundColor: colors.message.other,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  messageBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  messageTextOwn: {
    color: colors.text.messageOwn,
  },
  messageTextOther: {
    color: colors.text.messageOther,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 16,
  },
  // Actions styles
  actionsSection: {
    backgroundColor: colors.message.other,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  actionsTimestamp: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 16,
  },
  actionLabel: {
    fontSize: 17,
    color: colors.text.primary,
  },
});
