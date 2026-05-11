/**
 * My Feedback Screen
 *
 * This screen displays a list of the user's previously submitted feedback,
 * allowing them to view, edit, or delete their submissions.
 */
import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetMyFeedbackQuery, useDeleteFeedbackMutation } from '@features/feedback/feedbackApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, layout } from '@theme/spacing';
import { textStyles } from '@theme/typography';
import type { Feedback } from '@app-types/api';
import { useRouter } from 'expo-router';

export default function MyFeedbackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useGetMyFeedbackQuery();
  const [deleteFeedback] = useDeleteFeedbackMutation();

  const handleDelete = (id: string) => {
    Alert.alert('Delete Feedback', 'Are you sure you want to delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteFeedback(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Feedback }) => (
    <Card style={styles.card}>
      <Card.Title
        title={`Rating: ${item.rating}/5`}
        subtitle={`Categories: ${Object.keys(item.category_ratings ?? {}).join(', ') || '—'}`}
        right={(props) => (
          <View style={{ flexDirection: 'row' }}>
            <IconButton {...props} icon="pencil" onPress={() => router.push(`/feedback/edit/${item._id}`)} />
            <IconButton
              {...props}
              icon="delete"
              iconColor={theme.colors.error}
              onPress={() => handleDelete(item._id)}
            />
          </View>
        )}
      />
      <Card.Content>
        <Text>{item.comment}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>My Feedback</Text>
          <Button mode="contained" onPress={() => router.push('/feedback')}>Submit New</Button>
        </View>
        {isLoading ? (
          <FullScreenLoader />
        ) : isError ? (
          <ErrorState onRetry={refetch} error="Failed to load your feedback." />
        ) : (
          <FlatList
            data={data?.data.feedback ?? []}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={<Text style={styles.emptyText}>You haven't submitted any feedback yet.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    ...textStyles.h4,
  },
  card: {
    marginBottom: spacing[4],
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing[8],
    ...textStyles.body1,
  },
});
