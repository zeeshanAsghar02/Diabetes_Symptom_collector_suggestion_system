/**
 * Health Metric Card Component
 * Displays a single health metric with its latest reading.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { Card } from '@components/common/Card';
import { spacing } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import type { HealthMetric, MetricType } from '@app-types/api';

interface HealthMetricCardProps {
  metric: MetricType;
  latestReading?: HealthMetric;
  onLogPress: () => void;
}

const metricDetails: Record<string, { title: string; unit: string; icon: string }> = {
  blood_glucose: {
    title: 'Blood Glucose',
    unit: 'mg/dL',
    icon: 'water-percent',
  },
  hba1c: {
    title: 'HbA1c',
    unit: '%',
    icon: 'test-tube',
  },
  blood_pressure: {
    title: 'Blood Pressure',
    unit: 'mmHg',
    icon: 'heart-pulse',
  },
  weight: {
    title: 'Weight',
    unit: 'kg',
    icon: 'scale-bathroom',
  },
  steps: {
    title: 'Steps',
    unit: 'steps',
    icon: 'walk',
  },
  distance: {
    title: 'Distance',
    unit: 'km',
    icon: 'map-marker-distance',
  },
  calories_burned: {
    title: 'Calories Burned',
    unit: 'kcal',
    icon: 'fire',
  },
  sleep_time: {
    title: 'Sleep Time',
    unit: 'hours',
    icon: 'sleep',
  },
  heart_rate: {
    title: 'Heart Rate',
    unit: 'bpm',
    icon: 'heart-pulse',
  },
};

export function HealthMetricCard({ metric, latestReading, onLogPress }: HealthMetricCardProps) {
  const details = metricDetails[metric];

  const formatValue = (value: any) => {
    if (metric === 'blood_pressure' && value.systolic && value.diastolic) {
      return `${value.systolic}/${value.diastolic}`;
    }
    return value;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source={details.icon} size={24} color={colors.primary[600]} />
        <Text style={styles.title}>{details.title}</Text>
      </View>
      <View style={styles.content}>
        {latestReading ? (
          <>
            <View style={styles.reading}>
              <Text style={styles.value}>{formatValue(latestReading.value)}</Text>
              <Text style={styles.unit}>{details.unit}</Text>
            </View>
            <Text style={styles.date}>
              {`Last logged: ${new Date(latestReading.timestamp).toLocaleDateString()}`}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>No data yet</Text>
        )}
      </View>
      <Button mode="contained" onPress={onLogPress} style={styles.button}>
        Log New Reading
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[6],
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h6,
    color: colors.light.text.primary,
  },
  content: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  reading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
  },
  value: {
    ...textStyles.h2,
    color: colors.primary[600],
  },
  unit: {
    ...textStyles.body1,
    color: colors.light.text.secondary,
  },
  date: {
    ...textStyles.caption,
    color: colors.light.text.tertiary,
    marginTop: spacing[1],
  },
  noData: {
    ...textStyles.body1,
    color: colors.light.text.tertiary,
    marginVertical: spacing[6],
  },
  button: {
    marginTop: 'auto',
  },
});

