/**
 * Diet Plan Detail Screen
 * Displays the full details of a selected diet plan.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useGetDietPlanByIdQuery, useDownloadDietPlanPDFMutation, useDeleteDietPlanMutation } from '@features/diet/dietPlanApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { MealCard } from '@components/health/MealCard';
import { NutritionPieChart } from '@components/charts/NutritionPieChart';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#3D7A68';
const HERO_TO = '#2E5F50';

export default function DietPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetDietPlanByIdQuery(id, { skip: !id });
  const [downloadPDF, { isLoading: isDownloading }] = useDownloadDietPlanPDFMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeleteDietPlanMutation();

  const plan = data?.data;

  // Backend uses nutritional_totals, handle both field names
  const nutritionData = plan?.nutritional_totals || plan?.nutritional_summary;
  const totalCalories = nutritionData?.total_calories ?? nutritionData?.calories ?? 0;
  const mealsCount = plan?.meals?.length ?? 0;

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Plan', 'Are you sure you want to delete this diet plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deletePlan(id)
            .unwrap()
            .then(() => router.back())
            .catch(() => Alert.alert('Error', 'Failed to delete the plan.')),
      },
    ]);
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const blob = await downloadPDF(id).unwrap();
      const file = new FileSystem.File(FileSystem.Paths.document, `diet-plan-${id}.pdf`);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        file.write(base64data, { encoding: 'base64' });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri);
        } else {
          Alert.alert('Sharing not available', 'Cannot share the file on this device.');
        }
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      Alert.alert('Download Failed', 'Could not download the PDF. Please try again.');
    }
  };

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isError || !plan) {
    return <ErrorState onRetry={refetch} error="Failed to load diet plan details." />;
  }

  const dateStr = new Date(plan.target_date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={HERO_FROM} />}
      >
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity onPress={handleDownload} disabled={isDownloading} style={styles.heroBtn}>
                <MaterialCommunityIcons name="download" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} disabled={isDeleting} style={styles.heroBtn}>
                <MaterialCommunityIcons name="delete-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={HERO_FROM} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Diet Plan</Text>
          <Text style={styles.heroSub}>{dateStr}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalCalories.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{mealsCount}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(plan.recommendations || plan.tips || []).length}</Text>
              <Text style={styles.statLabel}>Tips</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Nutritional Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutritional Summary</Text>
          <View style={styles.sectionLine} />
        </View>
        {nutritionData ? (
          <View style={styles.chartCard}>
            <NutritionPieChart summary={nutritionData} />
          </View>
        ) : (
          <Text style={styles.emptyLabel}>No nutritional data available</Text>
        )}

        {/* Meals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Meals</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.mealsContainer}>
          {(plan.meals || []).map((meal, index) => (
            <MealCard key={`${meal.name}-${index}`} meal={meal} />
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.recommendationsContainer}>
          {(plan.recommendations || plan.tips || []).map((rec, index) => (
            <View key={index} style={styles.recCard}>
              <View style={styles.recIconWrap}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={HERO_FROM} />
              </View>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
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
    paddingBottom: spacing[8],
  },
  /* ---- Hero ---- */
  hero: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  heroBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  heroIconRow: {
    marginBottom: spacing[2],
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  /* ---- Sections ---- */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
    marginRight: spacing[2],
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  /* ---- Chart ---- */
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[3],
    alignItems: 'center',
    marginBottom: spacing[6],
    ...shadows.xs,
  },
  emptyLabel: {
    fontSize: 13,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  /* ---- Meals ---- */
  mealsContainer: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  /* ---- Recommendations ---- */
  recommendationsContainer: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[3],
    ...shadows.xs,
  },
  recIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EDF6F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
    marginTop: 1,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[600],
    flex: 1,
  },
});
