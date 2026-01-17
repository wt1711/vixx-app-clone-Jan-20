import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  StyleProp,
  ImageStyle,
} from 'react-native';

export type GifMessageProps = {
  imageUrl: string;
  imageInfo?: { w?: number; h?: number };
  isOwn: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const GifMessage = ({
  imageUrl,
  imageInfo,
  isOwn,
  onImagePress,
  onLongPress,
}: GifMessageProps) => {
  const gifStyle = useMemo<StyleProp<ImageStyle>>(() => {
    const { w, h } = imageInfo ?? {};
    const cornerStyle = isOwn ? styles.gifImageOwn : styles.gifImageOther;

    if (w && h) {
      return [
        styles.gifImage,
        cornerStyle,
        { aspectRatio: w / h, maxWidth: 150 },
      ];
    }
    return [styles.gifImage, cornerStyle, styles.gifImageDefault];
  }, [imageInfo, isOwn]);

  return (
    <Pressable
      onPress={() => onImagePress?.(imageUrl)}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <Image source={{ uri: imageUrl }} style={gifStyle} resizeMode="contain" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gifImage: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gifImageOwn: {
    borderRadius: 12,
    borderBottomRightRadius: 4,
  },
  gifImageOther: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 4,
  },
  gifImageDefault: {
    width: 150,
    height: 150,
  },
});
