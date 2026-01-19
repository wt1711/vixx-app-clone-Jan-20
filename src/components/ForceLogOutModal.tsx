import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from 'src/theme';

const ForceLogOutModal = ({ visible }: { visible: boolean }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Loging Out</Text>
            <Text style={styles.description}>
              Your session has expired. Please log in again.
            </Text>
            <ActivityIndicator size="large" color={colors.fallback.blue} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: colors.text.white,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: colors.text.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.transparent.black60,
    padding: 20,
    borderRadius: 10,
  },
});

export default ForceLogOutModal;
