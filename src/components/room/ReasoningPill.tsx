import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../theme';

type ReasoningPillProps = {
  reason: string;
  onClose: () => void;
  animatedStyle: {
    maxHeight: Animated.AnimatedInterpolation<number>;
    opacity: Animated.Value;
    marginBottom: Animated.AnimatedInterpolation<number>;
  };
};

export function ReasoningPill({
  reason,
  onClose,
  animatedStyle,
}: ReasoningPillProps) {
  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <View style={styles.pill}>
        <View style={styles.border} pointerEvents="none" />
        <Text style={styles.text}>{reason}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color={colors.text.secondary} size={16} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  pill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.elevated,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderTopColor: colors.transparent.white10,
    borderLeftColor: colors.transparent.white06,
    borderBottomColor: colors.transparent.white14,
    borderRightColor: colors.transparent.white08,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: -2,
  },
});
