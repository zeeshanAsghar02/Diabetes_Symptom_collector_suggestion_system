/**
 * Meal Card Component
 * Displays details of a single meal in a diet plan.
 * Uses correct backend field names: meal.name, item.food, item.portion
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { Meal } from '@app-types/api';

interface MealCardProps {
  meal: Meal;
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'weather-sunset-up',
  lunch: 'weather-sunny',
  dinner: 'weather-night',
  snacks: 'food-apple-outline',
  'mid-morning snack': 'cup-outline',
  'evening snack': 'fruit-grapes-outline',
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#D4882A',
  lunch: '#3D7A68',
  dinner: '#4A6078',
  snacks: '#6B5B8A',
  'mid-morning snack': '#4A7580',
  'evening snack': '#8A7245',
};

function getMealIcon(name: string): string {
  return MEAL_ICONS[name?.toLowerCase()] || 'silverware-fork-knife';
}

function getMealColor(name: string): string {
  return MEAL_COLORS[name?.toLowerCase()] || '#3D7A68';
}

export function MealCard({ meal }: MealCardProps) {
  const mealColor = getMealColor(meal.name);
  const mealIcon = getMealIcon(meal.name);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: mealColor + '18' }]}>
          <MaterialCommunityIcons name={mealIcon as any} size={18} color={mealColor} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{meal.name}</Text>
          {meal.timing ? <Text style={styles.timing}>{meal.timing}</Text> : null}
        </View>
        <View style={styles.calBadge}>
          <Text style={styles.calText}>{(meal.total_calories || 0).toFixed(0)} cal</Text>
        </View>
      </View>

      {/* Food Items */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colFood, styles.headerLabel]}>Food</Text>
        <Text style={[styles.colPortion, styles.headerLabel]}>Portion</Text>
        <Text style={[styles.colNum, styles.headerLabel]}>Cal</Text>
      </View>
      {(meal.items || []).map((item, index) => (
        <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : null]}>
          <Text style={[styles.colFood, styles.foodText]} numberOfLines={2}>{item.food}</Text>
          <Text style={[styles.colPortion, styles.cellText]} numberOfLines={1}>{item.portion}</Text>
          <Text style={[styles.colNum, styles.cellText]}>{(item.calories || 0).toFixed(0)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
    ...shadows.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  timing: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 1,
  },
  calBadge: {
    backgroundColor: '#FBF4E9',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  calText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4882A',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  rowEven: {
    backgroundColor: colors.neutral[50] + '80',
  },
  colFood: {
    flex: 2.5,
    paddingRight: 4,
  },
  colPortion: {
    flex: 1.5,
    paddingRight: 4,
  },
  colNum: {
    flex: 0.8,
    textAlign: 'right',
  },
  foodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  cellText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
});
