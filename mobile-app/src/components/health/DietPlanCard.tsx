/**
 * Diet Plan Card Component
 * Displays a summary of a diet plan.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Card } from '@components/common/Card';
import { spacing } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import type { DietPlan } from '@app-types/api';

interface DietPlanCardProps {
  plan: DietPlan;
  onPress: () => void;
}

export function DietPlanCard({ plan, onPress }: DietPlanCardProps) {
  const { target_date } = plan;

  // Handle both field names: backend returns nutritional_totals, type defines nutritional_summary
  const nutrition = (plan as any).nutritional_totals ?? plan.nutritional_summary;
  const calories = nutrition?.total_calories ?? nutrition?.calories ?? 0;
  const carbs = nutrition?.carbs ?? 0;
  const protein = nutrition?.protein ?? 0;
  const fat = nutrition?.fat ?? 0;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date(target_date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesValue}>
            {Number(calories).toFixed(0)}
          </Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
        </View>
      </View>
      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: colors.chart.blue }]} />
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{Number(carbs).toFixed(0)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: colors.chart.green }]} />
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{Number(protein).toFixed(0)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroDot, { backgroundColor: colors.chart.amber }]} />
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{Number(fat).toFixed(0)}g</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  date: {
    ...textStyles.h6,
    color: colors.light.text.primary,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesValue: {
    ...textStyles.h5,
    color: colors.primary[600],
  },
  caloriesLabel: {
    ...textStyles.caption,
    color: colors.light.text.secondary,
    marginLeft: spacing[1],
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.light.border.light,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing[1],
  },
  macroLabel: {
    ...textStyles.caption,
    color: colors.light.text.secondary,
  },
  macroValue: {
    ...textStyles.body2,
    fontWeight: 'bold',
    color: colors.light.text.primary,
  },
});
