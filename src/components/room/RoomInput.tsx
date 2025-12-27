import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Send } from 'lucide-react-native';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { EventType, MsgType, Room } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import { colors } from '../../theme';

type RoomInputProps = {
  room: Room;
};

export function RoomInput({ room }: RoomInputProps) {
  const [sending, setSending] = useState(false);
  const mx = getMatrixClient();
  const {
    generateInitialResponse,
    isGeneratingResponse,
    inputValue,
    setInputValue,
  } = useAIAssistant();

  // Use context's inputValue as the text input
  const inputText = inputValue;
  const setInputText = setInputValue;

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !mx || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await mx.sendEvent(room.roomId, EventType.RoomMessage, {
        msgtype: MsgType.Text,
        body: text,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore text on error
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, mx, room, sending, setInputText]);

  return (
    <View style={styles.container}>
      <View style={styles.inputBar}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor={colors.background.primary}
        />
        <TextInput
          style={styles.input}
          placeholder="flirt with her..."
          placeholderTextColor={colors.text.placeholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={5000}
          onSubmitEditing={handleSend}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.aiButton,
            isGeneratingResponse && styles.aiButtonDisabled,
          ]}
          onPress={generateInitialResponse}
          disabled={isGeneratingResponse}
        >
          {isGeneratingResponse ? (
            <ActivityIndicator size="small" color={colors.accent.purple} />
          ) : (
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.vixxLogo}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : (
            <Send color={inputText.trim() ? colors.accent.primary : colors.text.tertiary} size={24} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.transparent.inputBar,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '95%',
    gap: 12,
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 16,
    color: colors.text.input,
    borderWidth: 0,
    maxHeight: 100,
  },
  aiButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.transparent.purple15,
    borderRadius: 18,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  sendButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  vixxLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text.white,
  },
});
