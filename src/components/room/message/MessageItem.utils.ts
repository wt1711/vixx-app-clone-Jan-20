import { MessageItem } from '../types';
import { MsgType } from '../../../types/matrix/room';
import {
  getInstagramUrl,
  getInstagramStoryReplyData,
} from '../../../utils/urlParser';
import type { MessageItemProps } from './MessageItem';

export type MessageVariant =
  | 'instagram-story-reply'
  | 'instagram-image'
  | 'instagram-video'
  | 'gif'
  | 'image'
  | 'video'
  | 'text';

export function getMessageVariant(item: MessageItem): MessageVariant {
  const instagramUrl = getInstagramUrl(item.content);
  const isImageMessage = item.msgtype === MsgType.Image && item.imageUrl;
  const isVideoMessage = item.msgtype === MsgType.Video && item.videoUrl;

  if (isImageMessage && instagramUrl) {
    const storyData = getInstagramStoryReplyData(item.content);
    return storyData ? 'instagram-story-reply' : 'instagram-image';
  }

  if (isVideoMessage && instagramUrl) return 'instagram-video';
  if (isImageMessage && item.imageInfo?.mimetype === 'image/gif') return 'gif';
  if (isImageMessage) return 'image';
  if (isVideoMessage) return 'video';
  return 'text';
}

export function areReactionsEqual(
  prev: MessageItemProps['item']['reactions'],
  next: MessageItemProps['item']['reactions'],
): boolean {
  if (prev === next) return true;

  const a = prev ?? [];
  const b = next ?? [];

  if (a.length !== b.length) return false;

  return a.every(
    (r, i) =>
      r.key === b[i]?.key &&
      r.count === b[i]?.count &&
      r.myReaction === b[i]?.myReaction,
  );
}

export function isMessageItemEqual(
  prev: MessageItemProps,
  next: MessageItemProps,
): boolean {
  const { item: prevItem, ...prevRest } = prev;
  const { item: nextItem, ...nextRest } = next;

  if (
    prevRest.showTimestamp !== nextRest.showTimestamp ||
    prevRest.isFirstOfHour !== nextRest.isFirstOfHour
  ) {
    return false;
  }

  if (
    prevItem.eventId !== nextItem.eventId ||
    prevItem.content !== nextItem.content ||
    prevItem.timestamp !== nextItem.timestamp ||
    prevItem.imageUrl !== nextItem.imageUrl ||
    prevItem.avatarUrl !== nextItem.avatarUrl
  ) {
    return false;
  }

  if (prevItem.replyTo?.eventId !== nextItem.replyTo?.eventId) {
    return false;
  }

  return areReactionsEqual(prevItem.reactions, nextItem.reactions);
}
