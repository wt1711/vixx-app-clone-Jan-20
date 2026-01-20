import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from 'src/config';

export type ReportReason =
  | 'nudity'
  | 'hate_speech'
  | 'scam'
  | 'hacked'
  | 'violence'
  | 'illegal_goods'
  | 'bullying'
  | 'intellectual_property'
  | 'self_harm';

type ReportOption = {
  id: ReportReason;
  label: string;
};

const REPORT_OPTIONS: ReportOption[] = [
  { id: 'nudity', label: 'Nudity or sexual activity' },
  { id: 'hate_speech', label: 'Hate speech or symbols' },
  { id: 'scam', label: 'Scam or fraud' },
  { id: 'hacked', label: 'Account may have been hacked' },
  { id: 'violence', label: 'Violence or dangerous organizations' },
  { id: 'illegal_goods', label: 'Sale of illegal or regulated goods' },
  { id: 'bullying', label: 'Bullying or harassment' },
  { id: 'intellectual_property', label: 'Intellectual property violation' },
  { id: 'self_harm', label: 'Suicide, self-injury or eating disorder' },
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
  const handleSelectReason = (reason: ReportReason) => {
    onSelectReason(reason);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Handle indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Report</Text>
          </View>

          {/* Subtitle and description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.subtitle}>Select a problem to report</Text>
            <Text style={styles.description}>
              You can report this chat if you think it goes against our
              Community Standards. We won't notify the account that you
              submitted this report.
            </Text>
          </View>

          {/* Report options */}
          <ScrollView
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            {REPORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index === REPORT_OPTIONS.length - 1 && styles.optionItemLast,
                ]}
                onPress={() => handleSelectReason(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <ChevronRight size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    paddingBottom: 34, // Safe area bottom
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
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
});
