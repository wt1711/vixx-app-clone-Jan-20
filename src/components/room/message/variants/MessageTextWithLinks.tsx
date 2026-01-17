import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
import { parseTextWithUrls, getFirstUrl } from '../../../../utils/urlParser';
import { isVideoUrl } from '../../../../hooks/useLinkPreview';
import { LinkPreview } from './LinkPreview';
import { colors } from '../../../../theme';

type MessageTextWithLinksProps = {
  content: string;
  isOwn: boolean;
  onLongPress?: () => void;
};

export const MessageTextWithLinks = React.memo<MessageTextWithLinksProps>(
  ({ content, isOwn, onLongPress }) => {
    const textStyle = [
      styles.messageText,
      isOwn ? styles.messageTextOwn : styles.messageTextOther,
    ];
    const linkStyle = [
      styles.messageText,
      isOwn ? styles.messageTextOwn : styles.messageTextOther,
      styles.linkText,
    ];

    const parts = useMemo(() => parseTextWithUrls(content), [content]);
    const firstUrl = useMemo(() => getFirstUrl(content), [content]);
    const isVideo = firstUrl ? isVideoUrl(firstUrl) : false;

    const handleLinkPress = (url: string) => {
      Linking.openURL(url).catch(() => {});
    };

    // Check if message is only a video URL (with optional whitespace)
    const isVideoOnly = isVideo && content.trim() === firstUrl;

    // For video-only messages, just show the preview
    if (isVideoOnly && firstUrl) {
      return (
        <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />
      );
    }

    return (
      <View>
        <Text style={textStyle}>
          {parts.map((part, index) => {
            // Hide video URLs in text, only show preview
            if (part.type === 'url' && isVideoUrl(part.content)) {
              return null;
            }
            return part.type === 'url' ? (
              <Text
                key={index}
                style={linkStyle}
                onPress={() => handleLinkPress(part.content)}
              >
                {part.content}
              </Text>
            ) : (
              <Text key={index}>{part.content}</Text>
            );
          })}
        </Text>
        {firstUrl && (
          <LinkPreview url={firstUrl} isOwn={isOwn} onLongPress={onLongPress} />
        )}
      </View>
    );
  },
);

MessageTextWithLinks.displayName = 'MessageTextWithLinks';

const styles = StyleSheet.create({
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
  linkText: {
    textDecorationLine: 'underline',
  },
});
