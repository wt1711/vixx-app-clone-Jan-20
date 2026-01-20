import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from 'src/config';

export type ReportReason =
  | 'nudity'
  | 'hate_speech'
  | 'scam'
  | 'spam'
  | 'other';

type ReportOptionDetail = {
  id: ReportReason;
  label: string;
  detailTitle: string;
  description: string;
  bulletPoints: string[];
};

const REPORT_OPTIONS: ReportOptionDetail[] = [
  {
    id: 'nudity',
    label: 'Nudity or sexual activity',
    detailTitle: 'Nudity or sexual activity',
    description:
      'Send recent messages from this conversation to VIXX for review.',
    bulletPoints: [
      'Sharing or requesting nude or sexually explicit content.',
      'Offering or soliciting sexual services.',
      'Sharing non-consensual intimate imagery.',
    ],
  },
  {
    id: 'hate_speech',
    label: 'Hate speech, symbols, bullying or harassment',
    detailTitle: 'Hate speech or harassment',
    description:
      'Send recent messages from this conversation to VIXX for review.',
    bulletPoints: [
      'Attacking people based on race, ethnicity, national origin, sex, gender, or religion.',
      'Using hateful slurs, symbols, or imagery.',
      'Repeated unwanted contact or targeting someone with degrading content.',
    ],
  },
  {
    id: 'scam',
    label: 'Scam or fraud',
    detailTitle: 'Scam or fraud',
    description:
      'Send recent messages from this conversation to VIXX for review.',
    bulletPoints: [
      'Attempting to deceive or trick people out of money or personal information.',
      'Impersonating someone else to gain trust.',
      'Promoting fake giveaways, prizes, or investment schemes.',
    ],
  },
  {
    id: 'spam',
    label: 'Spam',
    detailTitle: 'Spam',
    description:
      'Send recent messages from this conversation to VIXX for review.',
    bulletPoints: [
      'Buying, selling or giving away accounts, roles or permissions.',
      'Encouraging people to engage with content under false pretenses.',
      'Directing people away from VIXX through the misleading use of links.',
    ],
  },
  {
    id: 'other',
    label: 'Something else',
    detailTitle: 'Everyone deserves to feel safe',
    description:
      "If you don't see your problem listed, you can still report the chat.",
    bulletPoints: [
      "We'll use automation or a review team to check recent messages for anything not allowed on VIXX.",
      "If you or someone you know is in immediate danger, call local emergency services. Don't wait.",
    ],
  },
];

export type ReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectReason: (reason: ReportReason) => void;
};

export function ReportModal({
  visible,
  onClose,
  onSelectReason,
}: ReportModalProps) {
  const [selectedOption, setSelectedOption] =
    useState<ReportOptionDetail | null>(null);
  const insets = useSafeAreaInsets();

  const handleSelectOption = (option: ReportOptionDetail) => {
    setSelectedOption(option);
  };

  const handleBack = () => {
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSelectReason(selectedOption.id);
      setSelectedOption(null);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Handle indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            {selectedOption && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color={colors.text.primary} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Report</Text>
          </View>

          {selectedOption ? (
            // Detail View
            <>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>
                  {selectedOption.detailTitle}
                </Text>
                <Text style={styles.detailDescription}>
                  {selectedOption.description}
                </Text>
                <Text style={styles.actionText}>We take action if we find:</Text>
                <View style={styles.bulletContainer}>
                  {selectedOption.bulletPoints.map((point, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Submit button */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Submit report</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // List View
            <>
              <View style={styles.descriptionContainer}>
                <Text style={styles.subtitle}>Select a problem to report</Text>
                <Text style={styles.description}>
                  You can report this chat if you think it goes against
                  community standards. We won't notify the account that you
                  submitted this report.
                </Text>
              </View>

              <ScrollView
                style={styles.optionsContainer}
                showsVerticalScrollIndicator={false}
              >
                {REPORT_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionItem,
                      index === REPORT_OPTIONS.length - 1 &&
                        styles.optionItemLast,
                    ]}
                    onPress={() => handleSelectOption(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <ChevronRight size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.transparent.black60,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.transparent.white30,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  optionItemLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  // Detail view styles
  detailContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  bulletContainer: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
