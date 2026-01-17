import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { colors } from '../../../theme';

type InstagramStoryReplyMessageProps = {
  instagramUrl: string;
  imageUrl: string;
  isOwn: boolean;
  replyTo: string;
  replyContent: string;
  onLongPress?: () => void;
};

export const InstagramStoryReplyMessage =
  React.memo<InstagramStoryReplyMessageProps>(
    ({ instagramUrl, imageUrl, isOwn, replyTo, replyContent, onLongPress }) => {
      const handleImagePress = () => {
        Linking.openURL(instagramUrl).catch(() => {});
      };

      return (
        <View style={styles.container}>
          <Text style={styles.headerText}>
            {isOwn ? 'You replied to ' : 'Replied to '}
            {replyTo}'s story
          </Text>

          <View style={styles.storyContainer}>
            <View style={styles.verticalDivider} />
            <Pressable
              onPress={handleImagePress}
              onLongPress={onLongPress}
              delayLongPress={500}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.storyImage}
                resizeMode="cover"
              />
            </Pressable>
          </View>

          <View style={styles.replyBubble}>
            <Text style={styles.replyText}>{replyContent}</Text>
          </View>
        </View>
      );
    },
  );

InstagramStoryReplyMessage.displayName = 'InstagramStoryReplyMessage';

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 16,
    color: colors.text.secondary,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  storyContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalDivider: {
    width: 3,
    backgroundColor: colors.text.secondary,
    borderRadius: 2,
    marginRight: 8,
  },
  storyImage: {
    width: 200,
    height: 350,
    borderRadius: 12,
  },
  replyBubble: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    maxWidth: '80%',
  },
  replyText: {
    fontSize: 18,
    color: colors.text.messageOwn,
  },
});
