/**
 * Edit Feedback Screen
 *
 * This screen allows a user to edit a previously submitted piece of feedback.
 * It fetches the existing feedback data and pre-populates the form.
 */
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetMyFeedbackQuery, useUpdateFeedbackMutation } from '@features/feedback/feedbackApi';
import { spacing, layout } from '@theme/spacing';
import { textStyles } from '@theme/typography';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FullScreenLoader } from '@components/common/FullScreenLoader';

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum(['bug', 'feature', 'general']),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function EditFeedbackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const feedbackId = String(id);
  const { data: myFeedbackData, isLoading: isLoadingFeedback } = useGetMyFeedbackQuery();
  const feedbackData = myFeedbackData?.data.feedback?.find((f) => f._id === feedbackId);
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 5,
      category: 'general',
      comment: '',
    },
  });

  React.useEffect(() => {
    if (!feedbackData) return;
    const category = (Object.keys(feedbackData.category_ratings ?? {})[0] ?? 'general') as FeedbackForm['category'];
    reset({
      rating: feedbackData.rating,
      category,
      comment: feedbackData.comment ?? '',
    });
  }, [feedbackData, reset]);

  const onSubmit = async (data: FeedbackForm) => {
    try {
      await updateFeedback({ id: feedbackId, feedback: data }).unwrap();
      Alert.alert('Feedback Updated', 'Your feedback has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Update Failed', 'Could not update your feedback. Please try again.');
    }
  };

  if (isLoadingFeedback) {
      return <FullScreenLoader />;
  }

  if (!feedbackData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Edit Feedback</Text>
          <Text>Feedback not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Feedback</Text>
        
        <Controller name="rating" control={control} render={({ field: { onChange, value } }) => (
          <TextInput label="Rating (1-5)" value={value.toString()} onChangeText={text => onChange(parseInt(text, 10))} keyboardType="numeric" />
        )} />
        {errors.rating && <HelperText type="error">{errors.rating.message}</HelperText>}

        <Controller name="category" control={control} render={({ field: { onChange, value } }) => (
          <TextInput label="Category (bug, feature, general)" value={value} onChangeText={onChange} />
        )} />
        {errors.category && <HelperText type="error">{errors.category.message}</HelperText>}

        <Controller name="comment" control={control} render={({ field: { onChange, onBlur, value } }) => (
          <TextInput label="Comment" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={4} />
        )} />
        {errors.comment && <HelperText type="error">{errors.comment.message}</HelperText>}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isUpdating} style={styles.button}>
          Update
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: spacing[4],
    gap: spacing[4],
  },
  title: {
    ...textStyles.h4,
    marginBottom: spacing[4],
  },
  button: {
    marginTop: spacing[6],
  },
});
