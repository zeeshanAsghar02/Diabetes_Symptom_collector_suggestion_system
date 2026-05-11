/**
 * Home Screen — Dashboard
 * Gradient hero greeting + health metrics + quick actions + recent plans
 * Follows muted gradient design system — no emojis, MaterialCommunityIcons only
 */

import React from 'react';
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
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppSelector } from '@store/hooks';
import { selectUser } from '@features/auth/authSlice';
import { useGetCurrentUserQuery } from '@features/auth/authApi';
import { useGetDietPlansQuery } from '@features/diet/dietPlanApi';
import { useGetExercisePlansQuery } from '@features/exercise/exercisePlanApi';
import { useGetHealthSummaryQuery } from '@features/health/healthApi';
import { useGetLatestAssessmentQuery } from '@features/assessment/assessmentApi';
import { useGoogleFitData } from '@hooks/useGoogleFitData';
import { DiagnosisCheckModal } from '@components/common/DiagnosisCheckModal';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';
const ACCENT_HEALTH = '#3D7A68';
const ACCENT_ACTIONS = '#4A7580';
const ACCENT_PLANS = '#6B5B8A';
const ACCENT_EXPLORE = '#D4882A';

// ── Health Overview metric configs ──────────────────────
type FitKey = 'steps' | 'distance' | 'calories_burned' | 'sleep_time' | 'heart_rate';

interface OverviewMetric {
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  bg: string;
  source: 'google_fit' | 'iot';
  fitKey?: FitKey;
  backendKey?: string;
  format: (v: number) => string;
}

const HEALTH_OVERVIEW_METRICS: OverviewMetric[] = [
  { key: 'steps', label: 'Steps', unit: 'steps', icon: 'shoe-print', color: colors.chart.blue, bg: colors.chart.blue + '14', source: 'google_fit', fitKey: 'steps', format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)) },
  { key: 'distance', label: 'Distance', unit: 'km', icon: 'map-marker-distance', color: colors.chart.green, bg: colors.chart.green + '14', source: 'google_fit', fitKey: 'distance', format: (v) => v.toFixed(1) },
  { key: 'calories', label: 'Calories', unit: 'kcal', icon: 'fire', color: colors.chart.amber, bg: colors.chart.amber + '14', source: 'google_fit', fitKey: 'calories_burned', format: (v) => String(Math.round(v)) },
  { key: 'sleep', label: 'Sleep', unit: 'hrs', icon: 'power-sleep', color: colors.chart.indigo, bg: colors.chart.indigo + '14', source: 'google_fit', fitKey: 'sleep_time', format: (v) => v.toFixed(1) },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: 'heart-pulse', color: colors.chart.red, bg: colors.chart.red + '14', source: 'google_fit', fitKey: 'heart_rate', format: (v) => String(Math.round(v)) },
  { key: 'blood_glucose', label: 'Glucose', unit: 'mg/dL', icon: 'water-percent', color: colors.chart.purple, bg: colors.chart.purple + '14', source: 'iot', backendKey: 'blood_glucose', format: (v) => String(Math.round(v)) },
];

interface QuickActionItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route: string;
  color: string;
  bg: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const { refetch, isLoading } = useGetCurrentUserQuery();
  const { data: dietData } = useGetDietPlansQuery();
  const { data: exerciseData } = useGetExercisePlansQuery();
  const { latestValues: fitValues, isAuthorized: fitConnected } = useGoogleFitData();
  const { data: healthSummary } = useGetHealthSummaryQuery();
  const { data: latestAssessment } = useGetLatestAssessmentQuery();

  const rawRiskLevel = latestAssessment?.data?.result?.risk_level;
  const RISK_CHIP_COLOR: Record<string, string> = {
    High: '#FCA5A5',
    Medium: '#FCD34D',
    Low: '#6EE7B7',
  };
  // Normalise: Python model / DB returns 'high','moderate','critical','low' — map to display keys
  const latestRiskLevel = rawRiskLevel
    ? (() => {
        const v = rawRiskLevel.toLowerCase();
        if (v === 'high' || v === 'critical') return 'High';
        if (v === 'medium' || v === 'moderate') return 'Medium';
        return 'Low';
      })()
    : undefined;
  const riskChipColor = latestRiskLevel ? (RISK_CHIP_COLOR[latestRiskLevel] ?? 'rgba(255,255,255,0.6)') : null;

  const isDiagnosed = user?.diabetes_diagnosed === 'yes';
  const dietPlansCount = dietData?.data?.length || 0;
  const exercisePlansCount = exerciseData?.data?.length || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const quickActions: QuickActionItem[] = isDiagnosed
    ? [
        { icon: 'food-apple-outline', label: 'Diet Plans', route: '/personalized/diet-plan', color: colors.success.dark, bg: colors.success.bg },
        { icon: 'run', label: 'Exercise', route: '/personalized/exercise-plan', color: colors.info.dark, bg: colors.info.bg },
        { icon: 'robot-outline', label: 'AI Chat', route: '/(tabs)/chat', color: colors.primary[700], bg: colors.primary[50] },
        { icon: 'chart-box-outline', label: 'Assessment', route: '/assessment/results', color: colors.warning.dark, bg: colors.warning.bg },
        { icon: 'calendar-month-outline', label: 'Monthly Diet', route: '/personalized/monthly-diet-plan', color: colors.chart.purple, bg: '#F3E8FF' },
        { icon: 'lightbulb-outline', label: 'Tips', route: '/personalized/lifestyle-tips', color: colors.chart.cyan, bg: '#ECFEFF' },
      ]
    : [
        { icon: 'clipboard-text-outline', label: 'Assessment', route: '/assessment/results', color: colors.primary[700], bg: colors.primary[50] },
        { icon: 'newspaper-variant-outline', label: 'Articles', route: '/(tabs)/content', color: colors.info.dark, bg: colors.info.bg },
        { icon: 'robot-outline', label: 'AI Chat', route: '/(tabs)/chat', color: colors.success.dark, bg: colors.success.bg },
        { icon: 'account-group-outline', label: 'Community', route: '/feedback/community', color: colors.warning.dark, bg: colors.warning.bg },
      ];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      {/* Diagnosis-check popup — fires once per login session for undiagnosed users who have an assessment */}
      <DiagnosisCheckModal />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary[600]} />}
      >
        {/* ─── Hero Greeting ─── */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroGreeting}>{getGreeting()},</Text>
              <Text style={s.heroName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {user?.fullName || 'User'}
              </Text>
            </View>
            <TouchableOpacity style={s.avatarWrap} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              <Text style={s.avatarText}>{getInitials()}</Text>
            </TouchableOpacity>
          </View>

          {/* Inline status chips */}
          <View style={s.heroChips}>
            {isDiagnosed ? (
              <>
                <View style={s.heroChip}>
                  <MaterialCommunityIcons name="shield-check-outline" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={s.heroChipText}>Monitoring active</Text>
                </View>
                <View style={s.heroChip}>
                  <MaterialCommunityIcons name="food-apple-outline" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={s.heroChipText}>{dietPlansCount} diet</Text>
                </View>
                <View style={s.heroChip}>
                  <MaterialCommunityIcons name="run" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={s.heroChipText}>{exercisePlansCount} exercise</Text>
                </View>
                {/* Latest assessment risk chip — tapping shows stored result, no model re-run */}
                {riskChipColor && latestRiskLevel && (
                  <TouchableOpacity
                    style={s.heroChip}
                    onPress={() => router.push('/assessment/results' as any)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons name="clipboard-pulse-outline" size={12} color={riskChipColor} />
                    <Text style={[s.heroChipText, { color: riskChipColor }]}>
                      {latestRiskLevel} Risk
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity style={s.heroChipCta} onPress={() => router.push('/assessment')} activeOpacity={0.8}>
                <MaterialCommunityIcons name="clipboard-pulse-outline" size={13} color="#FFF" />
                <Text style={s.heroChipCtaText}>Take Health Assessment</Text>
                <MaterialCommunityIcons name="arrow-right" size={13} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* ─── Health Overview ─── */}
        {isDiagnosed && (
          <>
            <SectionHeader label="Health Overview" accent={ACCENT_HEALTH} />
            <View style={s.metricsGrid}>
              {HEALTH_OVERVIEW_METRICS.map((m) => {
                const val = m.source === 'google_fit'
                  ? fitValues[m.fitKey!]
                  : (healthSummary?.data as any)?.[m.backendKey!]?.value ?? null;
                const display = val != null ? m.format(val) : '--';
                return (
                  <TouchableOpacity key={m.key} style={s.metricCard} activeOpacity={0.7} onPress={() => router.push('/(tabs)/health' as any)}>
                    <View style={[s.metricIconWrap, { backgroundColor: m.bg }]}>
                      <MaterialCommunityIcons name={m.icon as any} size={18} color={m.color} />
                    </View>
                    <Text style={s.metricValue} numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
                    <Text style={s.metricLabel}>{m.label}</Text>
                    <Text style={s.metricUnit}>{m.unit}</Text>
                    {m.source === 'google_fit' && !fitConnected && (
                      <View style={s.metricBadge}><Text style={s.metricBadgeText}>Connect</Text></View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Quick Actions ─── */}
        <SectionHeader label="Quick Actions" accent={ACCENT_ACTIONS} />
        <View style={s.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={s.actionCard} activeOpacity={0.7} onPress={() => router.push(action.route as any)}>
              <View style={[s.actionIconWrap, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Recent Plans ─── */}
        {isDiagnosed && (dietPlansCount > 0 || exercisePlansCount > 0) && (
          <>
            <SectionHeader label="Recent Plans" accent={ACCENT_PLANS} />

            {dietPlansCount > 0 && dietData?.data?.[0] && (
              <TouchableOpacity style={s.recentCard} activeOpacity={0.7} onPress={() => router.push(`/personalized/diet-plan/${dietData.data[0]._id}` as any)}>
                <View style={[s.recentIconWrap, { backgroundColor: colors.success.bg }]}>
                  <MaterialCommunityIcons name="food-apple-outline" size={20} color={colors.success.dark} />
                </View>
                <View style={s.recentTextWrap}>
                  <Text style={s.recentTitle} numberOfLines={1}>{(dietData.data[0] as any).plan_name || 'Diet Plan'}</Text>
                  <Text style={s.recentSub}>{(dietData.data[0] as any).duration || 'Personalized diet plan'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}

            {exercisePlansCount > 0 && exerciseData?.data?.[0] && (
              <TouchableOpacity style={s.recentCard} activeOpacity={0.7} onPress={() => router.push(`/personalized/exercise-plan/${exerciseData.data[0]._id}` as any)}>
                <View style={[s.recentIconWrap, { backgroundColor: colors.info.bg }]}>
                  <MaterialCommunityIcons name="run" size={20} color={colors.info.dark} />
                </View>
                <View style={s.recentTextWrap}>
                  <Text style={s.recentTitle} numberOfLines={1}>{(exerciseData.data[0] as any).plan_name || 'Exercise Plan'}</Text>
                  <Text style={s.recentSub}>{(exerciseData.data[0] as any).duration || 'Personalized exercise plan'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ─── For undiagnosed: show their latest assessment result if available ─── */}
        {!isDiagnosed && latestRiskLevel && (
          <>
            <SectionHeader label="Your Latest Assessment" accent={ACCENT_HEALTH} />
            <TouchableOpacity
              style={s.riskCard}
              activeOpacity={0.75}
              onPress={() => router.push('/assessment/results' as any)}
            >
              <View style={[s.riskIconWrap, {
                backgroundColor: latestRiskLevel === 'High' ? '#FEE2E2' : latestRiskLevel === 'Medium' ? '#FEF3C7' : '#D1FAE5',
              }]}>
                <MaterialCommunityIcons
                  name="clipboard-pulse-outline"
                  size={22}
                  color={latestRiskLevel === 'High' ? '#DC2626' : latestRiskLevel === 'Medium' ? '#D97706' : '#059669'}
                />
              </View>
              <View style={s.riskTextWrap}>
                <Text style={s.riskTitle}>{latestRiskLevel} Risk of Diabetes</Text>
                <Text style={s.riskSub}>Based on your symptom assessment · Tap to view full report</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          </>
        )}

        {/* ─── Explore ─── */}
        <SectionHeader label="Explore" accent={ACCENT_EXPLORE} />
        <View style={s.exploreRow}>
          <ExploreCard icon="newspaper-variant-outline" label="Articles" color={ACCENT_ACTIONS} onPress={() => router.push('/(tabs)/content')} />
          <ExploreCard icon="account-group-outline" label="Community" color={ACCENT_EXPLORE} onPress={() => router.push('/feedback/community' as any)} />
          <ExploreCard icon="robot-outline" label="AI Chat" color={ACCENT_HEALTH} onPress={() => router.push('/(tabs)/chat')} />
        </View>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Reusable sub-components ─── */

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={s.sectionRowLeft}>
      <View style={[s.sectionDot, { backgroundColor: accent }]} />
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function ExploreCard({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.exploreCard} activeOpacity={0.7} onPress={onPress}>
      <View style={[s.exploreIconWrap, { backgroundColor: color + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={s.exploreLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  scrollContent: { padding: spacing[4] },

  // Hero
  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  heroGreeting: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: spacing[2] + 2, paddingVertical: 4, borderRadius: borderRadius.full },
  heroChipText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroChipCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  heroChipCtaText: { fontSize: 12, fontWeight: '600', color: '#FFF' },

  // Section headers
  sectionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  // Metrics Grid (3 col)
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] },
  metricCard: {
    width: (SCREEN_WIDTH - spacing[4] * 2 - spacing[2] * 2) / 3,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[2] + 2,
    alignItems: 'center',
    ...shadows.xs,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  metricIconWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[1] },
  metricValue: { fontSize: 20, fontWeight: '700', color: colors.neutral[800], marginBottom: 1 },
  metricLabel: { fontSize: 10, fontWeight: '500', color: colors.neutral[500] },
  metricUnit: { fontSize: 9, color: colors.neutral[400], marginTop: 1 },
  metricBadge: { marginTop: spacing[1], paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: colors.primary[50] },
  metricBadgeText: { fontSize: 9, fontWeight: '600', color: colors.primary[600] },

  // Quick Actions (3 col)
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] },
  actionCard: {
    width: (SCREEN_WIDTH - spacing[4] * 2 - spacing[2] * 2) / 3,
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    ...shadows.xs,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  actionIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[2] },
  actionLabel: { fontSize: 11, fontWeight: '600', color: colors.neutral[700], textAlign: 'center' },

  // Recent Plans
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  recentIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  recentTextWrap: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  recentSub: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  // Risk card (assessment result for undiagnosed)
  riskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[3], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  riskIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  riskTextWrap: { flex: 1 },
  riskTitle: { fontSize: 15, fontWeight: '700', color: colors.neutral[800] },
  riskSub: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },

  // Explore
  exploreRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  exploreCard: { flex: 1, backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, paddingVertical: spacing[4], alignItems: 'center', gap: spacing[2], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  exploreIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  exploreLabel: { fontSize: 11, fontWeight: '600', color: colors.neutral[700] },
});


