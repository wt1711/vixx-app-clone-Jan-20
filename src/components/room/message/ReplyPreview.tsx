import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ReplyToData } from '../types';
import { colors } from '../../../theme';

export type ReplyPreviewProps = {
  replyTo: ReplyToData;
  isOwn: boolean;
};

export const ReplyPreview = React.memo<ReplyPreviewProps>(
  ({ replyTo, isOwn }) => {
    const maxLength = 100;
    const truncatedContent =
      replyTo.content.length > maxLength
        ? `${replyTo.content.substring(0, maxLength)}...`
        : replyTo.content;

    return (
      <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
        <View style={[styles.bar, isOwn ? styles.barOwn : styles.barOther]} />
        <View style={styles.content}>
          <Text style={[styles.senderName, isOwn ? styles.textOwn : styles.textOther]} numberOfLines={1}>
            {replyTo.senderName}
          </Text>
          <Text style={[styles.messageText, isOwn ? styles.textOwn : styles.textOther]} numberOfLines={2}>
            {truncatedContent}
          </Text>
        </View>
      </View>
    );
  },
);

ReplyPreview.displayName = 'ReplyPreview';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  containerOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  containerOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  barOwn: {
    backgroundColor: colors.transparent.white50,
  },
  barOther: {
    backgroundColor: colors.accent.primary,
  },
  content: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textOwn: {
    color: colors.transparent.white90,
  },
  textOther: {
    color: colors.text.secondary,
  },
});
