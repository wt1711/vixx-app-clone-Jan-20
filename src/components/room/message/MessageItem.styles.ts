import { StyleSheet } from 'react-native';

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 6,
  },
  messageBubbleOwn: {
    backgroundColor: '#123660',
  },
  messageBubbleOther: {
    backgroundColor: '#1A1D24',
    shadowColor: 'rgba(12, 20, 40, 0.6)',
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
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  imageContainer: {},
  messageImage: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#E4E7EB',
  },
  messageTextOther: {
    color: '#F3F4F6',
  },
});
