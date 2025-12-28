import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ReplyToData } from '../types';
import { colors } from '../../../theme';

export type ReplyPreviewProps = {
  replyTo: ReplyToData;
  isOwn: boolean;
  onPress?: () => void;
};

export const ReplyPreview = React.memo<ReplyPreviewProps>(
  ({ replyTo, isOwn, onPress }) => {
    const maxLength = 80;
    const truncatedContent =
      replyTo.content.length > maxLength
        ? `${replyTo.content.substring(0, maxLength)}...`
        : replyTo.content;

    // Determine the label based on who is replying to whom
    const label = isOwn ? 'You replied' : 'Replied to you';

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
        <View style={bubbleStyle}>
          {!isOwn && <View style={styles.bar} />}
          <Text style={styles.quotedText} numberOfLines={1}>
            {truncatedContent}
          </Text>
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
  quotedBubble: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    opacity: 0.6,
  },
  quotedBubbleOwn: {
    backgroundColor: colors.message.own,
  },
  quotedBubbleOther: {
    backgroundColor: colors.message.other,
  },
  bar: {
    width: 3,
    backgroundColor: colors.accent.purple,
    borderRadius: 2,
    marginRight: 8,
  },
  quotedText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: colors.text.secondary,
  },
});
