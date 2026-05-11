/**
 * Personalized Suggestions Dashboard
 * Hub with cards linking to all personalized features.
 * Only accessible by diagnosed users.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@features/auth/authSlice';
import { spacing } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Daily Diet Plan',
    description: 'Get personalized meal plans based on your health profile.',
    icon: 'silverware-fork-knife',
    route: '/personalized/diet-plan',
    color: colors.success.main,
  },
  {
    title: 'Monthly Diet Plan',
    description: 'View and generate comprehensive monthly meal plans.',
    icon: 'calendar-month-outline',
    route: '/personalized/monthly-diet-plan',
    color: '#FF9800',
  },
  {
    title: 'Exercise Plan',
    description: 'Customized exercise routines for your fitness level.',
    icon: 'run',
    route: '/personalized/exercise-plan',
    color: colors.primary[600],
  },
  {
    title: 'Lifestyle Tips',
    description: 'Daily lifestyle recommendations for diabetes management.',
    icon: 'lightbulb-on-outline',
    route: '/personalized/lifestyle-tips',
    color: '#9C27B0',
  },
  {
    title: 'Habits Tracker',
    description: 'Track weekly habits for a healthier lifestyle.',
    icon: 'check-circle-outline',
    route: '/personalized/habits',
    color: '#00BCD4',
  },
  {
    title: 'AI Chat Assistant',
    description: 'Get answers about diabetes management from our AI.',
    icon: 'robot-outline',
    route: '/(tabs)/chat',
    color: '#607D8B',
  },
];

export default function PersonalizedDashboardScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);

  if (user?.diabetes_diagnosed !== 'yes') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.gateCard}>
            <View style={styles.gateIconContainer}>
              <MaterialCommunityIcons name="lock-outline" size={40} color={colors.neutral[400]} />
            </View>
            <Text style={styles.gateTitle}>Personalized Suggestions</Text>
            <Text style={styles.gateText}>
              This feature is only available for users who have been diagnosed with diabetes.
              Please update your diagnosis status to access personalized health plans.
            </Text>
            <Button variant="primary" onPress={() => router.push('/(tabs)/dashboard')}>
              Go to Dashboard
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Personalized Suggestions</Text>
        <Text style={styles.subtitle}>
          Your personalized health management hub. All recommendations are tailored to your profile.
        </Text>

        {/* Personal & Medical Info Card */}
        <Card 
          style={styles.profileCard}
          onPress={() => router.push('/personalized/personal-medical-info' as any)}
        >
          <View style={styles.profileContent}>
            <MaterialCommunityIcons name="account-outline" size={32} color={colors.primary[600]} style={{ marginRight: spacing[3] }} />
            <View style={styles.profileText}>
              <Text style={styles.profileTitle}>Personal & Medical Information</Text>
              <Text style={styles.profileDesc}>
                Review and update your personal and medical details for better recommendations.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>

        <Divider style={styles.divider} />

        {/* Feature Cards Grid */}
        <View style={styles.grid}>
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              style={styles.featureCard}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={styles.featureContent}>
                <View style={[styles.featureIconBg, { backgroundColor: feature.color + '15' }]}>
                  <MaterialCommunityIcons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.light.background.primary },
  container: { padding: spacing[4], paddingBottom: spacing[12] },
  title: { ...textStyles.h2, color: colors.primary[600], marginBottom: spacing[2] },
  subtitle: { ...textStyles.body2, color: colors.light.text.secondary, marginBottom: spacing[6] },
  profileCard: { marginBottom: spacing[4], padding: spacing[4] },
  profileContent: { flexDirection: 'row', alignItems: 'center' },
  gateIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.neutral[100], alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: spacing[4] },
  profileText: { flex: 1 },
  profileTitle: { ...textStyles.h6, color: colors.light.text.primary, marginBottom: spacing[1] },
  profileDesc: { ...textStyles.caption, color: colors.light.text.secondary },
  chevron: { fontSize: 24, color: colors.light.text.secondary },
  divider: { marginVertical: spacing[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
  featureCard: { width: '47%', padding: spacing[4] },
  featureContent: { alignItems: 'center' },
  featureIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },

  featureTitle: { ...textStyles.body1, color: colors.light.text.primary, fontWeight: '600', textAlign: 'center', marginBottom: spacing[1] },
  featureDesc: { ...textStyles.caption, color: colors.light.text.secondary, textAlign: 'center' },
  gateCard: { alignItems: 'center', padding: spacing[8] },

  gateTitle: { ...textStyles.h3, color: colors.light.text.primary, marginBottom: spacing[2] },
  gateText: { ...textStyles.body2, color: colors.light.text.secondary, textAlign: 'center', marginBottom: spacing[6] },
});
