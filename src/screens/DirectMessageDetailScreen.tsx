import React, { useState, useEffect } from 'react';
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
import { Room, MatrixEvent, RoomEvent } from 'matrix-js-sdk';
import { getMatrixClient } from 'src/matrixClient';
import { useKeyboardHeight } from 'src/hooks/useKeyboardHeight';
import { RoomTimeline, RoomInput, RoomViewHeader } from 'src/components/room';
import { AIAssistantProvider } from 'src/context/AIAssistantContext';
import { ReplyProvider } from 'src/context/ReplyContext';
import { InputHeightProvider } from 'src/context/InputHeightContext';
import LinearGradient from 'react-native-linear-gradient';
import { CarbonFiberTexture } from 'src/components/ui/NoiseTexture';
import { colors, gradients } from 'src/theme';

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
      <View style={styles.container}>
        <LinearGradient
          colors={[...gradients.screenDark]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[...gradients.screenDark]}
          locations={[0, 0.5, 1]}
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
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Solid black background */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background.black },
        ]}
      />
      {/* Carbon fiber weave texture */}
      <CarbonFiberTexture opacity={0.6} scale={0.5} />

      <GestureDetector gesture={swipeGesture}>
        <View style={styles.contentContainer}>
          <ReplyProvider>
            <AIAssistantProvider room={room} isMobile={true}>
              <InputHeightProvider>
                <View style={styles.keyboardView}>
                  <RoomTimeline room={room} eventId={eventId} />

                  <Animated.View
                    style={[styles.inputContainer, { bottom: keyboardHeight }]}
                  >
                    <RoomInput room={room} />
                  </Animated.View>

                  <LinearGradient
                    colors={[...gradients.bottomFadeBlack]}
                    style={styles.bottomFadeOverlay}
                    pointerEvents="none"
                  />
                </View>

                {/* Header - solid bar with glass pills */}
                <RoomViewHeader room={room} onBack={onBack} />
              </InputHeightProvider>
            </AIAssistantProvider>
          </ReplyProvider>
        </View>
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
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
  },
  bottomFadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
});
