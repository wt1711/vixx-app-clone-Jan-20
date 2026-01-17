import React from 'react';
import { StyleSheet, View, StyleProp, TextStyle } from 'react-native';
import { ViewOnInstagramLink } from './ViewOnInstagramLink';
import { VideoMessage } from './VideoMessage';
import { MessageItem } from '../../types';

type InstagramVideoMessageProps = {
  instagramUrl: string;
  item: MessageItem;
  textStyle: StyleProp<TextStyle>;
  onVideoPress?: (videoUrl: string) => void;
  onLongPress?: () => void;
};

export const InstagramVideoMessage = React.memo<InstagramVideoMessageProps>(
  ({ instagramUrl, item, textStyle, onVideoPress, onLongPress }) => {
    return (
      <View style={styles.container}>
        <ViewOnInstagramLink instagramUrl={instagramUrl} />
        <VideoMessage
          item={item}
          onVideoPress={onVideoPress}
          onLongPress={onLongPress}
          textStyle={textStyle}
        />
      </View>
    );
  },
);

InstagramVideoMessage.displayName = 'InstagramVideoMessage';

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
