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

export function getInstagramStoryReplyData(text: string): { replyContent: string, replyTo: string } | null {
  const replyToRegex = /Replied to @([\w.-]+)'s story/;
  const match = text.match(replyToRegex);
  const replyTo = match ? match[0] : null;
  if (replyTo) {
    const replyContentSplit = text.split(replyTo);
    const replyContent = replyContentSplit?.[1].trim();
    if (!replyContent) return null;
    return {
      replyContent,
      replyTo,
    };
  }
  return null;
}