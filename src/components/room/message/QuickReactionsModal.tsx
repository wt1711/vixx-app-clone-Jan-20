import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export type ModalPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QuickReactionsModalProps = {
  visible: boolean;
  targetEventId: string | null;
  position: ModalPosition | null;
  onClose: () => void;
  onSelectEmoji: (emoji: string, eventId: string) => void;
};

export function QuickReactionsModal({
  visible,
  targetEventId,
  position,
  onClose,
  onSelectEmoji,
}: QuickReactionsModalProps) {
  if (!targetEventId) return null;

  const handleEmojiPress = (emoji: string) => {
    onSelectEmoji(emoji, targetEventId);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.quickReactionsModalContainer} pointerEvents="box-none">
          <View
            style={[
              styles.quickReactionsPicker,
              // eslint-disable-next-line react-native/no-inline-styles
              position
                ? {
                    position: 'absolute',
                    top: Math.max(
                      10,
                      Math.min(
                        position.y - 60,
                        Dimensions.get('window').height - 100,
                      ),
                    ),
                    left: 10,
                  }
                : styles.quickReactionsPickerCentered,
            ]}
            pointerEvents="auto"
          >
            {QUICK_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.quickReactionButton}
                onPress={() => handleEmojiPress(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionsModalContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  quickReactionsPicker: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  quickReactionsPickerCentered: {
    alignSelf: 'center',
    marginTop: '50%',
  },
  quickReactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  quickReactionEmoji: {
    fontSize: 24,
  },
});
