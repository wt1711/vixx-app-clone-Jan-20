import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { getInitials } from '../../utils/stringUtils';

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
    return <Image source={{ uri: avatarUrl }} style={[styles.avatar, sizeStyle]} />;
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholder: {
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
});
