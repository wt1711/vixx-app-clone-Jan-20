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
          reducedTransparencyFallbackColor="#0A0A0F"
        />
        <TextInput
          style={styles.input}
          placeholder="flirt with her..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={5000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!sending}
        />
        <View style={styles.buttonRow}>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity
            style={[
              styles.aiButton,
              isGeneratingResponse && styles.aiButtonDisabled,
            ]}
            onPress={generateInitialResponse}
            disabled={isGeneratingResponse}
          >
            {isGeneratingResponse ? (
              <ActivityIndicator size="small" color="#A855F7" />
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
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Send
                color={inputText.trim() ? '#FF6B35' : '#6B7280'}
                size={24}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  inputBar: {
    backgroundColor: 'rgba(5, 6, 10, 0.92)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    width: '95%',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 16,
    color: '#E5E7EB',
    minHeight: 24,
    maxHeight: 60,
    borderWidth: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonSpacer: {
    flex: 1,
  },
  aiButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
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
    backgroundColor: '#FFFFFF',
  },
});
