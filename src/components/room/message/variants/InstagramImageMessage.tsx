import React from 'react';
import { StyleSheet, View, Image, Pressable, StyleProp, ImageStyle } from 'react-native';
import { ViewOnInstagramLink } from './ViewOnInstagramLink';

type InstagramImageMessageProps = {
  instagramUrl: string;
  imageUrl: string;
  imageStyle: StyleProp<ImageStyle>;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

export const InstagramImageMessage = React.memo<InstagramImageMessageProps>(
  ({ instagramUrl, imageUrl, imageStyle, onImagePress, onLongPress }) => {
    return (
      <View style={styles.container}>
        <ViewOnInstagramLink instagramUrl={instagramUrl} />
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
});
