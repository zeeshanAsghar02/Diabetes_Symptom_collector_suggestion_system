/**
 * Disease Data Detail Screen
 * Displays the user's onboarding Q&A grouped by symptom.
 * Navigated to from the Tracking screen's Health Data container.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetUserDiseaseDataQuery } from '@features/assessment/assessmentApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

// ── helpers ──────────────────────────────────────────

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

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

function fmtDateTime(val: string | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── component ────────────────────────────────────────────

export default function DiseaseDataScreen() {
  const router = useRouter();
  const { data: response, isLoading, isError, refetch } = useGetUserDiseaseDataQuery();
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Backend returns single DiseaseData object (or empty {} when no data)
  const diseaseData = response?.data;

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const toggleSymptom = (name: string) => {
    setExpandedSymptom((prev) => (prev === name ? null : name));
  };

  // ── loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HeroHeader onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/health')} />
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Loading your health data...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── error ──
  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HeroHeader onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/health')} />
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={colors.error.main}
            />
            <Text style={styles.errorText}>Failed to load health data</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryLabel}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── empty ──
  if (!diseaseData || !diseaseData.symptoms?.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HeroHeader onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/health')} />
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={48}
              color={colors.neutral[300]}
            />
            <Text style={styles.emptyTitle}>No Health Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete the onboarding assessment to see your health data here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const progress = diseaseData.totalQuestions
    ? Math.round((diseaseData.answeredQuestions / diseaseData.totalQuestions) * 100)
    : 100;

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
        <HeroHeader onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/health')} />
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <MaterialCommunityIcons
                name="stethoscope"
                size={22}
                color={colors.primary[600]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.diseaseName}>{diseaseData.disease}</Text>
              <Text style={styles.lastUpdated}>
                Last updated {fmtDate(diseaseData.lastUpdated)}
              </Text>
            </View>
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
              {diseaseData.answeredQuestions}/{diseaseData.totalQuestions} answered
            </Text>
          </View>
        </View>

        {/* Symptom accordion list */}
        {diseaseData.symptoms.map(
          (symptom: { name: string; questions: any[] }, idx: number) => {
            const isExpanded = expandedSymptom === symptom.name;

            return (
              <View key={symptom.name + idx} style={styles.symptomCard}>
                {/* Symptom header — tap to expand */}
                <TouchableOpacity
                  style={styles.symptomHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleSymptom(symptom.name)}
                >
                  <View style={styles.symptomLeft}>
                    <View style={styles.symptomBadge}>
                      <MaterialCommunityIcons
                        name="clipboard-pulse-outline"
                        size={16}
                        color={colors.primary[600]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.symptomName}>{symptom.name}</Text>
                      <Text style={styles.symptomCount}>
                        {symptom.questions.length}{' '}
                        {symptom.questions.length === 1 ? 'question' : 'questions'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.neutral[400]}
                  />
                </TouchableOpacity>

                {/* Expanded Q&A list */}
                {isExpanded && (
                  <View style={styles.qaList}>
                    {symptom.questions.map(
                      (
                        qa: {
                          question_id: string;
                          question: string;
                          answer: string;
                          date: string;
                        },
                        qIdx: number,
                      ) => (
                        <View
                          key={qa.question_id || qIdx}
                          style={[
                            styles.qaItem,
                            qIdx < symptom.questions.length - 1 && styles.qaItemBorder,
                          ]}
                        >
                          <View style={styles.qaRow}>
                            <Text style={styles.qaLabel}>Q:</Text>
                            <Text style={styles.qaQuestion}>{qa.question}</Text>
                          </View>
                          <View style={styles.qaRow}>
                            <Text style={styles.qaLabel}>A:</Text>
                            <Text style={styles.qaAnswer}>{qa.answer}</Text>
                          </View>
                          {qa.date ? (
                            <Text style={styles.qaDate}>
                              Answered on {fmtDateTime(qa.date)}
                            </Text>
                          ) : null}
                        </View>
                      ),
                    )}
                  </View>
                )}
              </View>
            );
          },
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── hero header ──

function HeroHeader({ onBack }: { onBack: () => void }) {
  return (
    <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <TouchableOpacity onPress={onBack} style={styles.heroBack} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name="clipboard-pulse-outline" size={22} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Health Data</Text>
          <Text style={styles.heroSub}>Your onboarding assessment responses</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ── styles ──

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[12],
  },

  // Hero
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: 14,
    color: colors.neutral[500],
  },
  errorText: {
    marginTop: spacing[3],
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  retryBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  retryLabel: {
    color: colors.neutral[0],
    fontWeight: '600',
    fontSize: 14,
  },
  emptyTitle: {
    marginTop: spacing[3],
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  emptySubtitle: {
    marginTop: spacing[2],
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 19,
  },

  // Summary card
  summaryCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diseaseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
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
    fontWeight: '500',
  },

  // Symptom cards
  symptomCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  symptomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  symptomBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  symptomCount: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },

  // Q&A items
  qaList: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  qaItem: {
    paddingVertical: spacing[3],
  },
  qaItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  qaRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: 4,
  },
  qaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[600],
    width: 20,
  },
  qaQuestion: {
    fontSize: 13,
    color: colors.neutral[700],
    flex: 1,
    lineHeight: 19,
  },
  qaAnswer: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
    flex: 1,
    lineHeight: 19,
  },
  qaDate: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
    marginLeft: 22,
  },
});
