import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { colors } from '../../../../theme';

export type ImageMessageProps = {
  imageUrl: string;
  imageInfo?: { w?: number; h?: number };
  content?: string;
  isOwn: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const ImageMessage = ({
  imageUrl,
  imageInfo,
  content,
  isOwn,
  onImagePress,
  onLongPress,
}: ImageMessageProps) => {
  const imageStyle = useMemo<StyleProp<ImageStyle>>(() => {
    const { w, h } = imageInfo ?? {};
    const cornerStyle = isOwn ? styles.imageOwn : styles.imageOther;

    if (w && h) {
      return [
        styles.image,
        cornerStyle,
        styles.imageWithRatio,
        { aspectRatio: w / h, maxWidth: 250 },
      ];
    }
    return [styles.image, cornerStyle, styles.imageDefault];
  }, [imageInfo, isOwn]);

  const textStyle = [
    styles.messageText,
    isOwn ? styles.messageTextOwn : styles.messageTextOther,
  ];

  // Hide caption if it's the default placeholder or looks like a filename
  const isFilename = content && /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(content);
  const showCaption = content && content !== '📷 Image' && !isFilename;

  return (
    <Pressable
      onPress={() => onImagePress?.(imageUrl)}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <Image source={{ uri: imageUrl }} style={imageStyle} resizeMode="contain" />
      {showCaption && <Text style={[textStyle, styles.caption]}>{content}</Text>}
    </Pressable>
  );
};

ImageMessage.displayName = 'ImageMessage';

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.transparent.white10,
  },
  imageOwn: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  imageOther: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  imageWithRatio: {
    maxWidth: 250,
    maxHeight: 300,
    width: '100%',
  },
  imageDefault: {
    width: 250,
    height: 200,
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
  caption: {
    marginTop: 8,
  },
});
