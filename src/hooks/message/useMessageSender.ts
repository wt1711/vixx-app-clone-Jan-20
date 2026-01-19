import { useMatrixClient } from 'src/hooks/useMatrixClient';
import { parseMessageContent } from 'src/utils/slashCommands';
import { MessageEvent } from 'src/types/matrix';

export const useMessageSender = (roomId: string | null) => {
  const { client } = useMatrixClient();

  const sendMessage = async (text: string) => {
    if (!client || !roomId) {
      throw new Error('Cannot send message: client or roomId not available');
    }

    const content = parseMessageContent(text);
    await client.sendEvent(roomId, MessageEvent.RoomMessage as any, content);
  };

  return { sendMessage };
};
