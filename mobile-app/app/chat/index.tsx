/**
 * AI Chat Screen
 * Interface for interacting with the AI assistant.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetChatHistoryQuery, useSendMessageMutation } from '@features/chat/chatApi';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@features/auth/authSlice';
import { ChatHeader } from '@components/chat/ChatHeader';
import { MessageBubble } from '@components/chat/MessageBubble';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import colors from '@theme/colors';

// Map API message format to GiftedChat format
const transformMessage = (msg: any, user: any): IMessage => ({
  _id: msg._id || Math.random(),
  text: msg.text,
  createdAt: new Date(msg.createdAt),
  user: {
    _id: msg.sender === 'user' ? (user?._id ?? 'anonymous') : 'ai-assistant',
    name: msg.sender === 'user' ? (user?.fullName ?? 'You') : 'Diabuddy',
    avatar: msg.sender === 'user' ? undefined : require('../../assets/icon.png'),
  },
});

export default function ChatScreen() {
  const user = useAppSelector(selectUser);
  const { data, isLoading, isError, refetch } = useGetChatHistoryQuery();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    if (data?.data && user) {
      const transformed = data.data.map(msg => transformMessage(msg, user)).reverse();
      setMessages(transformed);
    }
  }, [data, user]);

  const appendMessages = (previousMessages: IMessage[], newMessage: IMessage) => {
    const giftedChatAny = GiftedChat as any;
    return typeof giftedChatAny.append === 'function'
      ? giftedChatAny.append(previousMessages, newMessage)
      : [newMessage, ...previousMessages];
  };

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    setMessages((previousMessages) => appendMessages(previousMessages, userMessage));
    
    sendMessage({ message: userMessage.text })
      .unwrap()
      .then(aiResponse => {
        const aiMessage = transformMessage(aiResponse.data, user);
        setMessages((previousMessages) => appendMessages(previousMessages, aiMessage));
      })
      .catch(() => {
        // Handle error, maybe show a "failed to send" status on the message
        const errorMsg = {
          _id: Math.random(),
          text: 'Message failed to send. Please try again.',
          createdAt: new Date(),
          user: { _id: 'system', name: 'System' },
          system: true,
        };
        setMessages((previousMessages) => appendMessages(previousMessages, errorMsg as IMessage));
      });
  }, [sendMessage, user]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} error="Failed to load chat history." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ChatHeader />
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: user?._id || 'anonymous' }}
        isTyping={isSending}
        renderBubble={(props: any) => <MessageBubble {...props} />}
        placeholder="Ask me about diabetes management..."
        alwaysShowSend
        containerStyle={styles.chatContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background.primary,
  },
  chatContainer: {
    backgroundColor: colors.light.background.secondary,
  },
});
