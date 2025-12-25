/* eslint-disable no-unreachable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
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
import { usePaymentVerification } from '../hooks/usePaymentVerification';
import { RoomTimeline } from '../components/room/RoomTimeline';
import { RoomInput } from '../components/room/RoomInput';
import { RoomViewHeader } from '../components/room/RoomViewHeader';
import { AIAssistantModal } from '../components/ai/AIAssistantModal';
import { PaymentModal } from '../components/payment/PaymentModal';
import { AIAssistantProvider } from '../context/AIAssistantContext';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const mx = getMatrixClient();
  const { paymentState, refreshPaymentStatus } = usePaymentVerification();

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
    // Ignore for now
    return;

    console.log('🤖 AI Assistant clicked - Payment state:', {
      hasPaid: paymentState.hasPaid,
      isLoading: paymentState.isLoading,
    });

    if (!paymentState.hasPaid && !paymentState.isLoading) {
      console.log('💳 Payment required - showing payment modal');
      setShowPaymentModal(true);
      return;
    }

    console.log('✅ Payment verified - toggling AI assistant');
    setShowAIAssistant(true);
  }, [paymentState]);

  const handlePaymentSuccess = useCallback(() => {
    console.log('✅ Payment successful - refreshing status');
    refreshPaymentStatus();
    setShowPaymentModal(false);
    setShowAIAssistant(true);
  }, [refreshPaymentStatus]);

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

  // Fast keyboard animation
  // Start with 32px bottom padding when no keyboard
  const bottomGap = 32;
  const keyboardHeight = useRef(new Animated.Value(bottomGap)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        toValue: bottomGap, // 32px gap when keyboard hidden
        duration: 100,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#16213E', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#16213E', '#0A0A0F']}
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
            colors={['#0A0A0F', '#1A1A2E', '#16213E', '#0A0A0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AIAssistantProvider room={room} isMobile={true}>
            <RoomViewHeader
              room={room}
              onBack={onBack}
              onAIAssistantClick={handleAIAssistantClick}
              paymentState={paymentState}
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

          {/* Payment Modal */}
          <PaymentModal
            visible={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
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
