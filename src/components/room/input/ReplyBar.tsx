import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from 'src/config';
import { MsgType } from 'src/types/matrix';

export type ReplyPreviewInput = {
  content: string;
  msgtype?: string;
};

export function getReplyPreviewText(reply: ReplyPreviewInput): string {
  switch (reply.msgtype) {
    case MsgType.Image:
      if (reply.content === 'image.gif') return 'GIF';
      return 'Photo';
    case MsgType.Video:
      return 'Video';
    default:
      return reply.content;
  }
}

type ReplyBarProps = {
  reply: ReplyPreviewInput;
  onClose: () => void;
  animatedStyle: {
    maxHeight: Animated.AnimatedInterpolation<number>;
    opacity: Animated.Value;
    marginBottom: Animated.AnimatedInterpolation<number>;
  };
};

export function ReplyBar({ reply, onClose, animatedStyle }: ReplyBarProps) {
  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <View style={styles.bar}>
        <View style={styles.content}>
          <View style={styles.indicator} />
          <View style={styles.textContainer}>
            <Text style={styles.label}>Replying to</Text>
            <Text style={styles.message} numberOfLines={1}>
              {getReplyPreviewText(reply)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color={colors.text.secondary} size={18} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.transparent.inputBar,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 3,
    height: 32,
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
