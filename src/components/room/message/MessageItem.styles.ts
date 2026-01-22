import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from 'src/config';

// Static glow style for analysis mode (subtle off-white)
export const analysisGlowStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.25)',
  shadowColor: '#FFFFFF',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
};

export const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-end',
    overflow: 'visible', // Allow SmartMomentBadge to render in margins
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
    overflow: 'visible', // Allow SmartMomentBadge to render outside bounds
  },
  messageBubble: {
    // Note: removed overflow: 'hidden' to prevent shadow clipping issues
  },
  messageBubbleOwn: {
    backgroundColor: colors.message.own,
    borderRadius: 20,
    // Slightly sharper bottom-right for own messages
    borderBottomRightRadius: 6,
    // Subtle glow to lift off carbon fibre background
    shadowColor: colors.shadow.cyanGlow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  messageBubbleOther: {
    backgroundColor: colors.message.other,
    // Notched corner: sharp bottom-left, rounded elsewhere
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  messageBubbleContentImage: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messageBubbleContentVideo: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messageBubbleVideo: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  messageBubbleInstagramStory: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: colors.transparent.white10,
  },
  messageImageOwn: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  messageImageOther: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageImageWithRatio: {
    maxWidth: 250,
    maxHeight: 300,
    width: '100%',
  },
  messageVideo: {
    backgroundColor: colors.transparent.white06,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.transparent.white12,
  },
  messageVideoWithRatio: {
    maxWidth: 150,
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
  linkText: {
    textDecorationLine: 'underline',
  },
  replyPreviewContainer: {
    marginBottom: 4,
    maxWidth: '75%',
  },
  replyPreviewOwn: {
    alignSelf: 'flex-end',
  },
  replyPreviewOther: {
    alignSelf: 'flex-start',
  },
  videoThumbnailPlaceholder: {
    backgroundColor: colors.background.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnailPlayIcon: {
    color: colors.text.primary,
    fontSize: 48,
  },
  videoThumbnailOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  videoPlayButton: {
    // width: 56,
    // height: 56,
    // borderRadius: 28,
    // backgroundColor: colors.transparent.black50,
    // justifyContent: 'center',
    // alignItems: 'center',
    marginBottom: 8,
  },
  videoMessageLabel: {
    color: colors.transparent.white90,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoDownloadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.black50,
  },
  videoDownloadingText: {
    color: colors.text.primary,
    marginTop: 10,
  },
  videoErrorOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.black50,
  },
  videoErrorText: {
    color: colors.text.primary,
    textAlign: 'center',
    padding: 20,
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderTopColor: colors.transparent.white08, // subtle white top highlight
    borderLeftColor: colors.transparent.white05, // subtle white left
    borderBottomColor: colors.transparent.white12, // white catchlight bottom
    borderRightColor: colors.transparent.white08, // white catchlight right
  },
  stealthBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderTopColor: colors.transparent.white08, // subtle white top
    borderLeftColor: colors.transparent.white05, // subtle white left
    borderBottomColor: colors.transparent.white12, // white catchlight bottom
    borderRightColor: colors.transparent.white08, // white catchlight right
  },
  // System message styles (welcome message, etc.) - whiter frosted glass like reasoning pill
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  systemMessageBubble: {
    backgroundColor: colors.transparent.white12, // whiter frosted glass
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: '90%',
    overflow: 'hidden',
  },
  systemMessageBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderTopColor: colors.transparent.white20, // brighter white top
    borderLeftColor: colors.transparent.white12, // white left
    borderBottomColor: colors.transparent.white25, // bright white catchlight bottom
    borderRightColor: colors.transparent.white15, // white right
  },
  systemMessageText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  wavingHand: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
});
