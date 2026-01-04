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
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Send, ImageIcon, X } from 'lucide-react-native';
// import { Camera } from 'lucide-react-native';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useReply } from '../../context/ReplyContext';
import { EventType, Room } from 'matrix-js-sdk';
import { MsgType, ContentKey } from '../../types/matrix/room';
import { getMatrixClient } from '../../matrixClient';
import { useImageSender } from '../../hooks/message/useImageSender';
import { colors } from '../../theme';

type RoomInputProps = {
  room: Room;
};

export function RoomInput({ room }: RoomInputProps) {
  const [sending, setSending] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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

  // Track keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setShowIdeaModal(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Use context's inputValue as the text input
  const inputText = inputValue;
  const setInputText = setInputValue;

  const handleAIButtonPress = useCallback(() => {
    if (isKeyboardVisible) {
      // If keyboard is open, show the dropdown with options
      setShowIdeaModal(true);
    } else {
      // If keyboard is closed, generate directly
      generateInitialResponse();
    }
  }, [isKeyboardVisible, generateInitialResponse]);

  const handleGenerateWithIdea = useCallback(() => {
    const idea = inputText.trim();
    setShowIdeaModal(false);
    generateInitialResponse(idea);
  }, [inputText, generateInitialResponse]);

  const handleGenerateWithoutIdea = useCallback(() => {
    setShowIdeaModal(false);
    generateInitialResponse();
  }, [generateInitialResponse]);

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
            [ContentKey.RelatesTo]: {
              [ContentKey.InReplyTo]: {
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
                Replying to
                {/* {replyingTo.senderName} */}
              </Text>
              <Text style={styles.replyBarMessage} numberOfLines={1}>
                {replyingTo.msgtype === MsgType.Image
                  ? 'Photo'
                  : replyingTo.content}
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
          onPress={handleAIButtonPress}
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

      {/* Idea Options Dropdown */}
      {showIdeaModal && (
        <View style={styles.ideaDropdownContainer}>
          {inputText.trim() ? (
            <>
              <TouchableOpacity
                style={styles.ideaOption}
                onPress={handleGenerateWithIdea}
              >
                <Text style={styles.ideaOptionText}>Based on the idea</Text>
                <Text style={styles.ideaOptionSubtext} numberOfLines={1}>
                  "{inputText.trim()}"
                </Text>
              </TouchableOpacity>
              <View style={styles.ideaOptionDivider} />
            </>
          ) : null}
          <TouchableOpacity
            style={styles.ideaOption}
            onPress={handleGenerateWithoutIdea}
          >
            <Text style={styles.ideaOptionText}>Generate freely</Text>
            {inputText.trim() ? (
              <Text style={styles.ideaOptionSubtext}>Ignore my input</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      )}
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
  ideaDropdownContainer: {
    position: 'absolute',
    bottom: '100%',
    right: 12,
    marginBottom: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 200,
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ideaOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ideaOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  ideaOptionSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  ideaOptionDivider: {
    height: 1,
    backgroundColor: colors.transparent.white15,
  },
});
