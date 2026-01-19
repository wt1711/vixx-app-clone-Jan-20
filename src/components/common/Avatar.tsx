import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { getInitials } from 'src/utils/stringUtils';
import { colors } from 'src/theme';

export type AvatarProps = {
  avatarUrl?: string;
  name?: string;
  initials?: string;
  size?: number;
};

export const Avatar = ({
  avatarUrl,
  name,
  initials,
  size = 32,
}: AvatarProps) => {
  const displayInitials = initials ?? (name ? getInitials(name) : '?');
  const borderRadius = size / 2;

  const sizeStyle = {
    width: size,
    height: size,
    borderRadius,
  };

  if (avatarUrl) {
    return (
      <Image source={{ uri: avatarUrl }} style={[styles.avatar, sizeStyle]} />
    );
  }

  return (
    <View style={[styles.avatar, styles.placeholder, sizeStyle]}>
      <Text style={[styles.text, { fontSize: size * 0.375 }]}>
        {displayInitials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    borderColor: colors.transparent.white30,
  },
  placeholder: {
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text.secondary,
    fontWeight: 'bold',
  },
});
