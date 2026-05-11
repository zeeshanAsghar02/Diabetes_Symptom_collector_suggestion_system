/**
 * AI Chat Screen
 * Clean chat interface with suggestion chips, markdown rendering, and source citations.
 * No emojis — MaterialCommunityIcons only.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGetChatHistoryQuery, useClearChatHistoryMutation } from '@features/chat/chatApi';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@features/auth/authSlice';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import colors from '@theme/colors';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import { getApiUrl } from '@utils/constants';
import { secureStorage } from '@utils/storage';
import { Alert } from 'react-native';

interface SourceItem {
  id: number | string;
  title: string;
  country?: string;
}

interface ChatMsg {
  _id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  sources?: SourceItem[];
  contextUsed?: boolean;
  createdAt: string;
}

const SUGGESTION_CHIPS = [
  { icon: 'food-apple-outline' as const, label: 'Diet Advice', query: 'Give me diet advice for managing diabetes' },
  { icon: 'run' as const, label: 'Exercise Tips', query: 'What exercises are recommended for diabetes management?' },
  { icon: 'pill' as const, label: 'Medications', query: 'Tell me about common diabetes medications' },
  { icon: 'chart-line' as const, label: 'Health Tracking', query: 'How should I track my blood sugar levels?' },
];

/**
 * Simple markdown-like renderer for AI responses.
 */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (/^[-•*]\s/.test(trimmed)) {
          return (
            <Text key={i} style={styles.mdBullet}>
              {'  \u2022  '}
              {renderInline(trimmed.replace(/^[-•*]\s/, ''))}
            </Text>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <Text key={i} style={styles.mdBullet}>
              {'  '}{renderInline(trimmed)}
            </Text>
          );
        }
        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <Text key={i} style={styles.mdHeading}>
              {renderInline(trimmed.replace(/^#{1,3}\s/, ''))}
            </Text>
          );
        }
        if (!trimmed) return <View key={i} style={{ height: 6 }} />;
        return (
          <Text key={i} style={styles.mdParagraph}>
            {renderInline(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <Text key={key++} style={{ fontWeight: '700' }}>
          {match[2]}
        </Text>
      );
    } else if (match[4]) {
      parts.push(
        <Text key={key++} style={{ fontStyle: 'italic' }}>
          {match[4]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export default function ChatScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const { data, isLoading, isError, refetch } = useGetChatHistoryQuery();
  const [clearHistory, { isLoading: isClearing }] = useClearChatHistoryMutation();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (data?.data) {
      setMessages(data.data as unknown as ChatMsg[]);
    }
  }, [data]);

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = useCallback(async (text?: string) => {
    const message = (text || inputText).trim();
    if (!message || isSending) return;
    setInputText('');

    const userMsg: ChatMsg = {
      _id: `user-${Date.now()}`,
      text: message,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToEnd();
    setIsSending(true);

    try {
      const token = await secureStorage.getAccessToken();
      const res = await fetch(`${getApiUrl()}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          history: messages.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });
      const json = await res.json();
      if (json.success && (json.reply || json.data)) {
        const aiMsg: ChatMsg = {
          _id: json.data?._id || `ai-${Date.now()}`,
          text: json.reply || json.data?.text || json.data?.reply || 'No response',
          sender: 'ai',
          sources: json.sources || json.data?.sources || [],
          contextUsed: json.context_used ?? json.data?.context_used ?? false,
          createdAt: json.data?.createdAt || new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(json.error || 'Failed');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          _id: `err-${Date.now()}`,
          text: 'Message failed to send. Please try again.',
          sender: 'system',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
      scrollToEnd();
    }
  }, [inputText, isSending, messages]);

  const handleClearHistory = () => {
    Alert.alert('Clear Chat', 'Delete all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () =>
          clearHistory()
            .unwrap()
            .then(() => setMessages([]))
            .catch(() => Alert.alert('Error', 'Failed to clear history.')),
      },
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMsg }) => {
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMsgRow}>
          <Text style={styles.systemMsgText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isUser && (
          <View style={styles.aiAvatarWrap}>
            <MaterialCommunityIcons name="robot-outline" size={16} color="#4E5180" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          {isUser ? (
            <Text style={styles.userText}>{item.text}</Text>
          ) : (
            <SimpleMarkdown text={item.text} />
          )}

          {/* Sources */}
          {!isUser && item.sources && item.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesLabel}>Sources:</Text>
              <View style={styles.sourcesRow}>
                {item.sources.map((src, idx) => (
                  <Chip
                    key={idx}
                    compact
                    textStyle={styles.sourceChipText}
                    style={styles.sourceChip}
                  >
                    [{src.id}] {(src.title || '').substring(0, 25)}
                    {src.country ? ` (${src.country})` : ''}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Context used badge */}
          {!isUser && item.contextUsed && (
            <View style={styles.contextBadge}>
              <MaterialCommunityIcons name="bookmark-check-outline" size={12} color={colors.success.dark} />
              <Text style={styles.contextBadgeText}>Based on guidelines</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load chat history." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={['#4E5180', '#3B3E64']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="rgba(255,255,255,0.9)" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Health Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isSending ? 'Analyzing...' : 'Ask about diabetes management'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClearHistory}
          disabled={isClearing}
          style={styles.clearBtn}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#F0F0F6', '#E5E5EF']}
              style={styles.emptyIconWrap}
            >
              <MaterialCommunityIcons name="robot-outline" size={40} color="#4E5180" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Welcome to Health Assistant</Text>
            <Text style={styles.emptySubtitle}>
              Ask about diabetes management, diet, exercise, medications, or symptoms
            </Text>
            <View style={styles.chipsGrid}>
              {SUGGESTION_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.label}
                  onPress={() => handleSend(chip.query)}
                  style={styles.suggestionChip}
                  activeOpacity={0.7}
                >
                  <View style={styles.chipIconWrap}>
                    <MaterialCommunityIcons name={chip.icon} size={16} color="#4E5180" />
                  </View>
                  <Text style={styles.suggestionChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={
              isSending ? (
                <View style={[styles.msgRow, styles.msgRowLeft]}>
                  <View style={styles.aiAvatarWrap}>
                    <MaterialCommunityIcons name="robot-outline" size={16} color="#4E5180" />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAi]}>
                    <ActivityIndicator size="small" color="#4E5180" />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <RNTextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor={colors.neutral[400]}
            multiline
            maxLength={1000}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="send"
              size={18}
              color={colors.neutral[0]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: { padding: spacing[3], paddingBottom: spacing[4] },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[3], gap: spacing[2] },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  aiAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bubble: { maxWidth: '78%', padding: spacing[3], borderRadius: borderRadius.md },
  bubbleUser: { backgroundColor: '#4E5180', borderBottomRightRadius: 4 },
  bubbleAi: {
    backgroundColor: colors.neutral[0],
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  userText: { fontSize: 14, lineHeight: 20, color: '#FFFFFF' },
  mdParagraph: { fontSize: 14, lineHeight: 20, color: colors.neutral[800], marginBottom: 2 },
  mdBullet: { fontSize: 14, lineHeight: 20, color: colors.neutral[800], marginBottom: 2 },
  mdHeading: { fontSize: 15, fontWeight: '700', color: colors.neutral[900], marginTop: 4, marginBottom: 2 },
  sourcesContainer: { marginTop: spacing[2], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  sourcesLabel: { fontSize: 11, fontWeight: '600', color: '#4E5180', marginBottom: 4 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  sourceChip: { backgroundColor: '#F0F0F6', borderWidth: 1, borderColor: '#D5D5E2', height: 26 },
  sourceChipText: { fontSize: 10, color: '#4E5180' },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing[2],
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: colors.success.bg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  contextBadgeText: { fontSize: 10, fontWeight: '500', color: colors.success.dark },
  systemMsgRow: { alignItems: 'center', marginVertical: spacing[2] },
  systemMsgText: { fontSize: 12, color: colors.neutral[400], fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[6] },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    justifyContent: 'center',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    width: '46%',
    justifyContent: 'center',
    ...shadows.xs,
  },
  chipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0F0F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[2],
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing[2],
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    fontSize: 14,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[50],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4E5180',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.neutral[300] },
});
