import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { Instagram, Reply } from 'lucide-react-native';
import { colors } from '../../../theme';

type InstagramImageMessageProps = {
  instagramUrl: string;
  imageUrl: string;
  imageStyle: StyleProp<ImageStyle>;
  isOwn: boolean;
  instagramStoryReplyData: { replyContent: string, replyTo: string } | null;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const InstagramImageMessage = React.memo<InstagramImageMessageProps>(
  ({ instagramUrl, imageUrl, imageStyle, isOwn, instagramStoryReplyData, onImagePress, onLongPress }) => {
    const handleUrlPress = () => {
      Linking.openURL(instagramUrl).catch(() => {});
    };

    const linkStyle = [
      styles.linkText,
      isOwn ? styles.linkTextOwn : styles.linkTextOther,
    ];

    const replyTextStyle = [
      styles.storyReplyText,
      isOwn ? styles.storyReplyTextOwn : styles.storyReplyTextOther,
    ];

    return (
      <View style={styles.container}>
        {instagramStoryReplyData?.replyTo && (
          <View style={styles.storyReplyHeader}>
            <View style={styles.storyReplyHeaderContent}>
              <Reply size={14} color={isOwn ? colors.text.messageOwn : colors.text.messageOther} />
              <Text style={replyTextStyle} numberOfLines={1}>
                {instagramStoryReplyData.replyTo}
              </Text>
            </View>
          </View>
        )}
        
        <Pressable onPress={handleUrlPress} style={styles.urlContainer}>
          <View style={styles.urlContent}>
            <Instagram size={16} color={colors.accent.instagram} />
            <Text style={linkStyle} numberOfLines={1}>
              View on Instagram
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => onImagePress?.(imageUrl)}
          onLongPress={onLongPress}
          delayLongPress={500}
        >
          <Image
            source={{ uri: imageUrl }}
            style={imageStyle}
            resizeMode="contain"
          />
        </Pressable>

        {instagramStoryReplyData?.replyContent && (
          <View style={styles.storyReplyContent}>
            <View style={styles.storyReplyContentBubble}>
              <Text style={replyTextStyle}>{instagramStoryReplyData.replyContent}</Text>
            </View>
          </View>
        )}
      </View>
    );
  },
);

InstagramImageMessage.displayName = 'InstagramImageMessage';

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  storyReplyHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  storyReplyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urlContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  urlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkTextOwn: {
    color: colors.accent.instagram,
  },
  linkTextOther: {
    color: colors.accent.instagram,
  },
  storyReplyContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  storyReplyContentBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.transparent.white10,
  },
  storyReplyText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  storyReplyTextOwn: {
    color: colors.text.messageOwn,
  },
  storyReplyTextOther: {
    color: colors.text.messageOther,
  },
});
