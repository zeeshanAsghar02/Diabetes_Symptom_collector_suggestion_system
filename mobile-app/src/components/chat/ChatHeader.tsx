/**
 * Chat Header Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useClearChatHistoryMutation } from '@features/chat/chatApi';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { Alert } from 'react-native';

export function ChatHeader() {
  const [clearHistory, { isLoading }] = useClearChatHistoryMutation();

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to delete all messages in this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: () => clearHistory().unwrap().catch(() => Alert.alert("Error", "Failed to clear history."))
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Your personal health companion</Text>
      </View>
      <IconButton
        icon="delete-sweep"
        onPress={handleClearHistory}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.light.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border.light,
  },
  title: {
    ...textStyles.h6,
    color: colors.light.text.primary,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.light.text.secondary,
  },
});
