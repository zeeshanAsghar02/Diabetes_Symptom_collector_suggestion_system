/**
 * Generate Exercise Plan Screen
 * Form to generate a new exercise plan.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, RadioButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useGenerateExercisePlanMutation } from '@features/exercise/exercisePlanApi';
import { Card } from '@components/common/Card';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { spacing, layout } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

const exerciseGoalSchema = z.object({
  goal: z.enum(['weight_loss', 'muscle_gain', 'flexibility', 'cardio_health']),
});

type ExerciseGoalForm = z.infer<typeof exerciseGoalSchema>;

const goals = [
  { label: 'Weight Loss', value: 'weight_loss' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
  { label: 'Flexibility & Mobility', value: 'flexibility' },
  { label: 'Cardiovascular Health', value: 'cardio_health' },
];

export default function GenerateExercisePlanScreen() {
  const router = useRouter();
  const [generatePlan, { isLoading }] = useGenerateExercisePlanMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<ExerciseGoalForm>({
    resolver: zodResolver(exerciseGoalSchema),
    defaultValues: {
      goal: 'cardio_health',
    },
  });

  const handleGenerate = async (data: ExerciseGoalForm) => {
    try {
      const result = await generatePlan({ goal: data.goal }).unwrap();
      Alert.alert(
        'Plan Generated!',
        'Your personalized exercise plan has been created.',
        [
          {
            text: 'View Plan',
            onPress: () => router.replace(`/personalized/exercise-plan/${result.data._id}`),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Generation Failed', 'Could not generate an exercise plan. Please try again.');
    }
  };

  if (isLoading) {
    return <FullScreenLoader message="Generating your personalized plan..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate New Exercise Plan</Text>
          <Text style={styles.subtitle}>
            Select your primary fitness goal for this week.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>What is your main goal?</Text>
          
          <Controller
            control={control}
            name="goal"
            render={({ field: { onChange, value } }) => (
              <RadioButton.Group onValueChange={onChange} value={value}>
                {goals.map((g) => (
                  <RadioButton.Item key={g.value} label={g.label} value={g.value} />
                ))}
              </RadioButton.Group>
            )}
          />
          {errors.goal && <HelperText type="error">{errors.goal.message}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit(handleGenerate)}
            style={styles.generateButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Generate Plan
          </Button>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            Your exercise plan will be tailored based on your medical profile, including diabetes type, activity level, and selected goal. Make sure your profile is up-to-date for the best recommendations.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background.primary,
  },
  container: {
    flex: 1,
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[6],
  },
  title: {
    ...textStyles.h4,
    color: colors.primary[600],
  },
  subtitle: {
    ...textStyles.body2,
    color: colors.light.text.secondary,
  },
  card: {
    padding: spacing[6],
    marginBottom: spacing[6],
  },
  label: {
    ...textStyles.h6,
    marginBottom: spacing[4],
    color: colors.light.text.primary,
  },
  generateButton: {
    marginTop: spacing[6],
  },
  infoCard: {
    padding: spacing[4],
    backgroundColor: colors.info.main + '10',
  },
  infoText: {
    ...textStyles.body2,
    color: colors.light.text.secondary,
    lineHeight: 20,
  },
});
