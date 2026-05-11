/**
 * Lifestyle Tips Detail Screen
 * Shows all tips for a specific date from history.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useGetTipsByIdQuery,
  useDeleteTipsMutation,
  type TipCategory,
  type TipItem,
} from '@features/lifestyle/lifestyleTipsApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A7580';
const HERO_TO = '#375A64';

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

const CATEGORY_COLORS: Record<string, string> = {
  sleep_hygiene: '#6B5B8A',
  stress_management: '#7A5B5B',
  hydration: '#3D7A68',
  blood_sugar_monitoring: '#4A6078',
  medication_adherence: '#C0392B',
  foot_care: '#8B6B4A',
  dental_health: '#4A7580',
  social_support: '#5B6B8A',
  nutrition: '#3D7A68',
  activity: '#D4882A',
  monitoring: '#4A6078',
};

export default function LifestyleTipsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: tips, isLoading, isError, refetch } = useGetTipsByIdQuery(id!, { skip: !id });
  const [deleteTips, { isLoading: isDeleting }] = useDeleteTipsMutation();

  const totalTips = tips?.categories?.reduce(
    (sum: number, cat: TipCategory) => sum + (cat.tips?.length || 0),
    0,
  ) || 0;

  const dateLabel = tips?.target_date
    ? new Date(tips.target_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Tips', 'Are you sure you want to delete these tips?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTips(id)
            .unwrap()
            .then(() => router.back())
            .catch(() => Alert.alert('Error', 'Failed to delete.')),
      },
    ]);
  };

  if (isLoading) return <FullScreenLoader />;
  if (isError || !tips) return <ErrorState onRetry={refetch} error="Failed to load tips." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FFF" />}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={[HERO_FROM, HERO_TO]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="lightbulb-outline" size={26} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.heroTitle}>Lifestyle Tips</Text>
          <Text style={styles.heroSubtitle}>{dateLabel}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{tips.categories?.length || 0}</Text>
              <Text style={styles.heroStatLabel}>Categories</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalTips}</Text>
              <Text style={styles.heroStatLabel}>Tips</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{tips.region || 'Global'}</Text>
              <Text style={styles.heroStatLabel}>Region</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Categories & Tips */}
        {tips.categories?.map((cat: TipCategory, catIdx: number) => {
          const catColor = CATEGORY_COLORS[cat.name] || HERO_FROM;
          const catIcon = CATEGORY_ICONS[cat.name] || 'lightbulb-on-outline';

          return (
            <View key={catIdx} style={styles.categorySection}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconWrap, { backgroundColor: catColor + '18' }]}>
                  <MaterialCommunityIcons name={catIcon as any} size={20} color={catColor} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name?.replace(/_/g, ' ')}</Text>
                  <Text style={styles.categoryCount}>
                    {cat.tips?.length || 0} tip{(cat.tips?.length || 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Tips in this category */}
              {cat.tips?.map((tip: TipItem, idx: number) => (
                <View key={idx} style={styles.tipCard}>
                  <View style={styles.tipRow}>
                    <View style={[styles.tipDot, { backgroundColor: PRIORITY_COLORS[tip.priority] || colors.neutral[400] }]} />
                    <View style={styles.tipContent}>
                      <View style={styles.tipTitleRow}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[tip.priority] || colors.neutral[400] }]}>
                          <Text style={styles.priorityText}>{tip.priority}</Text>
                        </View>
                      </View>
                      <Text style={styles.tipDescription}>{tip.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Personalized Insights */}
        {tips.personalized_insights && tips.personalized_insights.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing[2] }]}>
              <MaterialCommunityIcons name="star-four-points-outline" size={16} color={colors.neutral[600]} />
              <Text style={styles.sectionTitle}>Personalized Insights</Text>
              <View style={styles.sectionLine} />
            </View>
            {tips.personalized_insights.map((insight: string, idx: number) => (
              <View key={idx} style={styles.insightCard}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#D4882A" />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </>
        )}

        {/* Sources */}
        {tips.sources && tips.sources.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing[4] }]}>
              <MaterialCommunityIcons name="book-open-outline" size={16} color={colors.neutral[600]} />
              <Text style={styles.sectionTitle}>Sources</Text>
              <View style={styles.sectionLine} />
            </View>
            {tips.sources.map((src, idx) => (
              <View key={idx} style={styles.sourceChip}>
                <MaterialCommunityIcons name="file-document-outline" size={14} color={colors.neutral[500]} />
                <Text style={styles.sourceText}>{src.title}</Text>
              </View>
            ))}
          </>
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
    marginBottom: spacing[5],
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
  heroActions: { flexDirection: 'row', gap: spacing[2] },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: spacing[4],
  },
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

  /* Category */
  categorySection: { marginBottom: spacing[4] },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: { flex: 1 },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
    textTransform: 'capitalize',
  },
  categoryCount: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  /* Tip card */
  tipCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  tipRow: { flexDirection: 'row', gap: spacing[3] },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipContent: { flex: 1 },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.neutral[900], flex: 1, marginRight: spacing[2] },
  priorityBadge: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, color: '#FFF', fontWeight: '600', textTransform: 'capitalize' },
  tipDescription: { fontSize: 14, color: colors.neutral[600], lineHeight: 20 },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[100] },

  /* Insights */
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: '#FFF8ED',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#F5E6D0',
  },
  insightText: { flex: 1, fontSize: 13, color: colors.neutral[700], lineHeight: 19 },

  /* Sources */
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.sm,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  sourceText: { fontSize: 13, color: colors.neutral[600], flex: 1 },
});
