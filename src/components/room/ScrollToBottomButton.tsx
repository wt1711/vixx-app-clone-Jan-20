import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useInputHeight } from '../../context/InputHeightContext';
import { colors } from '../../theme';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
}

export function ScrollToBottomButton({
  visible,
  onPress,
}: ScrollToBottomButtonProps) {
  const { inputHeight } = useInputHeight();

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[styles.button, { bottom: inputHeight + 64 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.arrow}>↓</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.transparent.black50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  arrow: {
    fontSize: 20,
    color: colors.text.white,
    fontWeight: '600',
  },
});
