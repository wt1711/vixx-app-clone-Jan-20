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
import { Instagram } from 'lucide-react-native';
import { colors } from '../../../../theme';

type InstagramImageMessageProps = {
  instagramUrl: string;
  imageUrl: string;
  imageStyle: StyleProp<ImageStyle>;
  isOwn: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const InstagramImageMessage = React.memo<InstagramImageMessageProps>(
  ({ instagramUrl, imageUrl, imageStyle, isOwn, onImagePress, onLongPress }) => {
    const handleUrlPress = () => {
      Linking.openURL(instagramUrl).catch(() => {});
    };

    const linkStyle = [
      styles.linkText,
      isOwn ? styles.linkTextOwn : styles.linkTextOther,
    ];

    return (
      <View style={styles.container}>
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
      </View>
    );
  },
);

InstagramImageMessage.displayName = 'InstagramImageMessage';

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
});
