import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ReactionData } from '../types';
import { colors } from '../../../theme';

type ReactionButtonProps = {
  reaction: ReactionData;
  onPress: () => void;
};

const ReactionButton = ({ reaction, onPress }: ReactionButtonProps) => {
  const buttonStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (reaction.myReaction) {
      return [styles.button, styles.buttonActive];
    }
    return styles.button;
  }, [reaction.myReaction]);

  const countStyle = useMemo(() => {
    if (reaction.myReaction) {
      return [styles.count, styles.countActive];
    }
    return styles.count;
  }, [reaction.myReaction]);

  const emojiStyle =
    reaction.count > 1 ? [styles.emoji, { marginRight: 2 }] : styles.emoji;

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.6}>
      <Text style={emojiStyle}>{reaction.key}</Text>
      {reaction.count > 1 && <Text style={countStyle}>{reaction.count}</Text>}
    </TouchableOpacity>
  );
};

export type ReactionsListProps = {
  reactions: ReactionData[];
  isOwn: boolean;
  onReactionPress?: (key: string) => void;
};

export const ReactionsList = ({
  reactions,
  isOwn,
  onReactionPress,
}: ReactionsListProps) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    isOwn ? styles.containerOwn : styles.containerOther,
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {reactions.map(reaction => (
        <ReactionButton
          key={reaction.key}
          reaction={reaction}
          onPress={() => onReactionPress?.(reaction.key)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    bottom: -10,
    gap: 2,
    alignItems: 'center',
  },
  containerOwn: {
    left: 8,
  },
  containerOther: {
    left: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.transparent.reactionButton,
    minHeight: 20,
    minWidth: 20,
  },
  buttonActive: {
    backgroundColor: colors.transparent.reactionButtonActive,
  },
  emoji: {
    fontSize: 10,
    marginRight: 0,
    lineHeight: 14,
  },
  count: {
    fontSize: 10,
    color: colors.transparent.white90,
    fontWeight: '600',
    marginLeft: 2,
  },
  countActive: {
    color: colors.text.white,
    fontWeight: '700',
  },
});
