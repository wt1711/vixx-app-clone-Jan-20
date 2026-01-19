import React from 'react';
import { StyleSheet, Text, Pressable, Linking } from 'react-native';
import { Instagram } from 'lucide-react-native';
import { colors } from 'src/theme';

type ViewOnInstagramLinkProps = {
  instagramUrl: string;
};

export const ViewOnInstagramLink = React.memo<ViewOnInstagramLinkProps>(
  ({ instagramUrl }) => {
    const handlePress = () => {
      Linking.openURL(instagramUrl).catch(() => {});
    };

    return (
      <Pressable onPress={handlePress} style={styles.container}>
        <Instagram size={16} color={colors.accent.instagram} />
        <Text style={styles.linkText} numberOfLines={1}>
          View on Instagram
        </Text>
      </Pressable>
    );
  },
);

ViewOnInstagramLink.displayName = 'ViewOnInstagramLink';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.instagram,
  },
});
