/**
 * Exercise Day Component
 * Displays the exercises for a single day in a weekly plan.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, DataTable, Icon } from 'react-native-paper';
import { Card } from '@components/common/Card';
import { spacing } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

type WeeklySchedule = {
  day: string;
  activity_type?: string;
  details?: string;
  exercises: Array<{
    name: string;
    sets?: number | string;
    reps?: number | string;
    duration?: number | string;
  }>;
};

interface ExerciseDayProps {
  day: WeeklySchedule;
}

const activityIcons = {
  'Cardio': 'run',
  'Strength Training': 'dumbbell',
  'Flexibility': 'yoga',
  'Rest': 'bed',
} as Record<string, string>;

export function ExerciseDay({ day }: ExerciseDayProps) {
  const activityType = day.activity_type ?? 'Workout';
  const isRestDay = activityType === 'Rest';
  
  const cardStyle = isRestDay 
    ? { ...styles.card, ...styles.restCard } 
    : styles.card;

  return (
    <Card style={cardStyle}>
      <View style={styles.header}>
        <Text style={styles.dayTitle}>{day.day}</Text>
        <View style={styles.activityContainer}>
          <Icon source={activityIcons[activityType] || 'weight-lifter'} size={16} />
          <Text style={styles.activityType}>{activityType}</Text>
        </View>
      </View>
      
      {isRestDay ? (
        <Text style={styles.restText}>{day.details}</Text>
      ) : (
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title>Exercise</DataTable.Title>
            <DataTable.Title numeric>Sets</DataTable.Title>
            <DataTable.Title numeric>Reps/Time</DataTable.Title>
          </DataTable.Header>

          {day.exercises.map((ex, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{ex.name}</DataTable.Cell>
              <DataTable.Cell numeric>{ex.sets}</DataTable.Cell>
              <DataTable.Cell numeric>{ex.reps || ex.duration}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
  },
  restCard: {
    backgroundColor: colors.light.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  dayTitle: {
    ...textStyles.h6,
    color: colors.light.text.primary,
    textTransform: 'capitalize',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  activityType: {
    ...textStyles.body2,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  tableHeader: {
    backgroundColor: colors.light.background.secondary,
  },
  restText: {
    ...textStyles.body1,
    color: colors.light.text.secondary,
    padding: spacing[4],
    textAlign: 'center',
  },
});
