import { useRef, useState, useEffect, useCallback } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { MessageItem } from '../components/room/types';

// For inverted list: offset 0 = bottom, large offset = top
const NEAR_BOTTOM_THRESHOLD = 350;
const NEAR_TOP_THRESHOLD = 100;

interface UseTimelineScrollOptions {
  messages: MessageItem[];
  loading: boolean;
  loadingMore: boolean;
  canLoadMore: boolean;
  loadMoreMessages: () => Promise<void>;
  targetEventId?: string;
}

interface UseTimelineScrollReturn {
  flatListRef: React.RefObject<FlatList<any> | null>;
  showScrollButton: boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleContentSizeChange: (width: number, height: number) => void;
  scrollToBottom: () => void;
}

/**
 * Determines if we should auto-scroll to bottom when new messages arrive.
 */
function shouldAutoScroll(isNearBottom: boolean, isOwnMessage: boolean): boolean {
  return isOwnMessage || isNearBottom;
}

/**
 * Hook that manages all timeline scroll behavior for an INVERTED FlatList:
 * - Auto-scroll on new messages (if near bottom or own message)
 * - Scroll to specific event
 * - Load more messages on scroll to visual top (far from offset 0)
 * - Show/hide scroll-to-bottom button
 *
 * Note: For inverted FlatList, offset 0 = visual bottom, large offset = visual top
 */
export function useTimelineScroll({
  messages,
  loading,
  loadingMore,
  canLoadMore,
  loadMoreMessages,
  targetEventId,
}: UseTimelineScrollOptions): UseTimelineScrollReturn {
  const flatListRef = useRef<FlatList>(null);
  const isNearBottom = useRef(true);
  // Track first message (newest) for new message detection in inverted list
  const prevFirstMessageId = useRef<string | null>(null);
  const showScrollButtonRef = useRef(false);
  const loadMoreDebounced = useRef(false);
  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to specific event if targetEventId is provided
  useEffect(() => {
    if (targetEventId && messages.length > 0 && !loading) {
      const targetIndex = messages.findIndex(m => m.eventId === targetEventId);
      if (targetIndex >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
          });
        }, 200);
      }
    }
  }, [targetEventId, messages, loading]);

  // Auto-scroll to bottom when new messages arrive
  // For inverted list, new messages appear at index 0 (first in array)
  useEffect(() => {
    const firstMessage = messages[0];
    const firstMessageId = firstMessage?.eventId ?? null;

    // Only trigger if the first message changed (new message arrived)
    const hasNewMessage =
      firstMessageId !== null && firstMessageId !== prevFirstMessageId.current;
    prevFirstMessageId.current = firstMessageId;

    if (!hasNewMessage) return;

    if (shouldAutoScroll(isNearBottom.current, firstMessage?.isOwn ?? false)) {
      setTimeout(() => {
        // For inverted list, bottom is at offset 0
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      // Cache dimensions for load-more calculation
      contentHeight.current = contentSize.height;
      layoutHeight.current = layoutMeasurement.height;

      // For inverted list: offset 0 = bottom, so "near bottom" = small offset
      isNearBottom.current = contentOffset.y < NEAR_BOTTOM_THRESHOLD;

      // Show scroll button when far from bottom (large offset)
      const shouldShowButton = contentOffset.y > layoutMeasurement.height;
      if (shouldShowButton !== showScrollButtonRef.current) {
        showScrollButtonRef.current = shouldShowButton;
        setShowScrollButton(shouldShowButton);
      }

      // Load more when near visual top (for inverted list, this means large offset)
      // Visual top = far end of scrollable content
      const distanceFromTop =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (
        distanceFromTop < NEAR_TOP_THRESHOLD &&
        canLoadMore &&
        !loadingMore &&
        !loadMoreDebounced.current
      ) {
        loadMoreDebounced.current = true;
        loadMoreMessages().finally(() => {
          // Reset debounce after a delay
          setTimeout(() => {
            loadMoreDebounced.current = false;
          }, 500);
        });
      }
    },
    [canLoadMore, loadingMore, loadMoreMessages],
  );

  // Handle content size changes (no-op for inverted list, kept for interface compatibility)
  const handleContentSizeChange = useCallback(
    (_width: number, _height: number) => {
      // No initial scroll needed - inverted list starts at bottom automatically
    },
    [],
  );

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    // For inverted list, bottom is at offset 0
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  return {
    flatListRef,
    showScrollButton,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
  };
}
