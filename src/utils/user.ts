import { MatrixClient, Room, RoomMember } from 'matrix-js-sdk';

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

const isMetaBridgedUser = (userId: string): boolean =>
  !!userId.match(/^@meta_\d+:/);

const getImpersonatedUserId = (
  userId: string,
  members: RoomMember[],
): string => {
  if (members && !isMetaBridgedUser(userId)) {
    return members.find(member => member.userId === userId)?.userId || userId;
  }
  return userId || '';
};

export const getMemberAvatarUrl = (
  mx: MatrixClient,
  room: Room,
  userId: string,
): string | undefined => {
  const member = room.getMember(
    getImpersonatedUserId(userId, room.getMembers()),
  );
  const avatarMxc = member?.getMxcAvatarUrl();
  if (!avatarMxc) return undefined;
  const avatarUrl = mx.mxcUrlToHttp(
    avatarMxc,
    96,
    96,
    'crop',
    undefined,
    false,
    true,
  );
  if (!avatarUrl) return undefined;
  return `${avatarUrl}&access_token=${mx.getAccessToken()}`;
};
