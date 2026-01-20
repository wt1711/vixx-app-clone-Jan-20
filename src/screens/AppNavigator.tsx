import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DirectMessageListScreen } from 'src/screens/DirectMessageListScreen';
import { DirectMessageDetailScreen } from 'src/screens/DirectMessageDetailScreen';
import { SettingsScreen } from 'src/screens/SettingsScreen';
import { PendingInvitationsModal } from 'src/components/auth';
import { useDirectRooms } from 'src/hooks/room';
import { getMatrixClient } from 'src/services/matrixClient';

export type RootStackParamList = {
  MessageList: undefined;
  MessageDetail: { roomId: string };
  Settings: undefined;
  PendingInvitations: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="MessageList" component={MessageListWrapper} />
        <Stack.Screen
          name="MessageDetail"
          component={MessageDetailWrapper}
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsWrapper}
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="PendingInvitations"
          component={PendingInvitationsWrapper}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
            gestureDirection: 'vertical',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrapper components to handle navigation props
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MessageListWrapper() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <DirectMessageListScreen
      onSelectRoom={roomId => navigation.navigate('MessageDetail', { roomId })}
      onOpenSettings={() => navigation.navigate('Settings')}
      onOpenPendingInvitations={() => navigation.navigate('PendingInvitations')}
      selectedRoomId={undefined}
    />
  );
}

function MessageDetailWrapper() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'MessageDetail'>>();

  return (
    <DirectMessageDetailScreen
      roomId={route.params.roomId}
      onBack={() => navigation.goBack()}
    />
  );
}

function SettingsWrapper() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SettingsScreen
      onBack={() => navigation.goBack()}
      onSelectRoom={roomId => {
        // Navigate directly to MessageDetail, replacing Settings in the stack
        navigation.replace('MessageDetail', { roomId });
      }}
    />
  );
}

function PendingInvitationsWrapper() {
  const navigation = useNavigation<NavigationProp>();
  const { invitedRooms } = useDirectRooms();
  const mx = getMatrixClient();

  return (
    <PendingInvitationsModal
      invitedRooms={invitedRooms}
      mx={mx}
      onClose={() => navigation.goBack()}
    />
  );
}
