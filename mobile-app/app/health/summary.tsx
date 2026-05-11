/**
 * Health Summary Detail Screen
 *
 * Shows ONE metric at a time with a dropdown selector to switch between them,
 * similar to Google Fit / Apple Health summary view.
 * Steps, Distance, Calories, Sleep, Heart Rate → Google Fit (Health Connect)
 * Blood Glucose → Backend API (IoT device)
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
  VictoryGroup,
  VictoryArea,
} from 'victory-native';

import { useGetHealthHistoryQuery } from '@features/health/healthApi';
import { useGoogleFitData } from '@hooks/useGoogleFitData';
import type { FitRecord } from '@services/googleFitService';
import { HEALTH_CONNECT_SDK_STATUS } from '@services/googleFitService';
import type { HealthMetric } from '@app-types/api';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing[4] * 2 - spacing[4];
const CHART_HEIGHT = 200;
const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

const HEALTH_CONNECT_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

// ── data point ────────────────────────────────────────────

interface DataPoint {
  timestamp: string;
  value: number;
}

// ── metric config ─────────────────────────────────────────

interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  source: 'google_fit' | 'iot';
  format: (v: number) => string;
}

const ALL_METRICS: MetricConfig[] = [
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
    format: (v) => v.toFixed(2),
  },
  {
    key: 'calories_burned',
    label: 'Calories Burned',
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
    icon: 'power-sleep',
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
  {
    key: 'blood_glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    icon: 'water-percent',
    color: colors.chart.purple,
    source: 'iot',
    format: (v) => String(Math.round(v)),
  },
];

type TimeRange = 'weekly' | 'monthly';

// ── bucketData ────────────────────────────────────────────

function bucketData(
  records: DataPoint[],
  range: TimeRange,
): { label: string; avg: number }[] {
  const now = new Date();
  const buckets = new Map<string, { label: string; values: number[] }>();

  if (range === 'weekly') {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      buckets.set(key, { label: dayLabels[d.getDay()], values: [] });
    }
    for (const r of records) {
      const day = new Date(r.timestamp).toISOString().split('T')[0];
      if (buckets.has(day)) buckets.get(day)!.values.push(r.value);
    }
  } else {
    for (let w = 3; w >= 0; w--) {
      const key = `W${4 - w}`;
      buckets.set(key, { label: key, values: [] });
    }
    for (const r of records) {
      const ts = new Date(r.timestamp);
      const daysAgo = Math.floor(
        (now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysAgo < 28) {
        const weekIdx = Math.floor(daysAgo / 7);
        const key = `W${4 - weekIdx}`;
        if (buckets.has(key)) buckets.get(key)!.values.push(r.value);
      }
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    label: b.label,
    avg:
      b.values.length > 0
        ? b.values.reduce((a, c) => a + c, 0) / b.values.length
        : 0,
  }));
}

// ── Google Fit Connect Banner ─────────────────────────────

function ConnectBanner({
  onAuthorize,
}: {
  onAuthorize: () => Promise<void>;
}) {
  return (
    <View style={styles.connectBanner}>
      <MaterialCommunityIcons
        name="google-fit"
        size={22}
        color={colors.chart.green}
      />
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <Text style={styles.connectTitle}>
          {'Connect Google Fit'}
        </Text>
        <Text style={styles.connectSubtitle}>
          {'Grant Health Connect permissions to view fitness metrics.'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.connectBtn}
        onPress={onAuthorize}
        activeOpacity={0.7}
      >
        <Text style={styles.connectBtnText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

function SetupBanner({
  title,
  subtitle,
  actionLabel,
  onPress,
  icon,
  iconColor,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onPress?: () => void;
  icon: string;
  iconColor: string;
}) {
  return (
    <View style={styles.connectBanner}>
      <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <Text style={styles.connectTitle}>{title}</Text>
        <Text style={styles.connectSubtitle}>{subtitle}</Text>
      </View>
      {actionLabel && onPress ? (
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.connectBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── main screen ───────────────────────────────────────────

export default function SummaryDetailScreen() {
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>('weekly');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const metric = ALL_METRICS[selectedIdx];

  // Google Fit data
  const googleFit = useGoogleFitData(range);

  // Backend data (blood glucose)
  const { data: glucoseApiData, isLoading: glucoseLoading } =
    useGetHealthHistoryQuery('blood_glucose');

  const glucoseRecords: DataPoint[] = useMemo(
    () =>
      (glucoseApiData?.data ?? []).map((m: HealthMetric) => ({
        timestamp: m.timestamp,
        value: typeof m.value === 'number' ? m.value : 0,
      })),
    [glucoseApiData],
  );

  // Pick records for the selected metric
  const activeRecords: DataPoint[] = useMemo(() => {
    if (metric.source === 'iot') return glucoseRecords;
    return (
      googleFit.data[metric.key as keyof typeof googleFit.data] ?? []
    );
  }, [metric, googleFit.data, glucoseRecords]);

  const isActiveLoading =
    metric.source === 'iot' ? glucoseLoading : googleFit.isLoading;

  // Chart data
  const chartData = useMemo(
    () => bucketData(activeRecords, range),
    [activeRecords, range],
  );
  const hasData = chartData.some((d) => d.avg > 0);
  const latestReading =
    activeRecords.length > 0
      ? activeRecords[activeRecords.length - 1].value
      : null;

  const periodAvg = useMemo(() => {
    const valid = chartData.filter((d) => d.avg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((acc, d) => acc + d.avg, 0) / valid.length;
  }, [chartData]);

  const vals = chartData.filter((d) => d.avg > 0).map((d) => d.avg);
  const minY = vals.length > 0 ? Math.floor(Math.min(...vals) * 0.8) : 0;
  const maxY = vals.length > 0 ? Math.ceil(Math.max(...vals) * 1.2) : 100;

  const periodTotal = useMemo(() => {
    const valid = chartData.filter((d) => d.avg > 0);
    if (valid.length === 0) return null;
    return valid.reduce((acc, d) => acc + d.avg, 0);
  }, [chartData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await googleFit.refresh();
    setRefreshing(false);
  };

  const openHealthConnectStore = () => {
    Linking.openURL(HEALTH_CONNECT_PLAY_URL);
  };

  const needsDevBuild = !googleFit.isModuleAvailable;
  const needsHealthConnect = googleFit.isModuleAvailable && !googleFit.isAvailable;
  const needsPermissions =
    googleFit.isModuleAvailable && googleFit.isAvailable && !googleFit.isAuthorized;

  const hcStatus = googleFit.sdkStatus;
  const hcNeedsUpdate = hcStatus === HEALTH_CONNECT_SDK_STATUS.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  const hcNotInstalled = hcStatus === HEALTH_CONNECT_SDK_STATUS.SDK_UNAVAILABLE_PROVIDER_NOT_INSTALLED;

  const handleAuthorize = async () => {
    const granted = await googleFit.authorize();

    if (granted) {
      Alert.alert('Permissions granted', 'Health Connect permissions were granted successfully.');
      await googleFit.refresh();
      return;
    }

    googleFit.openSettings();

    Alert.alert(
      'Finish setup in Health Connect',
      'Grant permissions for this app and confirm Google Fit is connected in Health Connect, then come back and pull to refresh.',
    );
  };

  const handleSelectMetric = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedIdx(idx);
    setDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
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
        {/* ── Hero ─────────────────────────────────────── */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/health')}
            style={styles.heroBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="chart-line" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Health Summary</Text>
              <Text style={styles.heroSub}>Track your metrics over time</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Range toggle ─────────────────────────────── */}
        <View style={styles.toggleRow}>
          {(['weekly', 'monthly'] as TimeRange[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.toggleBtn,
                range === r && styles.toggleBtnActive,
              ]}
              onPress={() => setRange(r)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleText,
                  range === r && styles.toggleTextActive,
                ]}
              >
                {r === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Setup / Connect banners ──────────────────── */}
        {needsDevBuild ? (
          <SetupBanner
            icon="information-outline"
            iconColor={colors.chart.green}
            title="Google Fit setup"
            subtitle="This feature uses Android Health Connect. It won't work in Expo Go — switch to a development build (EAS/Dev Client) to enable Health Connect and sync Google Fit."
          />
        ) : needsHealthConnect ? (
          <SetupBanner
            icon={hcNeedsUpdate ? 'update' : 'download'}
            iconColor={colors.chart.green}
            title={hcNeedsUpdate ? 'Update Health Connect' : hcNotInstalled ? 'Install Health Connect' : 'Health Connect not ready'}
            subtitle={
              hcNeedsUpdate
                ? 'Health Connect is installed but needs an update. Update it from the Play Store, then connect Google Fit as a data source inside Health Connect.'
                : hcNotInstalled
                  ? 'Google Fit syncs through Health Connect. Install Health Connect, then connect Google Fit as a data source inside Health Connect.'
                  : 'Health Connect is not available yet. If you already installed it, try updating it from the Play Store and ensure it is enabled on this device.'
            }
            actionLabel={hcNeedsUpdate ? 'Update' : 'Get'}
            onPress={openHealthConnectStore}
          />
        ) : needsPermissions ? (
          <ConnectBanner onAuthorize={handleAuthorize} />
        ) : null}

        {/* Quick access to Health Connect settings when available */}
        {googleFit.isModuleAvailable ? (
          <TouchableOpacity
            style={styles.openSettingsRow}
            onPress={googleFit.openSettings}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={16}
              color={colors.neutral[500]}
            />
            <Text style={styles.openSettingsText}>Open Health Connect settings</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Metric selector (dropdown) ───────────────── */}
        <TouchableOpacity
          style={[
            styles.selector,
            { borderColor: metric.color + '40' },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <View style={styles.selectorLeft}>
            <View
              style={[
                styles.selectorIcon,
                { backgroundColor: metric.color + '14' },
              ]}
            >
              <MaterialCommunityIcons
                name={metric.icon as any}
                size={20}
                color={metric.color}
              />
            </View>
            <View>
              <Text style={styles.selectorLabel}>{metric.label}</Text>
              <View style={styles.selectorSourceRow}>
                <View
                  style={[
                    styles.sourceDot,
                    {
                      backgroundColor:
                        metric.source === 'google_fit'
                          ? colors.chart.green
                          : colors.chart.purple,
                    },
                  ]}
                />
                <Text style={styles.selectorSource}>
                  {metric.source === 'google_fit' ? 'Google Fit' : 'IoT Device'}
                </Text>
              </View>
            </View>
          </View>
          <MaterialCommunityIcons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.neutral[400]}
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {ALL_METRICS.map((m, idx) => {
              const isActive = idx === selectedIdx;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.dropdownItem,
                    isActive && { backgroundColor: m.color + '0A' },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectMetric(idx)}
                >
                  <View
                    style={[
                      styles.dropdownItemIcon,
                      { backgroundColor: m.color + '14' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={m.icon as any}
                      size={16}
                      color={m.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.dropdownItemLabel,
                        isActive && { color: m.color, fontWeight: '700' },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </View>
                  <Text style={styles.dropdownItemSource}>
                    {m.source === 'google_fit' ? 'Google Fit' : 'IoT'}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={m.color}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Stat cards ───────────────────────────────── */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Latest</Text>
            <Text style={[styles.statValue, { color: metric.color }]}>
              {latestReading !== null ? metric.format(latestReading) : '--'}
            </Text>
            <Text style={styles.statUnit}>{metric.unit}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {range === 'weekly' ? 'Week Avg' : 'Month Avg'}
            </Text>
            <Text style={[styles.statValue, { color: metric.color }]}>
              {periodAvg !== null ? metric.format(periodAvg) : '--'}
            </Text>
            <Text style={styles.statUnit}>{metric.unit}</Text>
          </View>
          {(metric.key === 'steps' ||
            metric.key === 'calories_burned') && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={[styles.statValue, { color: metric.color }]}>
                {periodTotal !== null ? metric.format(periodTotal) : '--'}
              </Text>
              <Text style={styles.statUnit}>{metric.unit}</Text>
            </View>
          )}
        </View>

        {/* ── Chart ────────────────────────────────────── */}
        <View style={[styles.chartCard, { borderColor: metric.color + '20' }]}>
          {isActiveLoading ? (
            <View style={styles.chartLoader}>
              <ActivityIndicator size="small" color={metric.color} />
            </View>
          ) : !hasData ? (
            <View style={styles.chartEmpty}>
              <MaterialCommunityIcons
                name="chart-line"
                size={32}
                color={colors.neutral[200]}
              />
              <Text style={styles.chartEmptyText}>No data for this period</Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <VictoryChart
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                padding={{ top: 16, bottom: 36, left: 48, right: 16 }}
                domainPadding={{ x: range === 'weekly' ? 22 : 14, y: 10 }}
                theme={VictoryTheme.material}
              >
                <VictoryAxis
                  tickValues={chartData.map((_, i) => i)}
                  tickFormat={chartData.map((d) => d.label)}
                  style={{
                    axis: { stroke: colors.neutral[200] },
                    tickLabels: {
                      fontSize: 11,
                      fill: colors.neutral[500],
                      fontWeight: '500',
                    },
                    grid: { stroke: 'transparent' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  domain={[minY, maxY]}
                  tickCount={4}
                  tickFormat={(t: number) =>
                    t >= 1000
                      ? `${(t / 1000).toFixed(0)}k`
                      : String(Math.round(t))
                  }
                  style={{
                    axis: { stroke: colors.neutral[200] },
                    tickLabels: {
                      fontSize: 10,
                      fill: colors.neutral[400],
                    },
                    grid: {
                      stroke: colors.neutral[100],
                      strokeDasharray: '4,4',
                    },
                  }}
                />
                {range === 'weekly' ? (
                  <VictoryBar
                    data={chartData.map((d, i) => ({
                      x: i,
                      y: d.avg || null,
                    }))}
                    style={{
                      data: {
                        fill: metric.color,
                        opacity: 0.85,
                        width: 20,
                      },
                    }}
                    cornerRadius={{ topLeft: 5, topRight: 5 }}
                  />
                ) : (
                  <VictoryGroup>
                    <VictoryArea
                      data={chartData
                        .map((d, i) => ({ x: i, y: d.avg || null }))
                        .filter((d) => d.y !== null)}
                      style={{
                        data: {
                          fill: metric.color,
                          fillOpacity: 0.1,
                          stroke: metric.color,
                          strokeWidth: 2.5,
                        },
                      }}
                      interpolation="monotoneX"
                    />
                    <VictoryScatter
                      data={chartData
                        .map((d, i) => ({ x: i, y: d.avg || null }))
                        .filter((d) => d.y !== null)}
                      size={5}
                      style={{
                        data: {
                          fill: metric.color,
                          stroke: colors.neutral[0],
                          strokeWidth: 2,
                        },
                      }}
                    />
                  </VictoryGroup>
                )}
              </VictoryChart>
            </View>
          )}
        </View>

        {/* ── Daily breakdown ──────────────────────────── */}
        {hasData && !isActiveLoading && (
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            {chartData.map((d, i) => (
              <View
                key={d.label}
                style={[
                  styles.breakdownRow,
                  i === chartData.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.breakdownDay}>{d.label}</Text>
                <View style={styles.breakdownBarTrack}>
                  <View
                    style={[
                      styles.breakdownBarFill,
                      {
                        backgroundColor: metric.color,
                        width:
                          d.avg > 0
                            ? `${Math.min(
                                (d.avg /
                                  Math.max(
                                    ...chartData.map((x) => x.avg),
                                  )) *
                                  100,
                                100,
                              )}%`
                            : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownValue}>
                  {d.avg > 0 ? metric.format(d.avg) : '--'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
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
  heroBack: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
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

  /* Range toggle */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    padding: 3,
    marginBottom: spacing[4],
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  toggleTextActive: {
    color: colors.primary[600],
  },

  /* Connect banner */
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chart.green + '0A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.chart.green + '30',
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  connectTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  connectSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  connectBtn: {
    backgroundColor: colors.chart.green,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[0],
  },

  openSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  openSettingsText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
  },

  /* Metric selector */
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  selectorSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectorSource: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },

  /* Dropdown */
  dropdownList: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  dropdownItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  dropdownItemSource: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginRight: spacing[1],
  },

  /* Stat cards */
  statRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 1,
  },

  /* Chart card */
  chartCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  chartLoader: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmpty: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  chartEmptyText: {
    fontSize: 13,
    color: colors.neutral[400],
  },
  chartWrapper: {
    alignItems: 'center',
  },

  /* Breakdown */
  breakdownSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: spacing[3],
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  breakdownDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    width: 36,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    width: 44,
    textAlign: 'right',
  },
});
