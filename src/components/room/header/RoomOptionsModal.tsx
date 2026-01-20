import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import { Flag, Ban } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Room } from 'matrix-js-sdk';
import { colors } from 'src/config';
import { ReportModal, ReportReason } from '../message/ReportModal';
import { apiSubmitReport } from 'src/services/api';
import { getMatrixClient } from 'src/services/matrixClient';

const REASON_LABELS: Record<ReportReason, string> = {
  nudity: 'Nudity or sexual activity',
  hate_speech: 'Hate speech or harassment',
  scam: 'Scam or fraud',
  spam: 'Spam',
  other: 'Other',
};

type RoomOptionsModalProps = {
  visible: boolean;
  room: Room;
  onClose: () => void;
};

export function RoomOptionsModal({
  visible,
  room,
  onClose,
}: RoomOptionsModalProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const insets = useSafeAreaInsets();

  const handleBlock = () => {
    onClose();
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${room.name || 'this user'}? You will no longer receive messages from them.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual block functionality
            console.info('Block user:', room.roomId);
            Alert.alert('Blocked', 'User has been blocked.');
          },
        },
      ],
    );
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleReportReasonSelect = async (reason: ReportReason) => {
    setShowReportModal(false);
    onClose();

    const mx = getMatrixClient();
    const reporterUserId = mx?.getUserId() || 'Unknown';
    // Extract username: @instagram_56911609594:server → 56911609594
    const reporterUsername = reporterUserId
      .replace(/^@/, '')
      .split(':')[0]
      .replace(/^instagram_/, '');

    try {
      await apiSubmitReport({
        email: 'support@vixx.app',
        reason: REASON_LABELS[reason],
        description: `User ${reporterUsername} has submitted a content report.
          At: ${new Date().toISOString()}
          Reported User: ${room.name}
        `,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it shortly.',
      );
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert(
        'Report Failed',
        'Unable to submit your report. Please try again later.',
      );
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    onClose();
  };

  // Position the dropdown below the header (safe area + header height)
  const dropdownTop = insets.top + 56;

  return (
    <>
      <Modal
        visible={visible && !showReportModal}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          {/* Background overlay - tappable to close */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          {/* Dropdown menu - positioned top right */}
          <View style={[styles.dropdown, { top: dropdownTop }]}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleBlock}
              activeOpacity={0.7}
            >
              <Ban size={20} color={colors.text.primary} />
              <Text style={styles.optionLabel}>Block</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Flag size={20} color={colors.status.error} />
              <Text style={[styles.optionLabel, styles.optionLabelDanger]}>
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ReportModal
        visible={showReportModal}
        onClose={closeReportModal}
        onSelectReason={handleReportReasonSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.message.other,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  optionLabelDanger: {
    color: colors.status.error,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginHorizontal: 16,
  },
});
