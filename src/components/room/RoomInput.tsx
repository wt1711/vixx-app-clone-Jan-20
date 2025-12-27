import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Send, ImageIcon, Camera } from 'lucide-react-native';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { EventType, MsgType, Room } from 'matrix-js-sdk';
import { getMatrixClient } from '../../matrixClient';
import { useImageSender } from '../../hooks/message/useImageSender';
import { colors } from '../../theme';

type RoomInputProps = {
  room: Room;
};

export function RoomInput({ room }: RoomInputProps) {
  const [sending, setSending] = useState(false);
  const mx = getMatrixClient();
  const { pickAndSendImage, takeAndSendPhoto, isUploading } = useImageSender(room.roomId);
  const {
    generateInitialResponse,
    isGeneratingResponse,
    inputValue,
    setInputValue,
  } = useAIAssistant();

  // Rotation animation for vixx logo
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGeneratingResponse) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
      return () => animation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isGeneratingResponse, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <TouchableOpacity
          style={[
            styles.imageButton,
            isUploading && styles.imageButtonDisabled,
          ]}
          onPress={pickAndSendImage}
          disabled={isUploading}
        >
          <ImageIcon color={colors.text.secondary} size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.imageButton,
            isUploading && styles.imageButtonDisabled,
          ]}
          onPress={takeAndSendPhoto}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.text.secondary} />
          ) : (
            <Camera color={colors.text.secondary} size={24} />
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="flirt with her..."
          placeholderTextColor={colors.text.placeholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={5000}
          onSubmitEditing={handleSend}
          editable={!sending && !isUploading}
        />
        <TouchableOpacity
          style={styles.aiButton}
          onPress={generateInitialResponse}
          disabled={isGeneratingResponse}
        >
          <Animated.Image
            source={require('../../../assets/logo.png')}
            style={[
              styles.vixxLogo,
              { transform: [{ rotate: spin }] },
            ]}
          />
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
            <Send
              color={
                inputText.trim() ? colors.accent.primary : colors.text.tertiary
              }
              size={24}
            />
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
  imageButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonDisabled: {
    opacity: 0.5,
  },
  aiButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.transparent.white50,
    borderRadius: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.text.white,
  },
});
