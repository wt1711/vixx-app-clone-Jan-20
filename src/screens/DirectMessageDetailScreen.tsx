import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Room, MatrixEvent, RoomEvent } from 'matrix-js-sdk';
import { getMatrixClient } from '../matrixClient';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { RoomTimeline } from '../components/room/RoomTimeline';
import { RoomInput } from '../components/room/RoomInput';
import { RoomViewHeader } from '../components/room/RoomViewHeader';
import { AIAssistantModal } from '../components/ai/AIAssistantModal';
import { AIAssistantProvider } from '../context/AIAssistantContext';
import { ReplyProvider } from '../context/ReplyContext';
import { colors, gradients } from '../theme';

type DirectMessageDetailScreenProps = {
  roomId: string;
  onBack: () => void;
  eventId?: string;
};

export function DirectMessageDetailScreen({
  roomId,
  onBack,
  eventId,
}: DirectMessageDetailScreenProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const mx = getMatrixClient();

  useEffect(() => {
    if (!mx) {
      setLoading(false);
      return;
    }

    const loadRoom = () => {
      const roomObj = mx.getRoom(roomId);
      if (!roomObj) {
        setLoading(false);
        return;
      }

      setRoom(roomObj);
      setLoading(false);
    };

    loadRoom();

    // Listen for room updates
    const onRoomTimeline = (event: MatrixEvent, roomObj: Room | undefined) => {
      if (roomObj?.roomId === roomId) {
        // Force re-render when new events arrive
        setRoom(prevRoom => {
          if (prevRoom?.roomId === roomId) {
            // Return a new reference to trigger re-render
            return mx.getRoom(roomId) || prevRoom;
          }
          return prevRoom;
        });
      }
    };

    const onRoomName = (roomObj: Room) => {
      if (roomObj.roomId === roomId) {
        setRoom(roomObj);
      }
    };

    mx.on(RoomEvent.Timeline, onRoomTimeline);
    mx.on(RoomEvent.Name, onRoomName);

    return () => {
      mx.off(RoomEvent.Timeline, onRoomTimeline);
      mx.off(RoomEvent.Name, onRoomName);
    };
  }, [mx, roomId]);

  const handleAIAssistantClick = useCallback(() => {
    // TODO: Re-enable when payment is implemented
    setShowAIAssistant(true);
  }, []);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(50)
    .onEnd(event => {
      if (
        event.translationX > 100 &&
        Math.abs(event.velocityX) > Math.abs(event.velocityY)
      ) {
        onBack();
      }
    })
    .runOnJS(true);

  const keyboardHeight = useKeyboardHeight({ defaultPadding: 32 });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[...gradients.screenBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[...gradients.screenBackground]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Room not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <LinearGradient
            colors={[...gradients.screenBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <ReplyProvider>
            <AIAssistantProvider room={room} isMobile={true}>
              <RoomViewHeader
                room={room}
                onBack={onBack}
                onAIAssistantClick={handleAIAssistantClick}
              />

              <View style={styles.keyboardView}>
                <View style={styles.timelineContainer}>
                  <RoomTimeline room={room} eventId={eventId} />
                </View>

                <Animated.View
                  style={[
                    styles.inputContainer,
                    { marginBottom: keyboardHeight },
                  ]}
                >
                  <RoomInput room={room} />
                </Animated.View>
              </View>

              {/* AI Assistant Modal */}
              <AIAssistantModal
                visible={showAIAssistant}
                onClose={() => setShowAIAssistant(false)}
                room={room}
              />
            </AIAssistantProvider>
          </ReplyProvider>
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  timelineContainer: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'transparent',
  },
});
