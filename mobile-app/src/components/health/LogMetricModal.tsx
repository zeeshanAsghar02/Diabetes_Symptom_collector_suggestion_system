/**
 * Log Metric Modal Component
 * A modal form to log a new health metric reading.
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useLogHealthMetricMutation } from '@features/health/healthApi';
import { spacing, layout } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import type { MetricType } from '@app-types/api';

interface LogMetricModalProps {
  metricType: MetricType;
  visible: boolean;
  onDismiss: () => void;
}

const metricSchemas = {
  blood_glucose: z.object({ value: z.number().min(20).max(600) }),
  hba1c: z.object({ value: z.number().min(3).max(20) }),
  blood_pressure: z.object({
    systolic: z.number().min(50).max(300),
    diastolic: z.number().min(30).max(200),
  }),
  weight: z.object({ value: z.number().min(20).max(500) }),
  steps: z.object({ value: z.number().min(0).max(100000) }),
  distance: z.object({ value: z.number().min(0).max(200) }),
  calories_burned: z.object({ value: z.number().min(0).max(10000) }),
  sleep_time: z.object({ value: z.number().min(0).max(24) }),
  heart_rate: z.object({ value: z.number().min(20).max(250) }),
};

const metricDetails: Record<string, { title: string; unit: string }> = {
  blood_glucose: { title: 'Blood Glucose', unit: 'mg/dL' },
  hba1c: { title: 'HbA1c', unit: '%' },
  blood_pressure: { title: 'Blood Pressure', unit: 'mmHg' },
  weight: { title: 'Weight', unit: 'kg' },
  steps: { title: 'Steps', unit: 'steps' },
  distance: { title: 'Distance', unit: 'km' },
  calories_burned: { title: 'Calories Burned', unit: 'kcal' },
  sleep_time: { title: 'Sleep Time', unit: 'hours' },
  heart_rate: { title: 'Heart Rate', unit: 'bpm' },
};

export function LogMetricModal({ metricType, visible, onDismiss }: LogMetricModalProps) {
  const [logMetric, { isLoading }] = useLogHealthMetricMutation();
  const schema = metricSchemas[metricType];
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    const payload = {
      type: metricType,
      value: metricType === 'blood_pressure' ? data : data.value,
      timestamp: new Date().toISOString(),
    };

    try {
      await logMetric(payload).unwrap();
      Alert.alert('Success', 'Metric logged successfully!');
      reset();
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to log metric. Please try again.');
    }
  };

  const renderFields = () => {
    if (metricType === 'blood_pressure') {
      return (
        <>
          <Controller
            control={control}
            name="systolic"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Systolic (mmHg)"
                onBlur={onBlur}
                onChangeText={v => onChange(Number(v))}
                value={value?.toString()}
                keyboardType="numeric"
                error={!!errors.systolic}
              />
            )}
          />
          {errors.systolic && <Text style={styles.errorText}>{errors.systolic.message as string}</Text>}
          <Controller
            control={control}
            name="diastolic"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Diastolic (mmHg)"
                onBlur={onBlur}
                onChangeText={v => onChange(Number(v))}
                value={value?.toString()}
                keyboardType="numeric"
                error={!!errors.diastolic}
              />
            )}
          />
          {errors.diastolic && <Text style={styles.errorText}>{errors.diastolic.message as string}</Text>}
        </>
      );
    }

    return (
      <Controller
        control={control}
        name="value"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={`${metricDetails[metricType].title} (${metricDetails[metricType].unit})`}
            onBlur={onBlur}
            onChangeText={v => onChange(Number(v))}
            value={value?.toString()}
            keyboardType="numeric"
            error={!!errors.value}
          />
        )}
      />
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Text style={styles.title}>Log {metricDetails[metricType].title}</Text>
        <View style={styles.form}>
          {renderFields()}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing[4],
    margin: spacing[4],
    borderRadius: 8,
  },
  title: {
    ...textStyles.h5,
    marginBottom: spacing[6],
  },
  form: {
    gap: spacing[4],
  },
  button: {
    marginTop: spacing[4],
  },
  errorText: {
    color: colors.error.main,
    ...textStyles.caption,
  },
});

