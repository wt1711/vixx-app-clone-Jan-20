import { useMatrixClient } from 'src/hooks/useMatrixClient';
import { parseSlashCommand } from 'src/utils/parsers/messageParser';
import { MessageEvent } from 'src/types';

export const useMessageSender = (roomId: string | null) => {
  const { client } = useMatrixClient();

  const sendMessage = async (text: string) => {
    if (!client || !roomId) {
      throw new Error('Cannot send message: client or roomId not available');
    }

    const content = parseSlashCommand(text);
    await client.sendEvent(roomId, MessageEvent.RoomMessage as any, content);
  };

  return { sendMessage };
};
