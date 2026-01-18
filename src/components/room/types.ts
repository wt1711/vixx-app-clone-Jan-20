import { Room } from 'matrix-js-sdk';

export type ReactionData = {
  key: string;
  count: number;
  myReaction: boolean;
};

export type ReplyToData = {
  eventId: string;
  sender: string;
  senderName: string;
  content: string;
  msgtype?: string;
  isOwn: boolean;
  imageUrl?: string;
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
  videoUrl?: string;
  videoSource: {uri: string, accessToken: string | null} | undefined;
  videoInfo?: {
    [key: string]: any;
    w?: number;
    h?: number;
    mimetype?: string;
    duration?: number;
    thumbnail_url?: string;
  };
  videoThumbnailUrl?: string;
  reactions?: ReactionData[];
  replyTo?: ReplyToData;
};

export type RoomTimelineProps = {
  room: Room;
  eventId?: string;
};
