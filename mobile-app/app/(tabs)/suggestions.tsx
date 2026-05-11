/**
 * Suggestions Screen
 * Personalized health suggestions hub — exercise plans,
 * lifestyle tips, monthly diet, and AI chat.
 * No emojis — MaterialCommunityIcons only
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
import { useGetExercisePlansQuery } from '@features/exercise/exercisePlanApi';
import { useGetCurrentTipsQuery } from '@features/lifestyle/lifestyleTipsApi';
import { Button } from '@components/common/Button';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing[3];
const CARD_WIDTH = (SCREEN_WIDTH - spacing[4] * 2 - CARD_GAP) / 2;

interface FeatureItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  bgStart: string;
  bgEnd: string;
  count?: number;
}

export default function SuggestionsScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isDiagnosed = user?.diabetes_diagnosed === 'yes';
  const hasCompletedProfile = !!user?.onboardingCompleted;
  const canAccess = isDiagnosed && hasCompletedProfile;

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const { data: exerciseData, isLoading: exerciseLoading, isError: exerciseError, refetch: exerciseRefetch } = useGetExercisePlansQuery(undefined, { skip: !canAccess });
  const { data: tipsData, refetch: tipsRefetch } = useGetCurrentTipsQuery();

  const isLoading = exerciseLoading;

  const handleRefresh = () => {
    exerciseRefetch();
    tipsRefetch();
  };

  const exerciseCount = Array.isArray(exerciseData?.data)
    ? exerciseData.data.filter((plan: any) => {
        const hasSessions = Array.isArray(plan?.sessions) && plan.sessions.length > 0;
        return hasSessions || plan?.status === 'final' || plan?.generation_status === 'complete';
      }).length
    : 0;
  const hasTips = Array.isArray(tipsData?.categories)
    ? tipsData.categories.some((category) => Array.isArray(category?.tips) && category.tips.length > 0)
    : false;

  const features: FeatureItem[] = [
    {
      icon: 'run',
      title: 'Exercise',
      subtitle: exerciseCount > 0 ? `${exerciseCount} plan${exerciseCount !== 1 ? 's' : ''}` : 'Get started',
      route: '/personalized/exercise-plan',
      count: exerciseCount,
      color: '#4A6078',
      bgStart: '#F0F4F8',
      bgEnd: '#E2EAF2',
    },
    {
      icon: 'calendar-month-outline',
      title: 'Monthly Diet',
      subtitle: 'Meal planning',
      route: '/personalized/monthly-diet-plan',
      color: '#6B5B8A',
      bgStart: '#F5F3F8',
      bgEnd: '#EDEAF2',
    },
    {
      icon: 'lightbulb-outline',
      title: 'Lifestyle Tips',
      subtitle: hasTips ? 'New tips ready' : 'Get advice',
      route: '/personalized/lifestyle-tips',
      color: '#4A7580',
      bgStart: '#F0F6F7',
      bgEnd: '#E3EEF0',
    },
    {
      icon: 'robot-outline',
      title: 'AI Assistant',
      subtitle: 'Ask anything',
      route: '/(tabs)/chat',
      color: '#4E5180',
      bgStart: '#F0F0F6',
      bgEnd: '#E5E5EF',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary[600]}
          />
        }
      >
        {/* ─── Hero Header ─── */}
        <LinearGradient
          colors={['#3B3F6B', '#2D3154']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting}>Hello, {firstName}</Text>
              <Text style={styles.heroTitle}>Your Health Hub</Text>
            </View>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{exerciseCount}</Text>
              <Text style={styles.heroStatLabel}>Exercise Plans</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{hasTips ? 'Ready' : 'Pending'}</Text>
              <Text style={styles.heroStatLabel}>Lifestyle Tips</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{canAccess ? 'Active' : isDiagnosed ? 'Setup Required' : 'Not Eligible'}</Text>
              <Text style={styles.heroStatLabel}>Status</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ─── Access Gates ─── */}

        {/* Gate 1: User is not diagnosed with diabetes */}
        {!isDiagnosed && (
          <View style={styles.gateCard}>
            <View style={styles.gateRow}>
              <View style={[styles.gateIconWrap, { backgroundColor: colors.neutral[100] }]}>
                <MaterialCommunityIcons name="lock-outline" size={22} color={colors.neutral[500]} />
              </View>
              <View style={styles.gateTextWrap}>
                <Text style={styles.gateTitle}>For Diagnosed Patients Only</Text>
                <Text style={styles.gateSubtitle}>
                  Personalized suggestions are available exclusively to users who have been diagnosed with diabetes.
                </Text>
              </View>
            </View>
            <View style={styles.gateInfoRow}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.neutral[400]} />
              <Text style={styles.gateInfoText}>
                If you have been diagnosed, update your diagnosis status from your Profile settings.
              </Text>
            </View>
          </View>
        )}

        {/* Gate 2: Diagnosed but personal/medical info not yet completed */}
        {isDiagnosed && !hasCompletedProfile && (
          <View style={styles.gateCard}>
            <View style={styles.gateRow}>
              <View style={[styles.gateIconWrap, { backgroundColor: colors.warning.bg }]}>
                <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.warning.dark} />
              </View>
              <View style={styles.gateTextWrap}>
                <Text style={styles.gateTitle}>Complete Your Health Profile</Text>
                <Text style={styles.gateSubtitle}>
                  Fill in your personal and medical information to unlock personalized diet plans, exercise plans, and lifestyle suggestions.
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              onPress={() => router.push('/personalized/personal-medical-info' as any)}
              style={styles.gateButton}
            >
              Complete Profile
            </Button>
          </View>
        )}

        {/* ─── Quick Actions (diagnosed + profile complete only) ─── */}
        {canAccess && (
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionPill}
              activeOpacity={0.7}
              onPress={() => router.push('/personalized/exercise-plan' as any)}
            >
              <LinearGradient
                colors={['#4A6078', '#5A7088']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickPillGradient}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
                <Text style={styles.quickPillText}>Today's Exercise Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionPill}
              activeOpacity={0.7}
              onPress={() => router.push('/personalized/lifestyle-tips' as any)}
            >
              <LinearGradient
                colors={['#4A7580', '#5A8590']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickPillGradient}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
                <Text style={styles.quickPillText}>Today's Lifestyle Tips</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Features Grid (diagnosed + profile complete only) ─── */}
        {canAccess && (
          <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Health Tools</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.grid}>
          {features.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.75}
              onPress={() => router.push(item.route as any)}
              style={styles.gridCard}
            >
              <LinearGradient
                colors={[item.bgStart, item.bgEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gridCardGradient}
              >
                <View style={styles.gridCardTop}>
                  <View style={[styles.gridIconWrap, { backgroundColor: `${item.color}18` }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                  </View>
                  {item.count !== undefined && item.count > 0 && (
                    <View style={[styles.gridBadge, { backgroundColor: item.color }]}>
                      <Text style={styles.gridBadgeText}>{item.count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.gridCardTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.gridCardSubtitle}>{item.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Medical Info Link ─── */}
        <TouchableOpacity
            style={styles.medicalInfoCard}
            activeOpacity={0.7}
            onPress={() => router.push('/personalized/personal-medical-info' as any)}
          >
            <View style={styles.medInfoIconWrap}>
              <MaterialCommunityIcons name="account-edit-outline" size={20} color={colors.neutral[600]} />
            </View>
            <View style={styles.medInfoTextWrap}>
              <Text style={styles.medInfoTitle}>Personal Medical Info</Text>
              <Text style={styles.medInfoSubtitle}>Update your health profile</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[400]} />
          </TouchableOpacity>
          </>
        )}

        {/* ─── Error Banner (if plans failed to load) ─── */}
        {exerciseError && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error.dark} />
            <Text style={styles.errorText}>
              Some data failed to load. Pull down to refresh.
            </Text>
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: spacing[4],
  },

  /* ─── Hero ─── */
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
  },
  heroTextWrap: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 2,
  },

  gateInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  gateInfoText: {
    flex: 1,
    fontSize: 11,
    color: colors.neutral[400],
    lineHeight: 15,
  },
  /* ─── Gate ─── */
  gateCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary[100],
    ...shadows.xs,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  gateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  gateTextWrap: {
    flex: 1,
  },
  gateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  gateSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 16,
    marginTop: 2,
  },
  gateButton: {
    alignSelf: 'stretch',
  },

  /* ─── Quick Actions ─── */
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  quickActionPill: {
    flex: 1,
  },
  quickPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    gap: 6,
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* ─── Section Header ─── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  /* ─── Features Grid ─── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: spacing[4],
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.xs,
  },
  gridCardGradient: {
    padding: spacing[4],
    minHeight: 120,
    justifyContent: 'space-between',
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  gridIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBadge: {
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  gridBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  gridCardSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },

  /* ─── Medical Info ─── */
  medicalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing[3],
    ...shadows.xs,
  },
  medInfoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  medInfoTextWrap: {
    flex: 1,
  },
  medInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  medInfoSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },

  /* ─── Error Banner ─── */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.bg,
    borderRadius: borderRadius.sm,
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  errorText: {
    fontSize: 12,
    color: colors.error.dark,
    flex: 1,
  },
});
