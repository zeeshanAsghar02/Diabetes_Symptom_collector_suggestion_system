/**
 * Monthly Diet Plan Detail View
 * Shows meal categories with multiple options, matching web MonthlyDietPlanView.
 * Correct field names: meal_type, option_name, food, preparation_time
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { useGetMonthlyPlanByIdQuery } from '@features/monthly-diet/monthlyDietPlanApi';
import type { MonthlyMealOption, MonthlyMealCategory } from '@features/monthly-diet/monthlyDietPlanApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#6B5B8A';
const HERO_TO = '#503F6E';

const CATEGORY_ICONS: Record<string, string> = {
  breakfast: 'weather-sunset-up',
  'mid-morning snack': 'cup-outline',
  lunch: 'weather-sunny',
  'evening snack': 'fruit-grapes-outline',
  dinner: 'weather-night',
  snacks: 'food-apple-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: '#D4882A',
  'mid-morning snack': '#4A7580',
  lunch: '#3D7A68',
  'evening snack': '#8A7245',
  dinner: '#4A6078',
  snacks: '#6B5B8A',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCatIcon(mealType: string): string {
  const key = mealType?.toLowerCase()?.replace(/_/g, ' ') || '';
  return CATEGORY_ICONS[key] || 'silverware-fork-knife';
}

function getCatColor(mealType: string): string {
  const key = mealType?.toLowerCase()?.replace(/_/g, ' ') || '';
  return CATEGORY_COLORS[key] || HERO_FROM;
}

export default function MonthlyDietPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<MonthlyMealOption | null>(null);
  const [selectedMealType, setSelectedMealType] = useState('');

  const { data, isLoading, error, refetch } = useGetMonthlyPlanByIdQuery(id);
  const plan = data?.data || (data as any)?.plan;

  if (isLoading) return <FullScreenLoader />;
  if (error || !plan) return <ErrorState onRetry={refetch} error="Failed to load plan." />;

  const categories: MonthlyMealCategory[] = plan.meal_categories || [];
  const totalOptions = categories.reduce((sum: number, c: MonthlyMealCategory) => sum + (c.options?.length || 0), 0);

  const handleOpenOption = (option: MonthlyMealOption, mealType: string) => {
    setSelectedOption(option);
    setSelectedMealType(mealType);
  };

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
          </View>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="calendar-month-outline" size={22} color={HERO_FROM} />
            </View>
          </View>
          <Text style={styles.heroTitle}>
            {MONTHS[(plan.month || 1) - 1]} {plan.year}
          </Text>
          <Text style={styles.heroSub}>Monthly Diet Plan</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>Meal Types</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalOptions}</Text>
              <Text style={styles.statLabel}>Options</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{plan.total_daily_calories || '--'}</Text>
              <Text style={styles.statLabel}>Daily Cal</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Meal Categories */}
        {categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="food-off" size={32} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>No meal categories in this plan.</Text>
          </View>
        ) : (
          categories.map((cat: MonthlyMealCategory, catIdx: number) => {
            const catColor = getCatColor(cat.meal_type);
            const catIcon = getCatIcon(cat.meal_type);
            const displayName = (cat.meal_type || 'Meal').replace(/_/g, ' ');

            return (
              <View key={catIdx} style={styles.categoryCard}>
                {/* Category Header */}
                <View style={styles.catHeader}>
                  <View style={[styles.catIconWrap, { backgroundColor: catColor + '18' }]}>
                    <MaterialCommunityIcons name={catIcon as any} size={20} color={catColor} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={styles.catTitle}>{displayName}</Text>
                    {cat.timing ? (
                      <Text style={styles.catTiming}>{cat.timing}</Text>
                    ) : null}
                  </View>
                  {cat.target_calories ? (
                    <View style={styles.catCalBadge}>
                      <Text style={styles.catCalText}>{cat.target_calories} cal</Text>
                    </View>
                  ) : null}
                </View>

                {/* Options */}
                {(cat.options || []).map((option: MonthlyMealOption, optIdx: number) => {
                  const itemNames = (option.items || [])
                    .map((it) => it.food)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ');
                  const moreCount = (option.items || []).length - 3;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={styles.optionCard}
                      activeOpacity={0.7}
                      onPress={() => handleOpenOption(option, displayName)}
                    >
                      <View style={styles.optionTop}>
                        <View style={styles.optionNumWrap}>
                          <Text style={styles.optionNum}>{optIdx + 1}</Text>
                        </View>
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionName} numberOfLines={1}>
                            {option.option_name || `Option ${optIdx + 1}`}
                          </Text>
                          {itemNames ? (
                            <Text style={styles.optionFoods} numberOfLines={1}>
                              {itemNames}{moreCount > 0 ? ` +${moreCount} more` : ''}
                            </Text>
                          ) : null}
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.neutral[300]} />
                      </View>
                      <View style={styles.optionMeta}>
                        {option.total_calories ? (
                          <View style={styles.metaChip}>
                            <MaterialCommunityIcons name="fire" size={12} color="#D4882A" />
                            <Text style={styles.metaText}>{option.total_calories} cal</Text>
                          </View>
                        ) : null}
                        {option.difficulty ? (
                          <View style={styles.metaChip}>
                            <MaterialCommunityIcons name="signal-cellular-2" size={12} color={HERO_FROM} />
                            <Text style={styles.metaText}>{option.difficulty}</Text>
                          </View>
                        ) : null}
                        {option.preparation_time ? (
                          <View style={styles.metaChip}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.neutral[500]} />
                            <Text style={styles.metaText}>{option.preparation_time}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}

        {/* Tips */}
        {plan.tips && plan.tips.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.sectionLine} />
            </View>
            {plan.tips.map((tip: string, idx: number) => (
              <View key={idx} style={styles.tipCard}>
                <View style={styles.tipIconWrap}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={HERO_FROM} />
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Meal Option Detail Modal */}
      <Portal>
        <Modal
          visible={!!selectedOption}
          onDismiss={() => setSelectedOption(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedOption && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconWrap, { backgroundColor: HERO_FROM + '18' }]}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={HERO_FROM} />
                </View>
                <Text style={styles.modalTitle}>{selectedOption.option_name}</Text>
                <Text style={styles.modalSub}>{selectedMealType}</Text>
              </View>

              {/* Meta row */}
              <View style={styles.modalMetaRow}>
                {selectedOption.total_calories ? (
                  <View style={styles.modalMetaChip}>
                    <MaterialCommunityIcons name="fire" size={14} color="#D4882A" />
                    <Text style={styles.modalMetaText}>{selectedOption.total_calories} cal</Text>
                  </View>
                ) : null}
                {selectedOption.difficulty ? (
                  <View style={styles.modalMetaChip}>
                    <Text style={styles.modalMetaText}>{selectedOption.difficulty}</Text>
                  </View>
                ) : null}
                {selectedOption.preparation_time ? (
                  <View style={styles.modalMetaChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.neutral[500]} />
                    <Text style={styles.modalMetaText}>{selectedOption.preparation_time}</Text>
                  </View>
                ) : null}
              </View>

              {selectedOption.description ? (
                <Text style={styles.modalDesc}>{selectedOption.description}</Text>
              ) : null}

              {/* Food Items */}
              {(selectedOption.items || []).length > 0 && (
                <Text style={styles.foodItemsLabel}>Food Items</Text>
              )}
              {(selectedOption.items || []).map((item, idx) => (
                <View key={idx} style={[
                  styles.foodItem,
                  idx < (selectedOption.items || []).length - 1 && styles.foodItemBorder,
                ]}>
                  <View style={styles.foodItemTop}>
                    <Text style={styles.foodName} numberOfLines={3}>{item.food}</Text>
                    {item.portion ? (
                      <Text style={styles.foodPortion}>{item.portion}</Text>
                    ) : null}
                  </View>
                  <View style={styles.foodNutrients}>
                    {item.calories != null ? (
                      <View style={styles.nutrientChip}>
                        <MaterialCommunityIcons name="fire" size={11} color="#D4882A" />
                        <Text style={styles.nutrientText}>{item.calories} cal</Text>
                      </View>
                    ) : null}
                    {item.carbs != null ? (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientLabel}>Carbs </Text>
                        <Text style={styles.nutrientText}>{item.carbs}g</Text>
                      </View>
                    ) : null}
                    {item.protein != null ? (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientLabel}>Protein </Text>
                        <Text style={styles.nutrientText}>{item.protein}g</Text>
                      </View>
                    ) : null}
                    {item.fat != null ? (
                      <View style={styles.nutrientChip}>
                        <Text style={styles.nutrientLabel}>Fat </Text>
                        <Text style={styles.nutrientText}>{item.fat}g</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}

              {/* Close */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedOption(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Modal>
      </Portal>
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
    paddingBottom: spacing[12],
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
    fontSize: 17,
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
  /* ---- Empty ---- */
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing[8],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.neutral[400],
    marginTop: spacing[2],
  },
  /* ---- Category Card ---- */
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.xs,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  catInfo: {
    flex: 1,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[800],
    textTransform: 'capitalize',
  },
  catTiming: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 1,
  },
  catCalBadge: {
    backgroundColor: '#FBF4E9',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  catCalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4882A',
  },
  /* ---- Option Card ---- */
  optionCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.sm,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: HERO_FROM + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  optionNum: {
    fontSize: 12,
    fontWeight: '700',
    color: HERO_FROM,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  optionFoods: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  optionMeta: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingLeft: 34,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  /* ---- Sections ---- */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    marginTop: spacing[2],
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
  /* ---- Tips ---- */
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  tipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: HERO_FROM + '14',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
    marginTop: 1,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral[600],
    flex: 1,
  },
  /* ---- Modal ---- */
  modal: {
    backgroundColor: '#fff',
    margin: spacing[4],
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: colors.neutral[400],
    marginTop: 2,
    textTransform: 'capitalize',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  modalMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  modalMetaText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutral[500],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  /* ---- Food Items (card per item) ---- */
  foodItemsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  foodItem: {
    paddingVertical: spacing[3],
  },
  foodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  foodItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  foodName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    lineHeight: 20,
  },
  foodPortion: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[500],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  foodNutrients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  nutrientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  nutrientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[400],
  },
  nutrientText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  /* ---- Close btn ---- */
  modalCloseBtn: {
    alignSelf: 'center',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginTop: spacing[5],
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
});
