/**
 * Nutrition Pie Chart Component
 * Custom SVG doughnut chart — no Victory dependency, no overflow.
 * Displays macros (carbs, protein, fat) with center calorie text.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';
import colors from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import type { NutritionalSummary } from '@app-types/api';

interface NutritionPieChartProps {
  summary: NutritionalSummary;
  size?: number;
}

const CHART_COLORS = {
  carbs: '#3B82F6',   // blue
  protein: '#10B981', // green
  fat: '#F59E0B',     // amber
};

const STROKE_WIDTH = 22;

export function NutritionPieChart({ summary, size = 180 }: NutritionPieChartProps) {
  const carbs = summary?.carbs ?? 0;
  const protein = summary?.protein ?? 0;
  const fat = summary?.fat ?? 0;
  const totalMacros = carbs + protein + fat;
  const totalCalories = summary?.total_calories ?? summary?.calories ?? 0;

  if (totalMacros === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No nutritional data</Text>
      </View>
    );
  }

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build segments
  const segments = [
    { key: 'carbs', value: carbs, color: CHART_COLORS.carbs, label: 'Carbs' },
    { key: 'protein', value: protein, color: CHART_COLORS.protein, label: 'Protein' },
    { key: 'fat', value: fat, color: CHART_COLORS.fat, label: 'Fat' },
  ];

  let cumulativePercent = 0;

  return (
    <View style={styles.wrapper}>
      {/* SVG Doughnut */}
      <View style={[styles.chartBox, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.neutral[100]}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Segments */}
          <G rotation={-90} origin={`${center}, ${center}`}>
            {segments.map((seg) => {
              const percent = seg.value / totalMacros;
              const dashLength = percent * circumference;
              const gapLength = circumference - dashLength;
              const offset = -cumulativePercent * circumference;
              cumulativePercent += percent;

              return (
                <Circle
                  key={seg.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${dashLength} ${gapLength}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>

        {/* Center text */}
        <View style={styles.centerOverlay}>
          <Text style={styles.centerValue}>{totalCalories.toFixed(0)}</Text>
          <Text style={styles.centerLabel}>kcal</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((seg) => {
          const pct = ((seg.value / totalMacros) * 100).toFixed(0);
          const grams = `${seg.value.toFixed(0)}g`;
          return (
            <View key={seg.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <View>
                <Text style={styles.legendLabel}>{seg.label}</Text>
                <Text style={styles.legendSub}>{grams} ({pct}%)</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  centerLabel: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: -2,
  },
  /* Legend */
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  legendSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 1,
  },
  emptyContainer: {
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.neutral[400],
  },
});

