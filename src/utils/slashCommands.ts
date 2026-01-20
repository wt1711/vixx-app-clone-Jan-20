import { MsgType } from 'matrix-js-sdk';

export function parseMessageContent(text: string): {
  msgtype: MsgType;
  body: string;
} {
  // /me emote command
  if (text.startsWith('/me ')) {
    return { msgtype: MsgType.Emote, body: text.substring(4) };
  }

  // /notice command
  if (text.startsWith('/notice ')) {
    return { msgtype: MsgType.Notice, body: text.substring(8) };
  }

  // Inline replacements
  let body = text;

  if (body.includes('/shrug')) {
    body = body.replace('/shrug', '¯\\_(ツ)_/¯');
  }

  if (body.includes('/tableflip')) {
    body = body.replace('/tableflip', '(╯°□°)╯︵ ┻━┻');
  }

  if (body.includes('/unflip')) {
    body = body.replace('/unflip', '┬─┬ノ( º _ ºノ)');
  }

  return { msgtype: MsgType.Text, body };
}
