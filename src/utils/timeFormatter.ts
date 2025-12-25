export type FormattedTime = {
  text: string;
  isRecent: boolean;
};

/**
 * Formats a timestamp into a human-readable relative time string
 * Returns both the formatted text and whether the time is recent (within 24 hours)
 */
export function formatRelativeTimeWithRecent(timestamp?: number): FormattedTime {
  if (!timestamp) return { text: '', isRecent: false };

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return { text: `${minutes}m ago`, isRecent: true };
  } else if (hours < 24) {
    return { text: `${hours}h ago`, isRecent: true };
  } else if (days === 1) {
    return { text: 'Yesterday', isRecent: false };
  } else if (days < 7) {
    return {
      text: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isRecent: false,
    };
  } else {
    return {
      text: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      isRecent: false,
    };
  }
}
