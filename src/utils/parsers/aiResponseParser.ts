export type ParsedAIResponse = {
  emotion: string;
  reason: string;
  message: string;
  rawResponse: string;
};

/**
 * Parses AI response in various formats:
 * Format 1: [emotion: ...] [reason: ...] Message
 * Format 2: [emotion] ... [reason] ... Message
 * Format 3: Just the reason followed by message on new line
 */
export function parseAIResponse(response: string): ParsedAIResponse {
  // Try format with colon first: [emotion: content] or [reason: content]
  let emotionMatch = response.match(/\[emotion:\s*([^\]]+)\]/i);
  let reasonMatch = response.match(/\[reason:\s*([^\]]+)\]/i);

  // If no match, try format without colon: [emotion] content or [reason] content
  // This captures everything after [reason] until the next line or end
  if (!reasonMatch) {
    reasonMatch = response.match(/\[reason\]\s*([^\n\[]+)/i);
  }
  if (!emotionMatch) {
    emotionMatch = response.match(/\[emotion\]\s*([^\n\[]+)/i);
  }

  const emotion = emotionMatch ? emotionMatch[1].trim() : '';
  const reason = reasonMatch ? reasonMatch[1].trim() : '';

  // Remove emotion and reason patterns to get just the message
  let message = response
    // Format with colon
    .replace(/\[emotion:\s*[^\]]+\]/gi, '')
    .replace(/\[reason:\s*[^\]]+\]/gi, '')
    // Format without colon (tag + content until newline)
    .replace(/\[emotion\]\s*[^\n\[]*/gi, '')
    .replace(/\[reason\]\s*[^\n\[]*/gi, '')
    .trim();

  // Clean up any extra newlines
  message = message.replace(/^\n+|\n+$/g, '');

  return {
    emotion,
    reason,
    message,
    rawResponse: response,
  };
}
