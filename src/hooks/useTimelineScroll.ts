import { useRef, useState, useEffect, useCallback } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { MessageItem } from '../components/room/types';

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
 * Hook that manages all timeline scroll behavior:
 * - Initial scroll to bottom
 * - Auto-scroll on new messages (if near bottom or own message)
 * - Scroll to specific event
 * - Load more messages on scroll to top
 * - Show/hide scroll-to-bottom button
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
  const isInitialLoad = useRef(true);
  const initialScrollAttempts = useRef(0);
  const isNearBottom = useRef(true);
  const prevLastMessageId = useRef<string | null>(null);
  const showScrollButtonRef = useRef(false);
  const loadMoreDebounced = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom after initial load (with retry for maintainVisibleContentPosition compatibility)
  useEffect(() => {
    if (!loading && isInitialLoad.current && messages.length > 0) {
      const scrollToEnd = () => {
        flatListRef.current?.scrollToEnd({ animated: false });
        initialScrollAttempts.current++;

        // Retry a few times to ensure scroll works with maintainVisibleContentPosition
        if (initialScrollAttempts.current < 3) {
          setTimeout(scrollToEnd, 100);
        } else {
          isInitialLoad.current = false;
        }
      };

      // Start with a longer delay to let FlatList settle
      setTimeout(scrollToEnd, 150);
    }
  }, [loading, messages.length]);

  // Scroll to specific event if targetEventId is provided
  useEffect(() => {
    if (targetEventId && messages.length > 0) {
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
  }, [targetEventId, messages]);

  // Auto-scroll to bottom when new messages arrive (not when loading older messages)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.eventId ?? null;

    // Only trigger if the last message changed (new message at the end)
    const hasNewMessage =
      lastMessageId !== null && lastMessageId !== prevLastMessageId.current;
    prevLastMessageId.current = lastMessageId;

    if (!hasNewMessage || isInitialLoad.current) return;

    if (shouldAutoScroll(isNearBottom.current, lastMessage?.isOwn ?? false)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

      // Track if user is near bottom
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottom.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;

      // Only update state when visibility actually changes (avoid re-renders)
      const shouldShowButton = distanceFromBottom > layoutMeasurement.height;
      if (shouldShowButton !== showScrollButtonRef.current) {
        showScrollButtonRef.current = shouldShowButton;
        setShowScrollButton(shouldShowButton);
      }

      // Load more when near top (with debounce to prevent rapid re-triggers)
      if (
        contentOffset.y < NEAR_TOP_THRESHOLD &&
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

  // Handle content size changes (backup for initial scroll)
  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      // Only scroll on initial load when we have content
      if (isInitialLoad.current && messages.length > 0 && height > 0) {
        flatListRef.current?.scrollToEnd({ animated: false });
      }
    },
    [messages.length],
  );

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  return {
    flatListRef,
    showScrollButton,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
  };
}
