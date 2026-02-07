import { Room } from 'matrix-js-sdk';
import { getEventReactions } from 'src/utils/message';
import { ReactionData } from 'src/components/room/types';

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
