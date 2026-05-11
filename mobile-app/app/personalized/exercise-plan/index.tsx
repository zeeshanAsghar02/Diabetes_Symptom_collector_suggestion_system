import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useEnsureTodayExercisePlanMutation,
  useGetExercisePlanStatusTodayQuery,
} from '@features/exercise/exercisePlanApi';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

type DailyPlanStatus = 'pending' | 'complete' | 'failed' | 'not_found';

export default function ExercisePlanScreen() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const retryFailedRef = useRef(false);

  const [status, setStatus] = useState<DailyPlanStatus>('pending');
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [shouldPoll, setShouldPoll] = useState(false);

  const [ensureTodayPlan, { isLoading: ensuring }] = useEnsureTodayExercisePlanMutation();
  const { data: statusData, error: statusError, refetch: refetchStatus } = useGetExercisePlanStatusTodayQuery(undefined, {
    skip: !shouldPoll,
    pollingInterval: 6000,
  });

  const runEnsure = async () => {
    try {
      const res = await ensureTodayPlan().unwrap();
      const nextStatus = (res?.status || 'pending') as DailyPlanStatus;
      setStatus(nextStatus);

      if (nextStatus === 'complete' && res?.plan) {
        setCurrentPlan(res.plan);
        setShouldPoll(false);
      } else if (nextStatus === 'pending') {
        setShouldPoll(true);
      }
    } catch {
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    runEnsure();
  }, []);

  useEffect(() => {
    if (!statusData) return;
    const nextStatus = (statusData.status || 'not_found') as DailyPlanStatus;
    setStatus(nextStatus);

    if (nextStatus === 'complete' && statusData.plan) {
      setCurrentPlan(statusData.plan);
      setShouldPoll(false);
      return;
    }
    if (nextStatus === 'not_found') {
      runEnsure();
      return;
    }
    if (nextStatus === 'pending') {
      setShouldPoll(true);
      return;
    }
    if (nextStatus === 'failed') {
      setShouldPoll(false);
      if (!retryFailedRef.current) {
        retryFailedRef.current = true;
        runEnsure();
      }
      return;
    }
    setShouldPoll(false);
  }, [statusData]);

  const handleRefresh = async () => {
    await runEnsure();
    refetchStatus();
  };

  if (statusError && !currentPlan && status === 'failed') {
    return <ErrorState onRetry={handleRefresh} error="Failed to load today's exercise plan." />;
  }

  const sessions = currentPlan?.sessions || [];
  const totals = currentPlan?.totals || {};
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ensuring} onRefresh={handleRefresh} tintColor="#FFF" />}
      >
        <LinearGradient colors={['#4A6078', '#36475B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="run-fast" size={22} color="rgba(255,255,255,0.92)" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Today's Exercise</Text>
          <Text style={styles.heroSub}>{todayStr}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{sessions.length}</Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totals?.duration_total_min || 0}</Text>
              <Text style={styles.heroStatLabel}>Minutes</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{status === 'complete' ? 'Ready' : status === 'pending' ? 'Generating' : 'Retry'}</Text>
              <Text style={styles.heroStatLabel}>Status</Text>
            </View>
          </View>
        </LinearGradient>

        {status === 'pending' && (
          <View style={styles.pendingCard}>
            <ActivityIndicator size="large" color="#4A6078" />
            <Text style={styles.pendingTitle}>Preparing your plan</Text>
            <Text style={styles.pendingSub}>Your daily exercise plan is being generated in the background.</Text>
          </View>
        )}

        {status === 'complete' && currentPlan && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Sessions</Text>
              <View style={styles.sectionLine} />
            </View>

            {sessions.map((session: any, idx: number) => (
              <View key={idx} style={styles.sessionCard}>
                <View style={styles.sessionHead}>
                  <Text style={styles.sessionName}>{session?.name || `Session ${idx + 1}`}</Text>
                  <Text style={styles.sessionMeta}>{session?.time || 'Any time'}</Text>
                </View>

                {(session?.items || []).map((item: any, itemIdx: number) => (
                  <View key={itemIdx} style={styles.itemRow}>
                    <View style={styles.dot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item?.exercise || 'Exercise'}</Text>
                      <Text style={styles.itemMeta}>
                        {item?.duration_min || '--'} min • {item?.intensity || 'Moderate'}
                        {item?.estimated_calories ? ` • ${item.estimated_calories} cal` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => currentPlan?._id && router.push(`/personalized/exercise-plan/${currentPlan._id}` as any)}
            >
              <LinearGradient colors={['#4A6078', '#5A7088']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.detailBtn}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#FFF" />
                <Text style={styles.detailBtnText}>Open Full Plan Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: spacing[4], paddingBottom: spacing[8] },

  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  heroBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.76)', marginTop: 2, marginBottom: spacing[4] },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  pendingCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#D9E3EC',
    padding: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  pendingTitle: { marginTop: spacing[3], fontSize: 15, fontWeight: '700', color: colors.neutral[800] },
  pendingSub: { marginTop: spacing[1], fontSize: 13, color: colors.neutral[600], textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3], marginTop: spacing[1] },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.neutral[800], marginRight: spacing[2] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[100] },

  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.xs,
  },
  sessionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  sessionName: { fontSize: 14, fontWeight: '700', color: colors.neutral[800] },
  sessionMeta: { fontSize: 12, color: colors.neutral[500] },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing[2] },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A6078', marginTop: 6, marginRight: spacing[2] },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.neutral[700] },
  itemMeta: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  detailBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginVertical: spacing[4],
  },
  detailBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
