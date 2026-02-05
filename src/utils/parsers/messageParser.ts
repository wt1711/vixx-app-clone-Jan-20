import { MsgType } from 'matrix-js-sdk';
import { ContentKey } from 'src/types';

// URL parsing utilities
const URL_REGEX =
  /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))/gi;

export type ParsedTextPart =
  | { type: 'text'; content: string }
  | { type: 'url'; content: string };

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

export function parseTextWithUrls(text: string): ParsedTextPart[] {
  const parts: ParsedTextPart[] = [];
  let lastIndex = 0;

  const matches = text.matchAll(URL_REGEX);
  for (const match of matches) {
    const url = match[0];
    const index = match.index!;

    if (index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, index) });
    }

    parts.push({ type: 'url', content: url });
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

export function getFirstUrl(text: string): string | null {
  const urls = extractUrls(text);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Parses text for slash commands (/me, /notice, /shrug, /tableflip, /unflip)
 * and returns the appropriate message type and processed body
 */
export function parseSlashCommand(text: string): {
  msgtype: MsgType;
  body: string;
} {
  // /me emote command
  if (text.startsWith('/me ')) {
    return { msgtype: MsgType.Emote, body: text.substring(4) };
  }

  // /notice command
  if (text.startsWith('/notice ')) {
    return { msgtype: MsgType.Notice, body: text.substring(8) };
  }

  // Inline replacements
  let body = text;

  if (body.includes('/shrug')) {
    body = body.replace('/shrug', '¯\\_(ツ)_/¯');
  }

  if (body.includes('/tableflip')) {
    body = body.replace('/tableflip', '(╯°□°)╯︵ ┻━┻');
  }

  if (body.includes('/unflip')) {
    body = body.replace('/unflip', '┬─┬ノ( º _ ºノ)');
  }

  return { msgtype: MsgType.Text, body };
}

/**
 * Parses a message event into a preview string
 */
export const parseMessagePreview = (content: Record<string, any>): string => {
  if (content.msgtype === MsgType.Text) {
    return content.body || '';
  } else if (content.msgtype === MsgType.Image) {
    if (content.info?.mimetype === 'image/gif') {
      return 'Sent a GIF';
    }
    return 'Sent a photo';
  } else if (content.msgtype === MsgType.Video) {
    return 'Sent a video';
  } else if (content.msgtype === MsgType.File) {
    return 'Sent an attachment';
  } else if (content.msgtype === MsgType.Audio) {
    return 'Sent an audio';
  }
  return 'Sent a message';
};

/**
 * Parses a reaction event into a preview string
 */
export const parseReactionPreview = (content: Record<string, any>): string => {
  const reactionKey = content[ContentKey.RelatesTo]?.key;
  if (reactionKey) {
    return `Reacted ${reactionKey} to a message`;
  }
  return 'Reacted to a message';
};

// Match Instagram URLs including:
// - Posts: /p/ABC123/
// - Reels: /reel/ABC123/ or /reels/ABC123/
// - IGTV: /tv/ABC123/
// - Stories: /stories/username/123456789?query=params
const INSTAGRAM_URL_REGEX =
  /https?:\/\/(?:www\.)?instagram\.com\/(?:stories\/[\w.-]+\/[\d]+(?:\?[^\s\n]*)?|(?:p|reel|reels|tv)\/[\w-]+\/?)/i;

export function isInstagramUrl(url: string): boolean {
  return INSTAGRAM_URL_REGEX.test(url);
}

export function getInstagramUrl(text: string): string | null {
  const match = text.match(INSTAGRAM_URL_REGEX);
  return match ? match[0] : null;
}

export function getInstagramStoryReplyData(
  text: string,
): { replyContent: string; replyTo: string } | null {
  // Match "[Action] to @Username's story" (e.g., Replied, Reacted, etc.)
  // where username can contain Unicode, spaces, emoji
  const replyToRegex = /\w+ to @(.+?)'s story/;
  const match = text.match(replyToRegex);
  if (!match) return null;

  const replyTo = match[1]; // The captured username
  const fullMatch = match[0]; // "Replied to @Username's story"

  // Get the reply content (everything after the "Replied to..." line)
  const replyContentSplit = text.split(fullMatch);
  const replyContent = replyContentSplit?.[1]?.trim();

  if (!replyContent) return null;

  return {
    replyContent,
    replyTo,
  };
}

// Message variant utilities
export type MessageVariant =
  | 'instagram-story-reply'
  | 'instagram-image'
  | 'instagram-video'
  | 'gif'
  | 'image'
  | 'video'
  | 'text';

export type MessageVariantInput = {
  content: string;
  msgtype?: string;
  imageUrl?: string;
  videoUrl?: string;
  imageInfo?: {
    mimetype?: string;
  };
};

export function getMessageVariant(item: MessageVariantInput): MessageVariant {
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
