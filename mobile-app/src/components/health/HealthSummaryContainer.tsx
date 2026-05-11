/**
 * Health Summary Container
 *
 * Compact clickable card showing a quick overview of health metrics.
 * Steps, Distance, Calories, Sleep, Heart Rate → Google Fit (Health Connect)
 * Blood Glucose → Backend API (IoT device)
 * Tapping opens the full detail view at /health/summary with charts.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useGetHealthSummaryQuery } from '@features/health/healthApi';
import { useGoogleFitData } from '@hooks/useGoogleFitData';
import type { FitMetricKey } from '@services/googleFitService';
import { spacing, borderRadius } from '@theme/spacing';
import colors from '@theme/colors';

// ── metric display config ─────────────────────────────────

interface MetricPreview {
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  source: 'google_fit' | 'iot';
  format: (v: number) => string;
}

const GOOGLE_FIT_METRICS: MetricPreview[] = [
  {
    key: 'steps',
    label: 'Steps',
    unit: 'steps',
    icon: 'walk',
    color: colors.chart.blue,
    source: 'google_fit',
    format: (v) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)),
  },
  {
    key: 'distance',
    label: 'Distance',
    unit: 'km',
    icon: 'map-marker-distance',
    color: colors.chart.green,
    source: 'google_fit',
    format: (v) => v.toFixed(1),
  },
  {
    key: 'calories_burned',
    label: 'Calories',
    unit: 'kcal',
    icon: 'fire',
    color: colors.chart.amber,
    source: 'google_fit',
    format: (v) => String(Math.round(v)),
  },
  {
    key: 'sleep_time',
    label: 'Sleep',
    unit: 'hrs',
    icon: 'sleep',
    color: colors.chart.indigo,
    source: 'google_fit',
    format: (v) => v.toFixed(1),
  },
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    icon: 'heart-pulse',
    color: colors.chart.red,
    source: 'google_fit',
    format: (v) => String(Math.round(v)),
  },
];

const GLUCOSE_METRIC: MetricPreview = {
  key: 'blood_glucose',
  label: 'Glucose',
  unit: 'mg/dL',
  icon: 'water-percent',
  color: colors.chart.purple,
  source: 'iot',
  format: (v) => String(Math.round(v)),
};

// ── component ─────────────────────────────────────────────

export function HealthSummaryContainer() {
  const router = useRouter();

  // Google Fit data (5 fitness metrics)
  const googleFit = useGoogleFitData();

  // Backend data (glucose from IoT)
  const { data: backendResponse, isLoading: backendLoading } =
    useGetHealthSummaryQuery();
  const backendSummary = backendResponse?.data;

  const navigateToDetail = () => {
    router.push('/health/summary' as any);
  };

  // Build combined metric list with values
  const allPreviews: { metric: MetricPreview; value: number | null }[] = [];

  // Google Fit metrics
  for (const m of GOOGLE_FIT_METRICS) {
    const val = googleFit.latestValues[m.key as FitMetricKey] ?? null;
    allPreviews.push({ metric: m, value: val });
  }

  // Glucose from backend
  const glucoseEntry = backendSummary?.['blood_glucose'];
  const glucoseVal =
    glucoseEntry && typeof glucoseEntry.value === 'number'
      ? glucoseEntry.value
      : null;
  allPreviews.push({ metric: GLUCOSE_METRIC, value: glucoseVal });

  const activeMetrics = allPreviews.filter((p) => p.value !== null);
  const isLoading = googleFit.isLoading || backendLoading;

  // ── loading state ──
  if (isLoading) {
    return (
      <View style={styles.container}>
        <SectionLabel />
        <View style={styles.card}>
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loaderText}>Loading summary...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── empty / not-connected state ──
  if (activeMetrics.length === 0) {
    return (
      <View style={styles.container}>
        <SectionLabel />
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.7}
          onPress={navigateToDetail}
        >
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons
              name="chart-line"
              size={28}
              color={colors.neutral[300]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>
              {googleFit.isAuthorized
                ? 'No Metrics Recorded'
                : 'Connect Google Fit'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {googleFit.isAuthorized
                ? 'Log glucose or start tracking activity with Google Fit.'
                : 'Connect Google Fit for steps, distance, calories, sleep, and heart rate.'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.neutral[400]}
          />
        </TouchableOpacity>
      </View>
    );
  }

  // ── data state — clickable summary card ──
  const previewMetrics = activeMetrics.slice(0, 4);
  const remaining = activeMetrics.length - 4;

  return (
    <View style={styles.container}>
      <SectionLabel />

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={navigateToDetail}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="chart-arc"
              size={22}
              color={colors.primary[600]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Health Summary</Text>
            <Text style={styles.cardSubtitle}>
              {activeMetrics.length}{' '}
              {activeMetrics.length === 1 ? 'metric' : 'metrics'} tracked
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.neutral[400]}
          />
        </View>

        {/* Source badges */}
        <View style={styles.sourceRow}>
          {googleFit.isAuthorized && (
            <View style={[styles.sourcePill, { backgroundColor: colors.chart.green + '14' }]}>
              <MaterialCommunityIcons
                name="google-fit"
                size={12}
                color={colors.chart.green}
              />
              <Text style={[styles.sourcePillText, { color: colors.chart.green }]}>
                Google Fit
              </Text>
            </View>
          )}
          {glucoseVal !== null && (
            <View style={[styles.sourcePill, { backgroundColor: colors.chart.purple + '14' }]}>
              <MaterialCommunityIcons
                name="bluetooth-connect"
                size={12}
                color={colors.chart.purple}
              />
              <Text style={[styles.sourcePillText, { color: colors.chart.purple }]}>
                IoT Device
              </Text>
            </View>
          )}
        </View>

        {/* Metric previews */}
        <View style={styles.metricsGrid}>
          {previewMetrics.map(({ metric: m, value: val }) => (
            <View key={m.key} style={styles.metricPreview}>
              <View style={[styles.metricDot, { backgroundColor: m.color }]} />
              <View style={styles.metricPreviewText}>
                <Text style={styles.metricPreviewLabel}>{m.label}</Text>
                <Text style={[styles.metricPreviewValue, { color: m.color }]}>
                  {m.format(val!)}{' '}
                  <Text style={styles.metricPreviewUnit}>{m.unit}</Text>
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Remaining indicator */}
        {remaining > 0 && (
          <View style={styles.previewRow}>
            <Text style={styles.previewText}>
              +{remaining} more {remaining === 1 ? 'metric' : 'metrics'}
            </Text>
          </View>
        )}

        {/* Tap hint */}
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>Tap to view all charts</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={14}
            color={colors.primary[600]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── section label ──

function SectionLabel() {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons
          name="chart-arc"
          size={20}
          color={colors.primary[600]}
        />
        <Text style={styles.sectionTitle}>Summary</Text>
      </View>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
  },

  // Card
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Source badges
  sourceRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Metric grid
  metricsGrid: {
    marginTop: spacing[3],
    gap: spacing[3],
  },
  metricPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricPreviewText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricPreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  metricPreviewValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricPreviewUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.neutral[400],
  },

  // Preview
  previewRow: {
    marginTop: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  previewText: {
    fontSize: 13,
    color: colors.neutral[600],
  },

  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },

  // Loading
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  loaderText: {
    fontSize: 14,
    color: colors.neutral[500],
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderStyle: 'dashed',
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 17,
  },
});
