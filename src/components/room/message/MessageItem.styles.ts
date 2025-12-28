import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-end',
  },
  messageOwn: {
    justifyContent: 'flex-end',
  },
  messageOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageBubbleWrapper: {
    maxWidth: '75%',
  },
  messageBubble: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  messageBubbleOwn: {
    backgroundColor: colors.message.own,
  },
  messageBubbleOther: {
    backgroundColor: colors.message.other,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  messageBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageBubbleContentImage: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  timestampRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.transparent.white50,
    textAlign: 'center',
  },
  imageContainer: {},
  messageImage: {
    borderRadius: 20,
    backgroundColor: colors.transparent.white10,
  },
  messageImageWithRatio: {
    maxWidth: 250,
    maxHeight: 300,
    width: '100%',
  },
  messageImageDefault: {
    width: 250,
    height: 200,
  },
  imageCaption: {
    marginTop: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  messageTextOwn: {
    color: colors.text.messageOwn,
  },
  messageTextOther: {
    color: colors.text.messageOther,
  },
  replyIconContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.transparent.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyIconOwn: {
    right: '100%',
    marginRight: 8,
  },
  replyIconOther: {
    left: -40,
  },
});
