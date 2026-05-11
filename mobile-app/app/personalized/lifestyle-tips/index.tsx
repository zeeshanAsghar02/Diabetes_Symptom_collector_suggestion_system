import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ErrorState } from '@components/common/ErrorState';
import {
  useEnsureTodayLifestyleTipsMutation,
  useGetLifestyleTipsStatusTodayQuery,
  type TipCategory,
} from '@features/lifestyle/lifestyleTipsApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

type DailyTipsStatus = 'pending' | 'complete' | 'failed' | 'not_found';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#C0392B',
  medium: '#D4882A',
  low: '#3D7A68',
};

const CATEGORY_ICONS: Record<string, string> = {
  sleep_hygiene: 'sleep',
  stress_management: 'meditation',
  hydration: 'water-outline',
  blood_sugar_monitoring: 'water-thermometer-outline',
  medication_adherence: 'pill',
  foot_care: 'shoe-print',
  dental_health: 'tooth-outline',
  social_support: 'handshake-outline',
  nutrition: 'food-apple-outline',
  activity: 'run',
  monitoring: 'chart-line',
};

export default function LifestyleTipsDashboardScreen() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const retryFailedRef = useRef(false);
  const [status, setStatus] = useState<DailyTipsStatus>('pending');
  const [todayTips, setTodayTips] = useState<any>(null);
  const [shouldPoll, setShouldPoll] = useState(false);

  const [ensureTodayTips, { isLoading: ensuring }] = useEnsureTodayLifestyleTipsMutation();
  const { data: statusData, error: statusError, refetch: refetchStatus } = useGetLifestyleTipsStatusTodayQuery(undefined, {
    skip: !shouldPoll,
    pollingInterval: 6000,
  });

  const runEnsure = async () => {
    try {
      const res = await ensureTodayTips().unwrap();
      const nextStatus = (res?.status || 'pending') as DailyTipsStatus;
      setStatus(nextStatus);
      if (nextStatus === 'complete' && res?.tips) {
        setTodayTips(res.tips);
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
    const nextStatus = (statusData.status || 'not_found') as DailyTipsStatus;
    setStatus(nextStatus);
    if (nextStatus === 'complete' && statusData.tips) {
      setTodayTips(statusData.tips);
      setShouldPoll(false);
    } else if (nextStatus === 'pending') {
      setShouldPoll(true);
    } else if (nextStatus === 'not_found') {
      runEnsure();
    } else if (nextStatus === 'failed') {
      setShouldPoll(false);
      if (!retryFailedRef.current) {
        retryFailedRef.current = true;
        runEnsure();
      }
    } else {
      setShouldPoll(false);
    }
  }, [statusData]);

  const handleRefresh = async () => {
    await runEnsure();
    refetchStatus();
  };

  if (statusError && !todayTips && status === 'failed') {
    return <ErrorState onRetry={handleRefresh} error="Failed to load today's lifestyle tips." />;
  }

  const tipCount = todayTips?.categories?.reduce((sum: number, cat: TipCategory) => sum + (cat?.tips?.length || 0), 0) || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ensuring} onRefresh={handleRefresh} tintColor="#FFF" />}
      >
        <LinearGradient colors={['#4A7580', '#375A64']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.heroTitle}>Today's Lifestyle Tips</Text>
          <Text style={styles.heroSubtitle}>{tipCount} total tips</Text>
        </LinearGradient>

        {status === 'pending' && (
          <View style={styles.pendingCard}>
            <ActivityIndicator size="large" color="#4A7580" />
            <Text style={styles.pendingText}>Generating today's tips in the background...</Text>
          </View>
        )}

        {todayTips && todayTips.categories?.length > 0 && todayTips.categories.map((cat: TipCategory, catIdx: number) => (
          <View key={catIdx}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconWrap}>
                <MaterialCommunityIcons
                  name={(CATEGORY_ICONS[cat.name] || 'lightbulb-on-outline') as any}
                  size={18}
                  color="#4A7580"
                />
              </View>
              <Text style={styles.categoryName}>{cat.name?.replace(/_/g, ' ')}</Text>
            </View>

            {cat.tips?.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[tip.priority || 'medium'] || PRIORITY_COLORS.medium }]}>
                    <Text style={styles.priorityText}>{tip.priority || 'medium'}</Text>
                  </View>
                </View>
                <Text style={styles.tipDesc}>{tip.description}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: spacing[4], paddingBottom: spacing[12] },
  heroCard: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[4], ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  pendingCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  pendingText: { fontSize: 14, color: colors.neutral[600], marginTop: spacing[3] },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2], marginTop: spacing[2] },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.neutral[700], textTransform: 'capitalize' },
  tipCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.neutral[900] },
  tipDesc: { fontSize: 13, color: colors.neutral[600], lineHeight: 19 },
  priorityBadge: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, color: '#FFF', fontWeight: '600', textTransform: 'capitalize' },
});
