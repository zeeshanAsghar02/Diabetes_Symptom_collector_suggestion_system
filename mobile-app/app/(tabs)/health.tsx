/**
 * Tracking Screen
 * Clean layout: title, branding accent, quick stats, containers, glucose log
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { HealthDataContainer } from '@components/health/HealthDataContainer';
import { HealthSummaryContainer } from '@components/health/HealthSummaryContainer';
import { LogMetricModal } from '@components/health/LogMetricModal';
import { useGoogleFitData } from '@hooks/useGoogleFitData';
import { useGetHealthSummaryQuery } from '@features/health/healthApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { MetricType } from '@app-types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

// ── daily tips rotation ──
const DAILY_TIPS = [
  { icon: 'water' as const, tip: 'Stay hydrated — aim for 8 glasses of water today.' },
  { icon: 'walk' as const, tip: 'A 30-minute walk can help regulate blood sugar levels.' },
  { icon: 'food-apple' as const, tip: 'Choose whole grains over refined carbs for steadier energy.' },
  { icon: 'sleep' as const, tip: 'Consistent sleep helps your body manage insulin better.' },
  { icon: 'meditation' as const, tip: 'Stress raises blood sugar — try 5 minutes of deep breathing.' },
  { icon: 'heart-pulse' as const, tip: 'Monitor your heart rate during exercise for safer workouts.' },
  { icon: 'silverware-fork-knife' as const, tip: 'Eat smaller, balanced meals to avoid glucose spikes.' },
];

function getTodayTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export default function TrackingScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { latestValues, isAuthorized: fitConnected } = useGoogleFitData();
  const { data: healthSummary } = useGetHealthSummaryQuery();

  const handleOpenModal = (metric: MetricType) => {
    setSelectedMetric(metric);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMetric(null);
    setRefreshKey((k) => k + 1);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const tip = getTodayTip();

  // Quick-glance values
  const steps = latestValues.steps;
  const calories = latestValues.calories_burned;
  const heartRate = latestValues.heart_rate;
  const glucoseEntry = (healthSummary?.data as any)?.blood_glucose;
  const glucose =
    glucoseEntry && typeof glucoseEntry.value === 'number'
      ? glucoseEntry.value
      : null;

  const showConnectCard = !fitConnected;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        key={refreshKey}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
          />
        }
      >
        {/* ── Hero ────────────────────────────────────── */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Tracking</Text>
              <Text style={styles.heroSub}>Your health at a glance</Text>
            </View>
          </View>
        </LinearGradient>

        {showConnectCard && (
          <TouchableOpacity
            style={styles.connectCard}
            activeOpacity={0.8}
            onPress={() => router.push('/health/summary' as any)}
          >
            <View style={styles.connectIconWrap}>
              <MaterialCommunityIcons
                name="google-fit"
                size={20}
                color={colors.chart.green}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>Connect Google Fit</Text>
              <Text style={styles.connectSub}>
                Enable Health Connect permissions to sync steps, calories, and heart rate.
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        )}

        {/* ── Quick Stats Row ──────────────────────────── */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.chart.blue + '14' }]}>
              <MaterialCommunityIcons name="shoe-print" size={16} color={colors.chart.blue} />
            </View>
            <Text style={styles.quickStatValue}>
              {steps != null ? (steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(Math.round(steps))) : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>Steps</Text>
          </View>

          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.chart.amber + '14' }]}>
              <MaterialCommunityIcons name="fire" size={16} color={colors.chart.amber} />
            </View>
            <Text style={styles.quickStatValue}>
              {calories != null ? String(Math.round(calories)) : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>kcal</Text>
          </View>

          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.chart.red + '14' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.chart.red} />
            </View>
            <Text style={styles.quickStatValue}>
              {heartRate != null ? String(Math.round(heartRate)) : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>bpm</Text>
          </View>

          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.chart.purple + '14' }]}>
              <MaterialCommunityIcons name="water-percent" size={16} color={colors.chart.purple} />
            </View>
            <Text style={styles.quickStatValue}>
              {glucose != null ? String(Math.round(glucose)) : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>mg/dL</Text>
          </View>
        </View>

        {/* ── Daily Tip ────────────────────────────────── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <MaterialCommunityIcons
              name={tip.icon as any}
              size={18}
              color={colors.primary[600]}
            />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipLabel}>Tip of the day</Text>
            <Text style={styles.tipText}>{tip.tip}</Text>
          </View>
        </View>

        {/* ── Health Data (Q&A) ────────────────────────── */}
        <HealthDataContainer />

        {/* ── Summary (Charts) ─────────────────────────── */}
        <HealthSummaryContainer />

        {/* ── Blood Glucose Log ────────────────────────── */}
        <View style={styles.logSection}>
          <Text style={styles.sectionLabel}>Log a Reading</Text>
          <Text style={styles.sectionHint}>
            Fitness metrics sync automatically from Google Fit.
          </Text>

          <TouchableOpacity
            style={styles.glucoseCard}
            activeOpacity={0.7}
            onPress={() => handleOpenModal('blood_glucose')}
          >
            <View style={styles.glucoseLeft}>
              <View style={styles.glucoseIconWrap}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={26}
                  color={colors.chart.purple}
                />
              </View>
              <View>
                <Text style={styles.glucoseLabel}>Blood Glucose</Text>
                <Text style={styles.glucoseHint}>Tap to add a new reading</Text>
              </View>
            </View>
            <View style={styles.glucoseAddBtn}>
              <MaterialCommunityIcons
                name="plus"
                size={22}
                color={colors.neutral[0]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Data source footer ───────────────────────── */}
        <View style={styles.sourceFooter}>
          <View style={styles.sourceItem}>
            <View style={[styles.sourceDot, { backgroundColor: colors.chart.green }]} />
            <Text style={styles.sourceLabel}>
              Google Fit {fitConnected ? 'Connected' : 'Not connected'}
            </Text>
          </View>
          <View style={styles.sourceItem}>
            <View style={[styles.sourceDot, { backgroundColor: colors.chart.purple }]} />
            <Text style={styles.sourceLabel}>IoT / Manual</Text>
          </View>
        </View>

        <View style={{ height: spacing[6] }} />
      </ScrollView>

      {selectedMetric && (
        <LogMetricModal
          metricType={selectedMetric}
          visible={modalVisible}
          onDismiss={handleCloseModal}
        />
      )}
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: spacing[4],
  },

  /* Hero */
  hero: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadows.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  /* Connect card */
  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  connectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.chart.green + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  connectSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 17,
  },

  /* Quick stats */
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  quickStat: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    paddingVertical: spacing[3],
    alignItems: 'center',
    gap: 4,
  },
  quickStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* Daily tip */
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    color: colors.primary[800],
    lineHeight: 18,
  },

  /* Section helpers */
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.neutral[400],
    marginBottom: spacing[3],
  },

  /* Log section */
  logSection: {
    marginTop: spacing[4],
  },

  /* Glucose card */
  glucoseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  glucoseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  glucoseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chart.purple + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glucoseLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  glucoseHint: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  glucoseAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chart.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Source footer */
  sourceFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[5],
    marginTop: spacing[5],
    paddingVertical: spacing[3],
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceLabel: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: '500',
  },
});
