/**
 * Content Moderation Hook
 *
 * Provides content filtering with UI feedback for message sending.
 * Handles ALLOW/WARN/BLOCK decisions with appropriate user messaging.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  moderateContentSync,
  ModerationResult,
  ModerationDecision,
} from 'src/services/contentModeration';

// Generic warning message - does not reveal which word triggered
const WARNING_MESSAGE =
  'This message may violate our community guidelines. Please edit and try again.';

type ContentModerationResult = {
  allowed: boolean;
  showWarning: boolean;
};

type UseContentModerationReturn = {
  // Check content and return whether it's allowed
  checkContent: (
    text: string,
    userId: string,
    messageId?: string,
  ) => ContentModerationResult;
  // Show warning alert to user
  showModerationWarning: () => void;
  // Current warning state
  isWarningShown: boolean;
  // Clear warning state
  clearWarning: () => void;
};

/**
 * Hook for content moderation in message input
 *
 * Usage:
 * const { checkContent, showModerationWarning } = useContentModeration();
 *
 * const handleSend = () => {
 *   const { allowed, showWarning } = checkContent(text, userId);
 *   if (!allowed) {
 *     if (showWarning) showModerationWarning();
 *     return;
 *   }
 *   // proceed with sending
 * };
 */
export function useContentModeration(): UseContentModerationReturn {
  const [isWarningShown, setIsWarningShown] = useState(false);

  const checkContent = useCallback(
    (
      text: string,
      _userId: string,
      _messageId?: string,
    ): ContentModerationResult => {
      // Use sync version for immediate feedback (<300ms requirement)
      const result: ModerationResult = moderateContentSync(text);

      if (result.decision === ModerationDecision.ALLOW) {
        return { allowed: true, showWarning: false };
      }

      if (result.decision === ModerationDecision.BLOCK) {
        return { allowed: false, showWarning: true };
      }

      if (result.decision === ModerationDecision.WARN) {
        setIsWarningShown(true);
        return { allowed: false, showWarning: true };
      }

      return { allowed: true, showWarning: false };
    },
    [],
  );

  const showModerationWarning = useCallback(() => {
    setIsWarningShown(true);
    Alert.alert('Content Warning', WARNING_MESSAGE, [
      {
        text: 'OK',
        onPress: () => setIsWarningShown(false),
      },
    ]);
  }, []);

  const clearWarning = useCallback(() => {
    setIsWarningShown(false);
  }, []);

  return {
    checkContent,
    showModerationWarning,
    isWarningShown,
    clearWarning,
  };
}
