import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetDietPlansQuery } from '@features/diet/dietPlanApi';
import { useGetExercisePlansQuery } from '@features/exercise/exercisePlanApi';
import { DietPlanCard } from '@components/health/DietPlanCard';
import { ExercisePlanCard } from '@components/health/ExercisePlanCard';
import { Button } from '@components/common/Button';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import colors from '@theme/colors';
import spacing from '@theme/spacing';
import { textStyles } from '@theme/typography';

type TabType = 'diet' | 'exercise';

export default function PlansScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('diet');
  const { data: dietData, isLoading: dietLoading } = useGetDietPlansQuery();
  const { data: exerciseData, isLoading: exerciseLoading } = useGetExercisePlansQuery();

  const isLoading = activeTab === 'diet' ? dietLoading : exerciseLoading;
  const dietPlans = dietData?.data || [];
  const exercisePlans = exerciseData?.data || [];

  const handleGenerateDiet = () => router.push('/personalized/diet-plan/generate');
  const handleGenerateExercise = () => router.push('/personalized/exercise-plan/generate');
  const handleViewDiet = (id: string) => router.push(`/personalized/diet-plan/${id}`);
  const handleViewExercise = (id: string) => router.push(`/personalized/exercise-plan/${id}`);

  if (isLoading) return <FullScreenLoader />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Plans</Text>
        <Text style={styles.subtitle}>Manage your personalized diet and exercise plans</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diet' && styles.activeTab]}
          onPress={() => setActiveTab('diet')}
        >
          <MaterialCommunityIcons name="food-apple" size={20} color={activeTab === 'diet' ? colors.primary[600] : colors.light.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'diet' && styles.activeTabText]}>Diet Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'exercise' && styles.activeTab]}
          onPress={() => setActiveTab('exercise')}
        >
          <MaterialCommunityIcons name="dumbbell" size={20} color={activeTab === 'exercise' ? colors.primary[600] : colors.light.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'exercise' && styles.activeTabText]}>Exercise Plans</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'diet' ? (
          <>
            <Button variant="primary" onPress={handleGenerateDiet} style={styles.generateButton}
              icon={<MaterialCommunityIcons name="plus-circle" size={20} color="white" />}>
              Generate New Diet Plan
            </Button>
            {dietPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="food-off" size={64} color={colors.light.text.tertiary} />
                <Text style={styles.emptyTitle}>No Diet Plans Yet</Text>
                <Text style={styles.emptyText}>Generate your first personalized diet plan</Text>
              </View>
            ) : (
              dietPlans.map((plan: any) => (
                <DietPlanCard key={plan._id} plan={plan} onPress={() => handleViewDiet(plan._id)} />
              ))
            )}
          </>
        ) : (
          <>
            <Button variant="primary" onPress={handleGenerateExercise} style={styles.generateButton}
              icon={<MaterialCommunityIcons name="plus-circle" size={20} color="white" />}>
              Generate New Exercise Plan
            </Button>
            {exercisePlans.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="run-fast" size={64} color={colors.light.text.tertiary} />
                <Text style={styles.emptyTitle}>No Exercise Plans Yet</Text>
                <Text style={styles.emptyText}>Generate your first personalized exercise plan</Text>
              </View>
            ) : (
              exercisePlans.map((plan: any) => (
                <ExercisePlanCard key={plan._id} plan={plan} onPress={() => handleViewExercise(plan._id)} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.light.background.primary },
  header: { paddingHorizontal: spacing[6], paddingTop: spacing[6], paddingBottom: spacing[4] },
  title: { ...textStyles.h4, color: colors.light.text.primary, marginBottom: spacing[2] },
  subtitle: { ...textStyles.body2, color: colors.light.text.secondary },
  tabContainer: { flexDirection: 'row', paddingHorizontal: spacing[6], marginBottom: spacing[4], gap: spacing[3] },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: spacing[2], backgroundColor: colors.light.background.secondary },
  activeTab: { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[600] },
  tabText: { ...textStyles.body2, color: colors.light.text.secondary, fontWeight: '500' },
  activeTabText: { color: colors.primary[600], fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  generateButton: { marginBottom: spacing[6] },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[12] },
  emptyTitle: { ...textStyles.h6, color: colors.light.text.primary, marginTop: spacing[4], marginBottom: spacing[2] },
  emptyText: { ...textStyles.body2, color: colors.light.text.secondary, textAlign: 'center' },
});
