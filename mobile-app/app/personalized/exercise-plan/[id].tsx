/**
 * Exercise Plan Detail Screen
 * Displays the full details of a selected exercise plan.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useGetExercisePlanByIdQuery, useDownloadExercisePlanPDFMutation, useDeleteExercisePlanMutation } from '@features/exercise/exercisePlanApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A6078';
const HERO_TO = '#384D60';

export default function ExercisePlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetExercisePlanByIdQuery(id, { skip: !id });
  const [downloadPDF, { isLoading: isDownloading }] = useDownloadExercisePlanPDFMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeleteExercisePlanMutation();

  const plan = data?.data;
  const p = plan as any; // backend shape uses sessions/totals/tips
  const sessions = p?.sessions ?? p?.weekly_schedule ?? [];
  const tips = p?.tips ?? p?.general_recommendations ?? [];
  const totalDuration = p?.totals?.duration_total_min ?? p?.total_duration_minutes ?? 0;
  const totalCalories = p?.totals?.calories_total ?? p?.total_calories_burned ?? 0;
  const goalLabel = p?.goal ? p.goal.replace(/_/g, ' ') : 'General';
  const regionLabel = p?.region ?? 'Global';

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Plan', 'Are you sure you want to delete this exercise plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deletePlan(id)
            .unwrap()
            .then(() => router.back())
            .catch(() => Alert.alert('Error', 'Failed to delete the plan.')),
      },
    ]);
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const blob = await downloadPDF(id).unwrap();
      const file = new FileSystem.File(FileSystem.Paths.document, `exercise-plan-${id}.pdf`);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        file.write(base64data, { encoding: 'base64' });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri);
        } else {
          Alert.alert('Sharing not available', 'Cannot share the file on this device.');
        }
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      Alert.alert('Download Failed', 'Could not download the PDF. Please try again.');
    }
  };

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isError || !plan) {
    return <ErrorState onRetry={refetch} error="Failed to load exercise plan details." />;
  }

  const dateStr = new Date(p.start_date ?? p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={HERO_FROM} />}
      >
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity onPress={handleDownload} disabled={isDownloading} style={styles.heroBtn}>
                <MaterialCommunityIcons name="download" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} disabled={isDeleting} style={styles.heroBtn}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="dumbbell" size={22} color={HERO_FROM} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Exercise Plan</Text>
          <Text style={styles.heroSub}>{dateStr}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalDuration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>

          {/* Goal & Region chips */}
          <View style={styles.heroChips}>
            <View style={styles.heroChip}>
              <MaterialCommunityIcons name="flag-checkered" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroChipText}>{goalLabel}</Text>
            </View>
            {regionLabel !== 'Global' && (
              <View style={styles.heroChip}>
                <MaterialCommunityIcons name="earth" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroChipText}>{regionLabel}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Sessions */}
        {sessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.scheduleContainer}>
              {sessions.map((session: any, idx: number) => (
                <SessionCard key={idx} session={session} />
              ))}
            </View>
          </>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tips & Recommendations</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.recommendationsContainer}>
              {tips.map((tip: string, index: number) => (
                <View key={index} style={styles.recCard}>
                  <View style={styles.recIconWrap}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={HERO_FROM} />
                  </View>
                  <Text style={styles.recommendationText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Session Card sub-component ─── */

function SessionCard({ session }: { session: any }) {
  const name = session.name ?? 'Session';
  const time = session.time ?? '';
  const items = session.items ?? session.exercises ?? [];
  const totalDur = session.total_duration_min ?? 0;
  const totalCal = session.total_estimated_calories ?? 0;

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={HERO_FROM} />
          <Text style={styles.sessionName}>{name}</Text>
          {!!time && <Text style={styles.sessionTime}>{time}</Text>}
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionMetaText}>{totalDur} min</Text>
          <Text style={styles.sessionMetaDot}>·</Text>
          <Text style={styles.sessionMetaText}>{Math.round(totalCal)} cal</Text>
        </View>
      </View>

      {items.map((item: any, idx: number) => (
        <View key={idx} style={styles.exerciseRow}>
          <View style={styles.exerciseBullet} />
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.exercise ?? item.name ?? 'Exercise'}</Text>
            <View style={styles.exerciseTags}>
              <Text style={styles.exerciseTag}>{item.duration_min ?? item.duration ?? '--'} min</Text>
              <Text style={styles.exerciseTag}>{item.intensity ?? 'moderate'}</Text>
              {!!item.estimated_calories && <Text style={styles.exerciseTag}>{item.estimated_calories} cal</Text>}
            </View>
            {!!item.notes && <Text style={styles.exerciseNotes}>{item.notes}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  /* ---- Hero ---- */
  hero: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  heroBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  heroIconRow: {
    marginBottom: spacing[2],
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  /* ---- Hero chips ---- */
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  heroChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'capitalize',
  },
  /* ---- Sections ---- */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
    marginRight: spacing[2],
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  /* ---- Schedule ---- */
  scheduleContainer: {
    gap: spacing[5],
    marginBottom: spacing[6],
  },
  /* ---- Recommendations ---- */
  recommendationsContainer: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[3],
    ...shadows.xs,
  },
  recIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
    marginTop: 1,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[600],
    flex: 1,
  },
  /* ---- Session Card ---- */
  sessionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    ...shadows.xs,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  sessionHeader: {
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
    flex: 1,
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 20,
  },
  sessionMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  sessionMetaDot: {
    fontSize: 12,
    color: colors.neutral[300],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  exerciseBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[400],
    marginTop: 6,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 3,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  exerciseTag: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[500],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
