import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { X } from 'lucide-react-native';
import { colors } from '../theme';
import { CarbonFiberTexture } from './ui/NoiseTexture';

interface LoginCredentialsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const LoginCredentialsModal = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}: LoginCredentialsModalProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(username, password);
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalContainer}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background.black }]} />
          <CarbonFiberTexture opacity={0.6} scale={0.5} />
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor={colors.background.black}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color={colors.text.white} size={24} />
            </TouchableOpacity>

            <Text style={styles.title}>Login</Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.transparent.white50}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.transparent.white50}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.transparent.black60,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text.white,
  },
  input: {
    backgroundColor: colors.transparent.white10,
    borderWidth: 1,
    borderColor: colors.transparent.white20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: colors.text.white,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: colors.transparent.white20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default LoginCredentialsModal;
