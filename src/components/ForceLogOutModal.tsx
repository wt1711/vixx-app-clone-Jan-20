import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const ForceLogOutModal = ({visible} : {visible: boolean}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="fullScreen"
    >
        <SafeAreaProvider>
        <SafeAreaView edges={['top','bottom']} style={styles.modalContainer}>
      <View style={styles.modalContent}>
      <Text style={styles.title}>Loging Out</Text>
        <Text style={styles.description}>Your session has expired. Please log in again.</Text>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: 'white',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        color: 'white',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    borderRadius: 10,
  },
})

export default ForceLogOutModal;