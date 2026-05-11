/**
 * Weekly Habits Tracker
 * AI-generated weekly habits with daily checkboxes.
 * No emojis — MaterialCommunityIcons only
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Checkbox, ProgressBar, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@components/common/Button';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import {
  useGetCurrentWeeklyHabitsQuery,
  useGenerateWeeklyHabitsMutation,
  useUpdateHabitProgressMutation,
} from '@features/habits/weeklyHabitsApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const CATEGORY_ICONS: Record<string, string> = {
  diet: 'food-apple-outline',
  exercise: 'run',
  medication: 'pill',
  lifestyle: 'leaf',
  sleep: 'sleep',
  stress: 'meditation',
  monitoring: 'chart-line',
};

const CATEGORY_COLORS: Record<string, string> = {
  diet: '#3D7A68',
  exercise: '#4A6078',
  medication: '#6B5B8A',
  lifestyle: '#8A7245',
  sleep: '#546E7A',
  stress: '#4A7580',
  monitoring: '#C0392B',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function HabitsTrackerScreen() {
  const router = useRouter();
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = new Date().toISOString().split('T')[0];

  const { data, isLoading, error, refetch } = useGetCurrentWeeklyHabitsQuery();
  const [generateHabits, { isLoading: generating }] = useGenerateWeeklyHabitsMutation();
  const [updateProgress, { isLoading: updating }] = useUpdateHabitProgressMutation();

  const habitsData = data?.data;
  const habits = habitsData?.habits || [];
  const progress = habitsData?.progress || [];
  const completionRate = (data as any)?.completionRate || 0;

  // Auto-generate if no habits exist
  useEffect(() => {
    if (!isLoading && !habitsData && !error) {
      generateHabits().unwrap().then(() => refetch()).catch(() => {});
    }
  }, [isLoading, habitsData, error]);

  const isHabitCompleted = (habitId: string, date: string): boolean => {
    return progress.some(
      (p) => p.habitId === habitId && p.date === date && p.completed
    );
  };

  const handleToggle = async (habitId: string, date: string) => {
    const completed = !isHabitCompleted(habitId, date);
    try {
      await updateProgress({ habitId, date, completed }).unwrap();
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to update habit progress.');
    }
  };

  const handleRegenerate = async () => {
    Alert.alert('Regenerate Habits', 'This will generate a new set of weekly habits.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate',
        onPress: async () => {
          try {
            await generateHabits().unwrap();
            refetch();
          } catch (err: any) {
            Alert.alert('Error', err?.data?.message || 'Failed to regenerate.');
          }
        },
      },
    ]);
  };

  if (isLoading && !habitsData) return <FullScreenLoader />;
  if (error && !habitsData) return <ErrorState onRetry={refetch} error="Failed to load habits." />;

  // Group habits by category
  const groupedHabits = habits.reduce((acc: Record<string, typeof habits>, habit) => {
    const cat = habit.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(habit);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#FFF" />}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#8A7245', '#6E5A36']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={24} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Weekly Habits</Text>
          <Text style={styles.heroSubtitle}>Track your daily habits for a healthier lifestyle</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{habits.length}</Text>
              <Text style={styles.heroStatLabel}>Total Habits</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{Math.round(completionRate)}%</Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{Object.keys(groupedHabits).length}</Text>
              <Text style={styles.heroStatLabel}>Categories</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <MaterialCommunityIcons name="chart-arc" size={20} color="#8A7245" />
            <Text style={styles.progressTitle}>Weekly Progress</Text>
            <Text style={styles.progressPercent}>{Math.round(completionRate)}%</Text>
          </View>
          <ProgressBar
            progress={completionRate / 100}
            color="#8A7245"
            style={styles.progressBar}
          />
        </View>

        {generating && (
          <View style={styles.generatingCard}>
            <ActivityIndicator size="large" color="#8A7245" />
            <Text style={styles.generatingText}>Generating your weekly habits...</Text>
          </View>
        )}

        {/* Day Headers */}
        {habits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.dayHeaderRow}>
              <View style={styles.habitNameCol} />
              {DAYS.map((day, idx) => (
                <View key={day} style={[styles.dayCol, weekDates[idx] === todayStr && styles.todayCol]}>
                  <Text style={[styles.dayText, weekDates[idx] === todayStr && styles.todayText]}>{day}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Habits by Category */}
        {Object.entries(groupedHabits).map(([category, categoryHabits]) => (
          <View key={category}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconWrap, { backgroundColor: `${CATEGORY_COLORS[category] || '#4A6078'}15` }]}>
                <MaterialCommunityIcons
                  name={(CATEGORY_ICONS[category] || 'clipboard-text-outline') as any}
                  size={16}
                  color={CATEGORY_COLORS[category] || colors.neutral[600]}
                />
              </View>
              <Text style={[styles.categoryTitle, { color: CATEGORY_COLORS[category] || colors.neutral[800] }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>

            {categoryHabits.map((habit) => (
              <View key={habit.id} style={styles.habitRow}>
                <View style={styles.habitNameCol}>
                  <Text style={styles.habitTitle} numberOfLines={2}>{habit.title}</Text>
                </View>
                {weekDates.map((date) => (
                  <View key={date} style={styles.dayCol}>
                    <Checkbox
                      status={isHabitCompleted(habit.id, date) ? 'checked' : 'unchecked'}
                      onPress={() => handleToggle(habit.id, date)}
                      color={CATEGORY_COLORS[category] || colors.primary[600]}
                      disabled={updating}
                    />
                  </View>
                ))}
              </View>
            ))}

            <Divider style={styles.divider} />
          </View>
        ))}

        {/* Regenerate Button */}
        {habits.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleRegenerate}>
            <View style={styles.regenerateBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#8A7245" />
              <Text style={styles.regenerateBtnText}>Regenerate Weekly Habits</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: spacing[4], paddingBottom: spacing[12] },

  /* Hero */
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2, marginBottom: spacing[4] },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },

  /* Progress */
  progressCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  progressTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  progressPercent: { fontSize: 14, fontWeight: '700', color: '#8A7245' },
  progressBar: { height: 8, borderRadius: 4 },

  /* Generating */
  generatingCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  generatingText: { fontSize: 14, color: colors.neutral[500], marginTop: spacing[3] },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[100] },

  /* Day Headers */
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.sm,
    paddingVertical: spacing[2],
    ...shadows.xs,
  },
  habitNameCol: { flex: 2, paddingRight: spacing[2], paddingLeft: spacing[2] },
  dayCol: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  todayCol: {
    backgroundColor: '#FBF7EF',
    borderRadius: 8,
  },
  dayText: { fontSize: 11, color: colors.neutral[500], fontWeight: '600' },
  todayText: { color: '#8A7245', fontWeight: '700' },

  /* Category */
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  /* Habits */
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  habitTitle: { fontSize: 12, color: colors.neutral[700], fontWeight: '500' },
  divider: { marginVertical: spacing[2], backgroundColor: colors.neutral[100] },

  /* Regenerate */
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: '#8A7245',
    gap: 8,
    marginTop: spacing[4],
  },
  regenerateBtnText: { fontSize: 14, fontWeight: '600', color: '#8A7245' },
});
