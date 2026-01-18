import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Image,
  Dimensions,
  StyleProp,
  TextStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Reply, Plus, Trash2 } from 'lucide-react-native';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { MessageItem } from '../types';
import { ReplyPreview } from './variants';
import { colors } from '../../../theme';
import { MsgType } from '../../../types/matrix/room';
import { getMatrixClient } from '../../../matrixClient';

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😠', '👍'];

type MessageContentPreviewProps = {
  messageItem: MessageItem;
  textStyle: StyleProp<TextStyle>;
};

const MessageContentPreview = ({
  messageItem,
  textStyle,
}: MessageContentPreviewProps) => {
  const isImageMessage =
    messageItem.msgtype === MsgType.Image && messageItem.imageUrl;
  const isVideoMessage =
    messageItem.msgtype === MsgType.Video &&
    (messageItem.videoThumbnailUrl || messageItem.videoUrl);

  if (isImageMessage) {
    return (
      <Image
        source={{ uri: messageItem.imageUrl }}
        style={styles.messageImage}
        resizeMode="cover"
      />
    );
  }

  if (isVideoMessage) {
    return <Text style={textStyle}>Video</Text>;
  }

  return <Text style={textStyle}>{messageItem.content}</Text>;
};

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
  onDelete?: () => void;
};

export function QuickReactionsModal({
  visible,
  messageItem,
  position,
  onClose,
  onSelectEmoji,
  onReply,
  onDelete,
}: QuickReactionsModalProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mx = getMatrixClient();
  const myUserId = mx?.getUserId();

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

  // Check if the current user can delete this message
  const canDelete = useMemo(() => {
    if (!messageItem || !myUserId) return false;
    // Can only delete messages sent through VIXX and that have been sent (eventId starts with $)
    return (
      messageItem.sender === myUserId && messageItem.eventId.startsWith('$')
    );
  }, [messageItem, myUserId]);

  if (!messageItem) return null;

  const handleEmojiPress = (emoji: string) => {
    onSelectEmoji(emoji, messageItem.eventId);
  };

  const handleMoreEmojisPress = () => {
    setShowEmojiPicker(true);
  };

  const handleEmojiPickerSelect = (emoji: string) => {
    onSelectEmoji(emoji, messageItem.eventId);
    setShowEmojiPicker(false);
  };

  const handleReplyPress = () => {
    if (onReply) {
      onReply();
    }
  };

  const handleDeletePress = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const blurFallbackColor = messageItem.isOwn
    ? colors.message.own
    : colors.message.other;

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
            <TouchableOpacity
              style={styles.moreEmojisButton}
              onPress={handleMoreEmojisPress}
              activeOpacity={0.7}
            >
              <Plus size={24} color={colors.text.primary} />
            </TouchableOpacity>
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
                    <MessageContentPreview
                      messageItem={messageItem}
                      textStyle={[
                        styles.messageText,
                        messageItem.isOwn
                          ? styles.messageTextOwn
                          : styles.messageTextOther,
                      ]}
                    />
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
            {canDelete && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleDeletePress}
                activeOpacity={0.7}
              >
                <Trash2 size={22} color={colors.status.error} />
                <Text style={styles.actionLabelDelete}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <EmojiPicker
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelected={(emoji: EmojiType) =>
            handleEmojiPickerSelect(emoji.emoji)
          }
          enableSearchBar
          categoryPosition="top"
          enableRecentlyUsed
          defaultHeight="60%"
          expandedHeight="85%"
          theme={{
            backdrop: colors.transparent.black60,
            knob: colors.transparent.white30,
            container: colors.background.secondary,
            header: colors.text.secondary,
            category: {
              icon: colors.text.secondary,
              iconActive: colors.text.primary,
              container: colors.background.secondary,
              containerActive: colors.transparent.white15,
            },
            search: {
              text: colors.text.primary,
              placeholder: colors.text.placeholder,
              icon: colors.text.secondary,
              background: colors.transparent.white10,
            },
          }}
        />
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
  moreEmojisButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.white15,
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
  actionLabelDelete: {
    fontSize: 17,
    color: colors.status.error,
  },
});
