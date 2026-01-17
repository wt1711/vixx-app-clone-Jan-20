import React from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { ViewOnInstagramLink } from './ViewOnInstagramLink';

type InstagramImageMessageProps = {
  instagramUrl: string;
  imageUrl: string;
  isOwn: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const InstagramImageMessage = React.memo<InstagramImageMessageProps>(
  ({ instagramUrl, imageUrl, isOwn, onImagePress, onLongPress }) => {
    return (
      <View
        style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}
      >
        <ViewOnInstagramLink instagramUrl={instagramUrl} />
        <Pressable
          onPress={() => onImagePress?.(imageUrl)}
          onLongPress={onLongPress}
          delayLongPress={500}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>
      </View>
    );
  },
);

InstagramImageMessage.displayName = 'InstagramImageMessage';

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  image: {
    width: 150,
    aspectRatio: 1,
    borderRadius: 12,
  },
});
