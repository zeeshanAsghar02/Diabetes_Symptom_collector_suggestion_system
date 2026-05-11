/**
 * Monthly Diet Plan Dashboard
 * Lists monthly diet plans, allows generating new ones.
 * No emojis - MaterialCommunityIcons only
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, RefreshControl,
  TouchableOpacity, Animated, Easing,
} from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@components/common/Button';
import { TextInput } from '@components/common/TextInput';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { EmptyState } from '@components/common/EmptyState';
import {
  useGetMonthlyPlanHistoryQuery,
  useGenerateMonthlyDietPlanMutation,
  useDeleteMonthlyPlanMutation,
  useLazyGetGenerationStatusQuery,
} from '@features/monthly-diet/monthlyDietPlanApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Generation progress steps shown while AI is working
const STEPS = [
  { icon: 'magnify', label: 'Analyzing your health profile' },
  { icon: 'food-apple-outline', label: 'Searching regional food database' },
  { icon: 'brain', label: 'AI crafting your meal options' },
  { icon: 'check-circle-outline', label: 'Finalizing & saving your plan' },
];

// Animated crafting banner - keeps UI alive during the LLM wait
function GeneratingBanner({
  month,
  year,
  startedAt,
  estimatedDurationMs,
}: {
  month: number;
  year: number;
  startedAt: number;
  estimatedDurationMs: number;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  const ESTIMATED_SECONDS = Math.max(60, Math.floor(estimatedDurationMs / 1000));

  // Rotate spinner continuously
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  // Cycle through steps every 18 s
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setStepIdx(i => (i + 1) % STEPS.length);
    }, 18000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setElapsedSeconds(elapsed);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const step = STEPS[stepIdx];

  // When elapsed exceeds estimate, slowly creep from 0.93→0.99 over the next 3 minutes
  const isOverdue = elapsedSeconds > ESTIMATED_SECONDS;
  const overtimeSeconds = isOverdue ? (elapsedSeconds - ESTIMATED_SECONDS) : 0;
  const progressRatio = isOverdue
    ? Math.min(0.93 + 0.06 * Math.min(overtimeSeconds / 180, 1), 0.99)
    : Math.min(elapsedSeconds / ESTIMATED_SECONDS, 0.93);

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;
  const remainingSeconds = Math.max(0, ESTIMATED_SECONDS - elapsedSeconds);
  const remainingMin = Math.floor(remainingSeconds / 60);
  const remainingSec = remainingSeconds % 60;
  // Smart ETA label — avoids showing "ETA 0:00" when server takes longer than default estimate
  const etaLabel = isOverdue
    ? (overtimeSeconds < 60 ? 'Almost done...' : 'Wrapping up...')
    : `ETA ${remainingMin}:${String(remainingSec).padStart(2, '0')}`;

  return (
    <LinearGradient
      colors={['#6B5B8A', '#503F6E']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.bannerCard}
    >
      {/* Spinner */}
      <Animated.View style={{ transform: [{ rotate }], marginBottom: spacing[3] }}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={36} color="rgba(255,255,255,0.9)" />
      </Animated.View>

      <Text style={styles.bannerTitle}>
        Crafting {MONTHS[month - 1]} {year} Plan
      </Text>
      <Text style={styles.bannerSub}>AI is working - this usually takes 5-7 minutes</Text>

      <View style={styles.bannerMetaRow}>
        <View style={styles.bannerMetaChip}>
          <MaterialCommunityIcons name="timer-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.bannerMetaText}>Elapsed {elapsedMin}:{String(elapsedSec).padStart(2, '0')}</Text>
        </View>
        <View style={styles.bannerMetaChip}>
          <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.bannerMetaText}>{etaLabel}</Text>
        </View>
      </View>

      <View style={styles.bannerProgressTrack}>
        <View style={[styles.bannerProgressFill, { width: `${Math.max(6, progressRatio * 100)}%` }]} />
      </View>

      {/* Step indicator */}
      <Animated.View style={[styles.bannerStep, { opacity: fade }]}>
        <MaterialCommunityIcons name={step.icon as any} size={16} color="rgba(255,255,255,0.8)" />
        <Text style={styles.bannerStepText}>{step.label}...</Text>
      </Animated.View>

      {/* Step dots */}
      <View style={styles.bannerDots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.bannerDot, i === stepIdx && styles.bannerDotActive]} />
        ))}
      </View>

      <Text style={styles.bannerNote}>Keep the app open. Your plan will appear automatically.</Text>
    </LinearGradient>
  );
}

export default function MonthlyDietPlanDashboardScreen() {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Track generation state separately from RTK mutation isLoading
  const [generatingState, setGeneratingState] = useState<{
    active: boolean; month: number; year: number; startedAt: number; estimatedDurationMs: number;
  }>({ active: false, month: 0, year: 0, startedAt: 0, estimatedDurationMs: 7 * 60 * 1000 });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNavigatedRef = useRef<string | null>(null);

  const { data, isLoading, error, refetch } = useGetMonthlyPlanHistoryQuery({ limit: 12 });
  const [generate] = useGenerateMonthlyDietPlanMutation();
  const [deletePlan] = useDeleteMonthlyPlanMutation();
  const [triggerGetStatus] = useLazyGetGenerationStatusQuery();

  const plans = data?.data || (data as any)?.plans || [];
  const completedPlans = plans.filter((plan: any) => !plan?.generation_status || plan.generation_status === 'complete');

  const navigateToPlanDetail = useCallback((planId: string) => {
    if (!planId) return;
    if (autoNavigatedRef.current === planId) return;

    autoNavigatedRef.current = planId;
    router.push(`/personalized/monthly-diet-plan/${planId}` as any);
  }, [router]);

  const resolvePlanIdFromHistory = useCallback(async (month: number, year: number) => {
    const refreshed: any = await refetch();
    const refreshedPlans = refreshed?.data?.data || refreshed?.data?.plans || [];
    const matched = refreshedPlans.find(
      (plan: any) => plan?.month === month && plan?.year === year && (!plan?.generation_status || plan?.generation_status === 'complete')
    );

    return matched?._id as string | undefined;
  }, [refetch]);

  // Stop polling + clear generation state
  const stopGenerating = useCallback((success: boolean, msg?: string) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setGeneratingState({ active: false, month: 0, year: 0, startedAt: 0, estimatedDurationMs: 7 * 60 * 1000 });
    if (success) {
      refetch();
    } else if (msg) {
      Alert.alert('Generation Failed', msg);
    }
  }, [refetch]);

  const completeGeneration = useCallback(async (month: number, year: number, planId?: string) => {
    stopGenerating(true);

    const resolvedId = planId || await resolvePlanIdFromHistory(month, year);
    if (resolvedId) {
      navigateToPlanDetail(resolvedId);
      return;
    }

    Alert.alert(
      'Plan Ready',
      `${MONTHS[month - 1]} ${year} plan was generated successfully. Pull to refresh if it is not visible yet.`
    );
  }, [navigateToPlanDetail, resolvePlanIdFromHistory, stopGenerating]);

  // Start polling /status/:month/:year every 10 s until generation completes or fails
  const startPolling = useCallback((month: number, year: number) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    pollRef.current = setInterval(async () => {
      try {
        // preferCacheValue=false forces a fresh network request each time
        const result = await triggerGetStatus({ month, year }, false);
        const statusPayload = (result.data as any)?.data ?? (result.data as any);

        if (statusPayload?.status === 'pending' && statusPayload?.generationTiming) {
          const timing = statusPayload.generationTiming;
          const startedAtMs = timing?.startedAt ? new Date(timing.startedAt).getTime() : Date.now();
          const estimated = typeof timing?.estimatedDurationMs === 'number' && timing.estimatedDurationMs > 0
            ? timing.estimatedDurationMs
            : 7 * 60 * 1000;

          setGeneratingState((prev) => ({
            ...prev,
            active: true,
            month,
            year,
            startedAt: startedAtMs,
            estimatedDurationMs: estimated,
          }));
        }

        if (statusPayload?.status === 'complete') {
          const completedPlanId = statusPayload?.planId || statusPayload?.plan?._id;
          await completeGeneration(month, year, completedPlanId);
          return;
        }
        if (statusPayload?.status === 'failed') {
          stopGenerating(
            false,
            statusPayload.error || `Generation of ${MONTHS[month - 1]} ${year} plan failed. Please try again.`
          );
          return;
        }
        // 'pending' or 'not_found' -- keep waiting
      } catch { /* network hiccup -- keep polling */ }
    }, 10_000);
  }, [triggerGetStatus, stopGenerating, completeGeneration]);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGenerate = async () => {
    const month = selectedMonth;
    const year = selectedYear;

    setShowGenerateModal(false);
    setGeneratingState({ active: true, month, year, startedAt: Date.now(), estimatedDurationMs: 7 * 60 * 1000 });

    try {
      const result = await generate({ month, year }).unwrap();
      // Backend returns 202 { success: true, status: 'pending' } - start polling /status
      const status = (result as any)?.status ?? (result as any)?.data?.status;

      if (status === 'pending') {
        startPolling(month, year);
      } else {
        await completeGeneration(month, year, (result as any)?.planId || (result as any)?.data?.planId);
      }
    } catch (err: any) {
      const errMsg: string = err?.data?.error || err?.data?.message || '';

      // 'Already exists' (409) - plan is complete, show it
      if (errMsg.toLowerCase().includes('already exists')) {
        await completeGeneration(month, year);
        return;
      }

      // Before giving up, check if a pending/complete plan actually exists in DB.
      // This covers: server errors thrown AFTER the placeholder was created,
      // or brief network drops after the 202 was sent from the server.
      try {
        const statusResult = await triggerGetStatus({ month, year }, false);
        const statusPayload = (statusResult.data as any)?.data ?? (statusResult.data as any);
        const planStatus = statusPayload?.status;

        if (planStatus === 'pending') {
          // Plan is generating - start polling, don't show error
          startPolling(month, year);
          return;
        }
        if (planStatus === 'complete') {
          // Plan already finished (rare race condition) - show it
          await completeGeneration(month, year, statusPayload?.planId || statusPayload?.plan?._id);
          return;
        }
        // 'failed' or 'not_found' - show error
      } catch { /* status check also failed - fall through to error */ }

      stopGenerating(
        false,
        errMsg || 'Failed to start plan generation. Please check your connection and try again.'
      );
    }
  };

  const handleDelete = (planId: string) => {
    Alert.alert('Delete Plan', 'Are you sure you want to delete this monthly plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan(planId).unwrap();
            refetch();
          } catch {
            Alert.alert('Error', 'Failed to delete plan.');
          }
        },
      },
    ]);
  };

  if (isLoading && plans.length === 0) return <FullScreenLoader />;
  if (error && plans.length === 0) return <ErrorState onRetry={refetch} error="Failed to load monthly plans." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#FFF" />}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#6B5B8A', '#503F6E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Monthly Diet Plans</Text>
          <Text style={styles.heroSubtitle}>Comprehensive monthly meal planning with multiple options</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{completedPlans.length}</Text>
              <Text style={styles.heroStatLabel}>Total Plans</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {completedPlans.length > 0 ? MONTHS[(completedPlans[0].month || 1) - 1]?.substring(0, 3) : '--'}
              </Text>
              <Text style={styles.heroStatLabel}>Latest Month</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{completedPlans.length > 0 ? completedPlans[0].year : '--'}</Text>
              <Text style={styles.heroStatLabel}>Year</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Animated generation banner - shown while AI is working */}
        {generatingState.active && (
          <GeneratingBanner
            month={generatingState.month}
            year={generatingState.year}
            startedAt={generatingState.startedAt}
            estimatedDurationMs={generatingState.estimatedDurationMs}
          />
        )}

        {/* Generate button - hidden while generating */}
        {!generatingState.active && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowGenerateModal(true)}>
            <LinearGradient
              colors={['#6B5B8A', '#7D6D9C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateBtn}
            >
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#FFF" />
              <Text style={styles.generateText}>Generate New Monthly Plan</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {completedPlans.length === 0 && !generatingState.active ? (
          <EmptyState
            icon="calendar-month-outline"
            title="No Monthly Plans"
            message="Generate your first monthly diet plan to get started."
          />
        ) : (
          <>
            {/* Section Header */}
            {completedPlans.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Plan History</Text>
                <View style={styles.sectionLine} />
              </View>
            )}

            {completedPlans.map((plan: any) => (
              <View key={plan._id} style={styles.planCard}>
                <View style={styles.planRow}>
                  <View style={styles.planIconWrap}>
                    <MaterialCommunityIcons name="calendar-month" size={20} color="#6B5B8A" />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>
                      {MONTHS[(plan.month || 1) - 1]} {plan.year}
                    </Text>
                    <Text style={styles.planDate}>
                      Created {new Date(plan.created_at || plan.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.planActions}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/personalized/monthly-diet-plan/${plan._id}` as any)}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={16} color="#6B5B8A" />
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                    onPress={() => handleDelete(plan._id)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error.main} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Generate Modal */}
      <Portal>
        <Modal
          visible={showGenerateModal}
          onDismiss={() => setShowGenerateModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#6B5B8A" />
            </View>
            <Text style={styles.modalTitle}>Generate Monthly Plan</Text>
            <Text style={styles.modalSubtitle}>Select month and year for your plan</Text>
            <View style={styles.modalNote}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#E67E22" />
              <Text style={styles.modalNoteText}>Takes 3-5 minutes (AI + nutrition analysis)</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Month</Text>
          <View style={styles.monthGrid}>
            {MONTHS.map((month, idx) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === idx + 1 && styles.monthButtonSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedMonth(idx + 1)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === idx + 1 && styles.monthButtonTextSelected,
                ]}>
                  {month.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label="Year"
            value={String(selectedYear)}
            onChangeText={(v) => setSelectedYear(parseInt(v) || new Date().getFullYear())}
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <Button variant="outline" onPress={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button variant="primary" onPress={handleGenerate}>Start Generating</Button>
          </View>
        </Modal>
      </Portal>
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    fontWeight: '500', marginTop: 2, marginBottom: spacing[4],
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3], paddingHorizontal: spacing[2],
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },

  /* Generating Banner */
  bannerCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    marginBottom: spacing[4],
    alignItems: 'center',
    ...shadows.md,
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: spacing[4] },
  bannerMetaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  bannerMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  bannerMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  bannerProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  bannerProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  bannerStep: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: borderRadius.full, marginBottom: spacing[3],
  },
  bannerStepText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  bannerDots: { flexDirection: 'row', gap: 6, marginBottom: spacing[3] },
  bannerDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bannerDotActive: { backgroundColor: '#FFFFFF', width: 18 },
  bannerNote: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    fontStyle: 'italic', marginTop: 4,
  },
  pendingChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#F4F0FB',
    borderWidth: 1,
    borderColor: '#D8CBEF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[4],
  },
  pendingChipText: {
    flex: 1,
    fontSize: 12,
    color: '#5E4D7E',
    fontWeight: '500',
  },

  /* Generate */
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full, gap: 8, marginBottom: spacing[4],
  },
  generateText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  /* Section */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[2], marginBottom: spacing[3],
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[100] },

  /* Plan Cards */
  planCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1, borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  planRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing[3], gap: spacing[3],
  },
  planIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F5F3F8',
    justifyContent: 'center', alignItems: 'center',
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: '600', color: colors.neutral[900] },
  planDate: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  planActions: { flexDirection: 'row', gap: spacing[2] },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing[2], borderRadius: borderRadius.sm,
    backgroundColor: '#F5F3F8', gap: 6,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: '#6B5B8A' },
  deleteBtn: {
    width: 40, height: 40, borderRadius: borderRadius.sm,
    backgroundColor: colors.error.bg,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Modal */
  modal: {
    backgroundColor: colors.neutral[0],
    margin: spacing[4], padding: spacing[5],
    borderRadius: borderRadius.lg, maxHeight: '85%',
  },
  modalHeader: { alignItems: 'center', marginBottom: spacing[4] },
  modalIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F5F3F8',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing[3],
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900] },
  modalSubtitle: { fontSize: 13, color: colors.neutral[500], marginTop: 4 },
  modalNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF8F0', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  modalNoteText: { fontSize: 12, color: '#E67E22', fontWeight: '500' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[600], marginBottom: spacing[2] },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  monthButton: {
    width: '30%', paddingVertical: spacing[2], borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[50], alignItems: 'center',
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  monthButtonSelected: { backgroundColor: '#6B5B8A', borderColor: '#6B5B8A' },
  monthButtonText: { fontSize: 13, fontWeight: '500', color: colors.neutral[600] },
  monthButtonTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  modalActions: {
    flexDirection: 'row', gap: spacing[3], marginTop: spacing[4],
  },
});
