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

  const handleReportReasonSelect = (reason: ReportReason) => {
    // TODO: Implement actual report submission to backend
    console.info('Report submitted:', {
      roomId: room.roomId,
      roomName: room.name,
      reason,
    });

    setShowReportModal(false);
    onClose();

    Alert.alert(
      'Report Submitted',
      'Thank you for your report. We will review it shortly.',
    );
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
