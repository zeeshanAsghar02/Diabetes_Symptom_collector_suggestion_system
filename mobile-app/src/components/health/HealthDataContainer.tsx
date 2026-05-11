/**
 * Health Data Container
 * Clickable summary card showing the user's onboarding Q&A data.
 * Tapping opens the full detail view at /health/disease-data.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useGetUserDiseaseDataQuery } from '@features/assessment/assessmentApi';
import { spacing, borderRadius } from '@theme/spacing';
import colors from '@theme/colors';

// ── helpers ──

function fmtDate(val: string | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── component ──

export function HealthDataContainer() {
  const router = useRouter();
  const { data: response, isLoading } = useGetUserDiseaseDataQuery();

  // Backend returns single DiseaseData object (or empty {} when no data)
  const diseaseData = response?.data;

  const navigateToDetail = () => {
    router.push('/health/disease-data' as any);
  };

  // ── loading state ──
  if (isLoading) {
    return (
      <View style={styles.container}>
        <SectionLabel />
        <View style={styles.card}>
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loaderText}>Loading health data...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── empty state ──
  if (!diseaseData || !diseaseData.symptoms?.length) {
    return (
      <View style={styles.container}>
        <SectionLabel />
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.7}
          onPress={() => router.push('/assessment' as any)}
        >
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={28}
              color={colors.neutral[300]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>No Assessment Data</Text>
            <Text style={styles.emptySubtitle}>
              Complete your health assessment to see your data here.
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
  const progress = diseaseData.totalQuestions
    ? Math.round(
        (diseaseData.answeredQuestions / diseaseData.totalQuestions) * 100,
      )
    : 100;

  // Show first 3 symptom names as a preview
  const symptomPreview = diseaseData.symptoms
    .slice(0, 3)
    .map((s) => s.name)
    .join(', ');
  const remaining = diseaseData.symptoms.length - 3;

  const totalQA = diseaseData.symptoms.reduce(
    (acc, s) => acc + s.questions.length,
    0,
  );

  return (
    <View style={styles.container}>
      <SectionLabel />

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={navigateToDetail}
      >
        {/* Top row: icon + disease + chevron */}
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="stethoscope"
              size={22}
              color={colors.primary[600]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.diseaseName}>{diseaseData.disease}</Text>
            <Text style={styles.lastUpdated}>
              Updated {fmtDate(diseaseData.lastUpdated)}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.neutral[400]}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` as any },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {diseaseData.answeredQuestions}/{diseaseData.totalQuestions}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clipboard-pulse-outline"
              size={14}
              color={colors.neutral[500]}
            />
            <Text style={styles.statText}>
              {diseaseData.symptoms.length}{' '}
              {diseaseData.symptoms.length === 1 ? 'symptom' : 'symptoms'}
            </Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="comment-question-outline"
              size={14}
              color={colors.neutral[500]}
            />
            <Text style={styles.statText}>
              {totalQA} {totalQA === 1 ? 'answer' : 'answers'}
            </Text>
          </View>
        </View>

        {/* Symptom preview */}
        <View style={styles.previewRow}>
          <Text style={styles.previewText} numberOfLines={1}>
            {symptomPreview}
            {remaining > 0 ? ` +${remaining} more` : ''}
          </Text>
        </View>

        {/* Tap hint */}
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>Tap to view all details</Text>
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
          name="clipboard-text-outline"
          size={20}
          color={colors.primary[600]}
        />
        <Text style={styles.sectionTitle}>Health Data</Text>
      </View>
    </View>
  );
}

// ── styles ──

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
  diseaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
  },
  progressLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.neutral[300],
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
