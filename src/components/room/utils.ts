import { Room } from 'matrix-js-sdk';
import { getEventReactions } from '../../utils/room';
import { ReactionData } from './types';

/**
 * Format timestamp with day abbreviation and time
 * e.g., "MON 14:30"
 */
export const formatTimeWithDay = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day} ${time}`;
};

/**
 * Get initials from a name (max 2 characters)
 * e.g., "John Doe" -> "JD"
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get reactions for a specific event in a room
 */
export const getReactionsForEvent = (
  room: Room,
  targetEventId: string,
  myUserId: string,
): ReactionData[] => {
  try {
    const relations = getEventReactions(room, targetEventId);
    if (!relations) return [];

    const sortedReactions = relations.getSortedAnnotationsByKey() || [];
    return sortedReactions
      .map(([key, eventsSet]) => {
        const events = Array.from(eventsSet);
        const myReaction = events.find(e => e.getSender() === myUserId);
        return {
          key: key as string,
          count: events.length,
          myReaction: !!myReaction,
        };
      })
      .filter(r => r.count > 0);
  } catch (error) {
    console.info('Error getting reactions:', error);
    return [];
  }
};
