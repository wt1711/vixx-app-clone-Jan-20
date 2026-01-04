import { useCallback } from 'react';
import { Image } from 'react-native';
import { getMatrixClient } from '../matrixClient';
import { useDirectRooms } from './room';
import { FOUNDER_MATRIX_ID, FOUNDER_ROOM_NAME } from '../constants/founder';

const founderAvatar = require('../../assets/founder.png');

export function useChatWithFounder(onSelectRoom: (roomId: string) => void) {
  const { directRooms } = useDirectRooms();
  const mx = getMatrixClient();

  const handleChatWithFounder = useCallback(async () => {
    if (!mx) return;

    // Check if we already have a DM room with the founder
    for (const room of directRooms) {
      const members = room.getJoinedMembers();
      const hasFounder = members.some(
        member => member.userId === FOUNDER_MATRIX_ID,
      );
      if (hasFounder) {
        onSelectRoom(room.roomId);
        return;
      }
    }

    // No existing room found, create a new DM room
    try {
      const { room_id } = await mx.createRoom({
        name: FOUNDER_ROOM_NAME,
        is_direct: true,
        invite: [FOUNDER_MATRIX_ID],
        preset: 'trusted_private_chat' as any,
      });

      // Set room avatar
      try {
        const resolvedSource = Image.resolveAssetSource(founderAvatar);
        const imageResponse = await fetch(resolvedSource.uri);
        const blob = await imageResponse.blob();

        const baseUrl = mx.getHomeserverUrl();
        const uploadUrl = `${baseUrl}/_matrix/media/r0/upload?filename=founder.png`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mx.getAccessToken()}`,
            'Content-Type': 'image/png',
          },
          body: blob,
        });

        if (uploadResponse.ok) {
          const { content_uri } = await uploadResponse.json();
          await mx.sendStateEvent(room_id, 'm.room.avatar' as any, {
            url: content_uri,
          });
        }
      } catch (avatarError) {
        console.error('Failed to set room avatar:', avatarError);
      }

      onSelectRoom(room_id);
    } catch (error) {
      console.error('Failed to create room with founder:', error);
    }
  }, [mx, directRooms, onSelectRoom]);

  return { handleChatWithFounder, founderAvatar };
}
