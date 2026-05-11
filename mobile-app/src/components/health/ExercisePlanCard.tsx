/**
 * Exercise Plan Card Component
 * Displays a summary of an exercise plan.
 * Uses backend fields: sessions, totals, target_date, region
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { ExercisePlan } from '@app-types/api';

interface ExercisePlanCardProps {
  plan: ExercisePlan;
  onPress: () => void;
}

export function ExercisePlanCard({ plan, onPress }: ExercisePlanCardProps) {
  const p = plan as any; // backend shape differs from TS type
  const sessions = p.sessions ?? p.weekly_schedule ?? [];
  const totalDuration = p.totals?.duration_total_min ?? p.total_duration_minutes ?? 0;
  const totalCalories = p.totals?.calories_total ?? p.total_calories_burned ?? 0;

  // Format date — show single date, not a range of the same day
  const dateStr = (() => {
    const start = p.start_date ?? p.target_date;
    const end = p.end_date ?? p.start_date ?? p.target_date;
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!start) return '--';
    const startFmt = fmt(start);
    const endFmt = end ? fmt(end) : null;
    return endFmt && endFmt !== startFmt ? `${startFmt} - ${endFmt}` : startFmt;
  })();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {/* Top row: date + region chip */}
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.neutral[500]} />
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        {!!p.region && p.region !== 'Global' && (
          <View style={styles.regionChip}>
            <Text style={styles.regionText}>{p.region}</Text>
          </View>
        )}
        {!!p.goal && (
          <View style={styles.goalChip}>
            <Text style={styles.goalText}>{p.goal.replace(/_/g, ' ')}</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatItem icon="timer-outline" value={sessions.length} label="Sessions" color={colors.info.dark} bg={colors.info.bg} />
        <StatItem icon="clock-outline" value={`${totalDuration}`} label="Minutes" color={colors.chart.indigo} bg={colors.chart.indigo + '14'} />
        <StatItem icon="fire" value={`${Math.round(totalCalories)}`} label="Calories" color={colors.chart.amber} bg={colors.chart.amber + '14'} />
      </View>

      {/* Chevron */}
      <View style={styles.chevronWrap}>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );
}

function StatItem({ icon, value, label, color, bg }: { icon: string; value: string | number; label: string; color: string; bg: string }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.xs,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    flexWrap: 'wrap',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  regionChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.chart.blue + '14',
  },
  regionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.chart.blue,
  },
  goalChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.info.bg,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.info.dark,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  statItem: {
    alignItems: 'center',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutral[500],
    marginTop: 1,
  },
  chevronWrap: {
    position: 'absolute',
    right: spacing[3],
    top: spacing[4],
  },
});
