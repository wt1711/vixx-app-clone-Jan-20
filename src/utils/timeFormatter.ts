export type FormattedTime = {
  text: string;
  isRecent: boolean;
};

/**
 * Formats a timestamp into a human-readable relative time string
 * Returns both the formatted text and whether the time is recent (within 24 hours)
 */
export function formatRelativeTimeWithRecent(
  timestamp?: number,
): FormattedTime {
  if (!timestamp) return { text: '', isRecent: false };

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return { text: 'now', isRecent: true };
  } else if (minutes < 60) {
    return { text: `${minutes}m`, isRecent: true };
  } else if (hours < 24) {
    return { text: `${hours}h`, isRecent: true };
  } else if (days === 1) {
    return { text: 'Yesterday', isRecent: false };
  } else if (days < 7) {
    return {
      text: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isRecent: false,
    };
  } else {
    const isSameYear = date.getFullYear() === now.getFullYear();
    return {
      text: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(isSameYear ? {} : { year: 'numeric' }),
      }),
      isRecent: false,
    };
  }
}

/**
 * Formats a timestamp into a human-readable relative time string
 */
export function formatRelativeTime(ts: number): string {
  if (!ts) return '';

  const now = Date.now();
  const diffMs = now - ts;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    const date = new Date(ts);
    return date.toLocaleDateString();
  }
}

/**
 * Format timestamp with contextual date/time display
 * - Today: "14:30"
 * - Within 7 days: "MON 14:30"
 * - Same year: "Dec 25 AT 14:30"
 * - Different year: "Dec 25, 2023 AT 14:30"
 */
export function formatTimeWithDay(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Check if today
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return time;
  }

  // Check if within 7 days
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    const day = date
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toUpperCase();
    return `${day} ${time}`;
  }

  // Check if same year
  const isSameYear = date.getFullYear() === now.getFullYear();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  if (isSameYear) {
    return `${month} ${day} AT ${time}`;
  }

  // Different year
  return `${month} ${day}, ${date.getFullYear()} AT ${time}`;
}
