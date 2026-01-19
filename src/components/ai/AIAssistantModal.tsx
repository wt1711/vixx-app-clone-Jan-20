import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Room } from 'matrix-js-sdk';
import { useAIAssistant } from 'src/context/AIAssistantContext';
import { colors } from 'src/theme';

type AIAssistantModalProps = {
  visible: boolean;
  onClose: () => void;
  room: Room;
};

export function AIAssistantModal({ visible, onClose }: AIAssistantModalProps) {
  const {
    inputValue,
    setInputValue,
    chatHistory,
    isLoading,
    generatedResponse,
    isGeneratingResponse,
    handleSend,
    generateInitialResponse,
    regenerateResponse,
    handleUseSuggestion,
    clearChatHistory,
  } = useAIAssistant();

  const showEmptyState = chatHistory.length === 0 && !generatedResponse;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>AI Assistant</Text>
            <View style={styles.headerActions}>
              {chatHistory.length > 0 && (
                <TouchableOpacity
                  onPress={clearChatHistory}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {showEmptyState ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Ask me anything about this conversation
                </Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => generateInitialResponse()}
                  disabled={isGeneratingResponse}
                >
                  {isGeneratingResponse ? (
                    <ActivityIndicator color={colors.modal.background} />
                  ) : (
                    <Text style={styles.generateButtonText}>
                      Generate Response
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {generatedResponse && (
                  <View style={styles.generatedResponseContainer}>
                    <Text style={styles.generatedResponseLabel}>
                      Generated Response:
                    </Text>
                    <Text style={styles.generatedResponseText}>
                      {generatedResponse}
                    </Text>
                    <View style={styles.generatedResponseActions}>
                      <TouchableOpacity
                        style={styles.useButton}
                        onPress={() => handleUseSuggestion(generatedResponse)}
                      >
                        <Text style={styles.useButtonText}>Use This</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.regenerateButton}
                        onPress={() => regenerateResponse()}
                        disabled={isGeneratingResponse}
                      >
                        {isGeneratingResponse ? (
                          <ActivityIndicator color={colors.accent.instagram} />
                        ) : (
                          <Text style={styles.regenerateButtonText}>
                            Regenerate
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {chatHistory.length > 0 && (
                  <FlatList
                    data={chatHistory}
                    keyExtractor={(item, index) => `${item.sender}-${index}`}
                    renderItem={({ item }) => (
                      <View
                        style={[
                          styles.messageBubble,
                          item.sender === 'user'
                            ? styles.messageUser
                            : styles.messageAI,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            item.sender === 'user'
                              ? styles.messageTextUser
                              : styles.messageTextAI,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </View>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask AI assistant..."
              placeholderTextColor={colors.modal.textPlaceholder}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputValue.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.modal.background}
                />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modal.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.modal.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.modal.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.modal.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: colors.modal.textSecondary,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.modal.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.modal.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: colors.accent.instagram,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: colors.modal.background,
    fontSize: 16,
    fontWeight: '600',
  },
  generatedResponseContainer: {
    backgroundColor: colors.modal.surfaceLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  generatedResponseLabel: {
    fontSize: 12,
    color: colors.modal.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  generatedResponseText: {
    fontSize: 15,
    color: colors.modal.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  generatedResponseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  useButton: {
    flex: 1,
    backgroundColor: colors.accent.instagram,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  useButtonText: {
    color: colors.modal.background,
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: colors.modal.background,
    borderWidth: 1,
    borderColor: colors.accent.instagram,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: colors.accent.instagram,
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageUser: {
    backgroundColor: colors.accent.instagram,
    alignSelf: 'flex-end',
  },
  messageAI: {
    backgroundColor: colors.modal.surfaceLighter,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.modal.background,
  },
  messageTextAI: {
    color: colors.modal.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.modal.border,
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.modal.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.modal.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.accent.instagram,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.modal.background,
    fontSize: 15,
    fontWeight: '600',
  },
});
