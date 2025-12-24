import { Room } from 'matrix-js-sdk';

export type ReactionData = {
  key: string;
  count: number;
  myReaction: boolean;
};

export type MessageItem = {
  eventId: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  msgtype?: string;
  isOwn: boolean;
  avatarUrl?: string;
  imageUrl?: string;
  imageInfo?: {
    w?: number;
    h?: number;
    mimetype?: string;
  };
  reactions?: ReactionData[];
};

export type RoomTimelineProps = {
  room: Room;
  eventId?: string;
};
