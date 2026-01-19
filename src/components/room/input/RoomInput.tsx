import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Send } from 'lucide-react-native';
import { useAIAssistant } from 'src/hooks/context/AIAssistantContext';
import { useReply } from 'src/hooks/context/ReplyContext';
import { useInputHeight } from 'src/hooks/context/InputHeightContext';
import { EventType, Room } from 'matrix-js-sdk';
import { MsgType, ContentKey } from 'src/types';
import { getMatrixClient } from 'src/services/matrixClient';
import { useImageSender } from 'src/hooks/message/useImageSender';
import { useSparkleAnimation } from 'src/hooks/animation/useSparkleAnimation';
import { useAnimatedHeight } from 'src/hooks/animation/useAnimatedHeight';
import { LiquidGlassButton } from 'src/components/ui/LiquidGlassButton';
import { ReasoningPill } from './ReasoningPill';
import { ReplyBar } from './ReplyBar';
import { InputBar } from './InputBar';
import { colors } from 'src/config';
import { isFounderRoom as checkIsFounderRoom } from 'src/utils/room';

// Re-export for backwards compatibility
export { getReplyPreviewText, type ReplyPreviewInput } from './ReplyBar';

type RoomInputProps = {
  room: Room;
};

export function RoomInput({ room }: RoomInputProps) {
  const [sending, setSending] = useState(false);
  const [generationType, setGenerationType] = useState<
    'withIdea' | 'withoutIdea' | null
  >(null);

  const mx = getMatrixClient();
  const { pickAndSendImage, isUploading } = useImageSender(room.roomId);
  const {
    generateInitialResponse,
    isGeneratingResponse,
    inputValue,
    setInputValue,
    parsedResponse,
    clearParsedResponse,
  } = useAIAssistant();
  const { replyingTo, clearReply } = useReply();
  const { setInputHeight } = useInputHeight();
  const isFounderRoom = checkIsFounderRoom(room.name);

  // Animation hooks
  const { pulseAnim, sparkleColor } = useSparkleAnimation(isGeneratingResponse);
  const { animatedStyle: reasoningAnimatedStyle } = useAnimatedHeight(
    !!parsedResponse?.reason,
    { maxHeight: 100 },
  );
  const { animatedStyle: replyAnimatedStyle } = useAnimatedHeight(
    !!replyingTo,
    { maxHeight: 60 },
  );

  // Reset generation type when response finishes
  React.useEffect(() => {
    if (!isGeneratingResponse) {
      setGenerationType(null);
    }
  }, [isGeneratingResponse]);

  // Measure container height and report to context for timeline padding
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      setInputHeight(event.nativeEvent.layout.height);
    },
    [setInputHeight],
  );

  // Clear reasoning when user edits the input
  const handleTextChange = useCallback(
    (text: string) => {
      if (parsedResponse) {
        clearParsedResponse();
      }
      setInputValue(text);
    },
    [parsedResponse, clearParsedResponse, setInputValue],
  );

  const handleGenerateWithoutIdea = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setGenerationType('withoutIdea');
    generateInitialResponse();
  }, [generateInitialResponse]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !mx || sending) return;

    const text = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
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
      setInputValue(text);
    } finally {
      setSending(false);
    }
  }, [inputValue, mx, room, sending, setInputValue, replyingTo, clearReply]);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* AI Reasoning Pill */}
      {parsedResponse?.reason && (
        <ReasoningPill
          reason={parsedResponse.reason}
          onClose={clearParsedResponse}
          animatedStyle={reasoningAnimatedStyle}
        />
      )}

      {/* Reply Bar */}
      {replyingTo && (
        <ReplyBar
          reply={replyingTo}
          onClose={clearReply}
          animatedStyle={replyAnimatedStyle}
        />
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <InputBar
          value={inputValue}
          onChangeText={handleTextChange}
          onSubmit={handleSend}
          onPickImage={pickAndSendImage}
          onGenerateAI={handleGenerateWithoutIdea}
          isUploading={isUploading}
          isSending={sending}
          isGeneratingResponse={isGeneratingResponse}
          showAIButton={!isFounderRoom}
          pulseAnim={pulseAnim}
          sparkleColor={sparkleColor}
          shouldAnimateSparkle={generationType === 'withoutIdea'}
        />

        {/* Send Button */}
        <LiquidGlassButton
          style={[
            styles.sendButton,
            (!inputValue.trim() || sending) && styles.disabled,
          ]}
          contentStyle={styles.sendButtonContent}
          borderRadius={22}
          onPress={handleSend}
          disabled={!inputValue.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.text.messageOwn} />
          ) : (
            <Send
              color={
                inputValue.trim()
                  ? colors.text.messageOwn
                  : colors.text.tertiary
              }
              size={20}
            />
          )}
        </LiquidGlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
  },
  sendButtonContent: {
    flex: 1,
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
