/**
 * Moderation Logger
 *
 * Logs moderation events for internal review and abuse prevention.
 * IMPORTANT: Does NOT log raw message text to protect user privacy.
 * Only logs hashed identifiers, category, and action taken.
 */

import {
  ModerationLogEntry,
  ViolationCategory,
  ModerationDecision,
  ContentType,
} from './types';

// Simple hash function for privacy (not cryptographic, just obfuscation)
// In production, use a proper hashing library with salt
const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

// In-memory log buffer (in production, send to analytics/logging service)
const logBuffer: ModerationLogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Log a moderation event
 *
 * @param messageId - Unique message identifier (will be hashed)
 * @param userId - User identifier (will be hashed)
 * @param category - Violation category detected
 * @param action - Action taken (warn or block)
 * @param contentType - Type of content moderated
 */
export function logModerationEvent(
  messageId: string,
  userId: string,
  category: ViolationCategory,
  action: ModerationDecision.WARN | ModerationDecision.BLOCK,
  contentType: ContentType = ContentType.TEXT,
): void {
  const entry: ModerationLogEntry = {
    messageIdHash: simpleHash(messageId),
    userIdHash: simpleHash(userId),
    category,
    timestamp: Date.now(),
    action,
    contentType,
  };

  // Add to buffer
  logBuffer.push(entry);

  // Prevent memory bloat - keep only recent entries
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Log to console in development
  if (__DEV__) {
    console.log('[ContentModeration] Event logged:', {
      ...entry,
      // Show readable timestamp in dev
      time: new Date(entry.timestamp).toISOString(),
    });
  }

  // Future: Send to analytics/logging service
  // sendToAnalytics(entry);
}

/**
 * Get moderation statistics (for admin dashboard)
 * Only returns aggregate data, no individual logs.
 */
export function getModerationStats(): {
  totalBlocked: number;
  totalWarned: number;
  byCategory: Record<ViolationCategory, number>;
} {
  const stats = {
    totalBlocked: 0,
    totalWarned: 0,
    byCategory: {} as Record<ViolationCategory, number>,
  };

  // Initialize categories
  Object.values(ViolationCategory).forEach((cat) => {
    stats.byCategory[cat] = 0;
  });

  // Aggregate from buffer
  logBuffer.forEach((entry) => {
    if (entry.action === ModerationDecision.BLOCK) {
      stats.totalBlocked++;
    } else {
      stats.totalWarned++;
    }
    stats.byCategory[entry.category]++;
  });

  return stats;
}

/**
 * Clear log buffer (for testing or memory management)
 */
export function clearModerationLogs(): void {
  logBuffer.length = 0;
}

/**
 * Future: Flush logs to remote service
 *
 * @example
 * export async function flushLogsToServer(): Promise<void> {
 *   if (logBuffer.length === 0) return;
 *
 *   const logsToSend = [...logBuffer];
 *   clearModerationLogs();
 *
 *   await fetch(API_ENDPOINTS.MODERATION.LOGS, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ logs: logsToSend }),
 *   });
 * }
 */
