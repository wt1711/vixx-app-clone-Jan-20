import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { ReplyToData } from '../../types';
import { colors } from '../../../../theme';

export type ReplyPreviewProps = {
  replyTo: ReplyToData;
  isOwn: boolean;
  onPress?: () => void;
};

export const ReplyPreview = React.memo<ReplyPreviewProps>(
  ({ replyTo, isOwn, onPress }) => {
    // Determine the label based on who is replying to whom
    const label = isOwn ? 'You replied' : 'Replied to';

    // Bubble style matches the original message (based on replyTo.isOwn)
    const bubbleStyle = [
      styles.quotedBubble,
      replyTo.isOwn ? styles.quotedBubbleOwn : styles.quotedBubbleOther,
    ];

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Text style={[styles.label, isOwn && styles.labelOwn]}>{label}</Text>
        <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
          {!isOwn && <View style={styles.bar} />}
          <View style={bubbleStyle}>
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={80}
              reducedTransparencyFallbackColor={
                replyTo.isOwn ? colors.message.own : colors.message.other
              }
            />
            <Text style={styles.quotedText} numberOfLines={2}>
              {replyTo.content}
            </Text>
          </View>
          {isOwn && <View style={styles.barRight} />}
        </View>
      </TouchableOpacity>
    );
  },
);

ReplyPreview.displayName = 'ReplyPreview';

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: colors.text.secondary,
  },
  labelOwn: {
    textAlign: 'right',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  quotedBubble: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
    opacity: 0.5,
  },
  quotedBubbleOwn: {
    backgroundColor: colors.message.own,
  },
  quotedBubbleOther: {},
  bar: {
    width: 3,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    marginRight: 8,
  },
  barRight: {
    width: 3,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    marginLeft: 8,
  },
  quotedText: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    color: colors.text.secondary,
  },
});
