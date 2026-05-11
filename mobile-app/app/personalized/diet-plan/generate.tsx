/**
 * Generate Diet Plan Screen
 * Form to generate a new diet plan for a specific date.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useGenerateDietPlanMutation } from '@features/diet/dietPlanApi';
import { Card } from '@components/common/Card';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { spacing, layout } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

export default function GenerateDietPlanScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [generatePlan, { isLoading }] = useGenerateDietPlanMutation();

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleGenerate = async () => {
    try {
      const result = await generatePlan({ target_date: date.toISOString() }).unwrap();
      Alert.alert(
        'Plan Generated!',
        'Your personalized diet plan has been created.',
        [
          {
            text: 'View Plan',
            onPress: () => router.replace(`/personalized/diet-plan/${result.data._id}`),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Generation Failed', 'Could not generate a diet plan. Please try again.');
    }
  };

  if (isLoading) {
    return <FullScreenLoader message="Generating your personalized plan..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate New Diet Plan</Text>
          <Text style={styles.subtitle}>
            Select a date to create a personalized meal plan based on your health profile.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>Select Target Date</Text>
          
          {Platform.OS === 'android' && (
            <Button
              icon="calendar"
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              {date.toLocaleDateString()}
            </Button>
          )}

          {(showDatePicker || Platform.OS === 'ios') && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <Button
            mode="contained"
            onPress={handleGenerate}
            style={styles.generateButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Generate Plan
          </Button>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            Your diet plan will be tailored based on your medical profile, including diabetes type, activity level, and regional food preferences. Make sure your profile is up-to-date for the best recommendations.
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
  dateButton: {
    marginBottom: spacing[6],
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
