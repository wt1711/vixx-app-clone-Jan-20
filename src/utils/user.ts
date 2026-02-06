import { RoomMember } from 'matrix-js-sdk';

const BOT_USER_PATTERNS: RegExp[] = [
  /bot$/i, // ends with 'bot'
  /^@.*bot:/i, // starts with @...bot:
  /bridge/i, // contains 'bridge'
  /service/i, // contains 'service'
  /admin/i, // contains 'admin'
  /system/i, // contains 'system'
  /notification/i, // contains 'notification'
];

export const isBotUser = (userId: string): boolean =>
  BOT_USER_PATTERNS.some(pattern => pattern.test(userId));

export const isMatrixUserId = (userId: string): boolean =>
  !userId.includes('meta');

export const getImpersonatedUserId = (
  userId: string,
  members: RoomMember[],
): string => {
  if (members && isMatrixUserId(userId)) {
    return members.find(member => member.userId === userId)?.userId || userId;
  }
  return userId || '';
};
