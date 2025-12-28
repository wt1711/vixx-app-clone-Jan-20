import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Send, ImageIcon, X } from 'lucide-react-native';
// import { Camera } from 'lucide-react-native';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useReply } from '../../context/ReplyContext';
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
  const {
    pickAndSendImage,
    isUploading,
    // takeAndSendPhoto
  } = useImageSender(room.roomId);
  const {
    generateInitialResponse,
    isGeneratingResponse,
    inputValue,
    setInputValue,
  } = useAIAssistant();
  const { replyingTo, clearReply } = useReply();

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
      // Build the message content with optional reply relation
      const content = replyingTo
        ? {
            msgtype: MsgType.Text,
            body: text,
            'm.relates_to': {
              'm.in_reply_to': {
                event_id: replyingTo.eventId,
              },
            },
          }
        : {
            msgtype: MsgType.Text,
            body: text,
          };

      if (replyingTo) {
        clearReply();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await mx.sendEvent(room.roomId, EventType.RoomMessage, content as any);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore text on error
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, mx, room, sending, setInputText, replyingTo, clearReply]);

  return (
    <View style={styles.container}>
      {/* Reply Bar */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyBarContent}>
            <View style={styles.replyBarIndicator} />
            <View style={styles.replyBarTextContainer}>
              <Text style={styles.replyBarLabel}>
                Replying to {replyingTo.senderName}
              </Text>
              <Text style={styles.replyBarMessage} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearReply} style={styles.replyBarClose}>
            <X color={colors.text.secondary} size={18} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputBar}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={80}
          reducedTransparencyFallbackColor={colors.background.primary}
        />
        <TouchableOpacity
          style={[
            styles.mediaButton,
            isUploading && styles.mediaButtonDisabled,
          ]}
          onPress={pickAndSendImage}
          disabled={isUploading}
        >
          <LinearGradient
            colors={['#1A1D24', '#22262E', '#2A2F38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mediaButtonGradient}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <ImageIcon color={colors.text.white} size={22} />
            )}
          </LinearGradient>
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
            style={[styles.vixxLogo, { transform: [{ rotate: spin }] }]}
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  inputBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.transparent.inputBar,
    borderRadius: 25,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 8,
    gap: 10,
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
    overflow: 'hidden',
  },
  mediaButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonDisabled: {
    opacity: 0.5,
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
  replyBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.transparent.inputBar,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.transparent.white15,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarIndicator: {
    width: 3,
    height: 32,
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  replyBarTextContainer: {
    flex: 1,
  },
  replyBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: 2,
  },
  replyBarMessage: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  replyBarClose: {
    padding: 4,
    marginLeft: 8,
  },
});
