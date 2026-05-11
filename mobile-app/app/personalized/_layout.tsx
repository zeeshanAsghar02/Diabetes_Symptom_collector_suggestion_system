/**
 * Personalized Section Layout — access gate
 *
 * Rules (mirrors the web app flow):
 *  1. Not diagnosed (diabetes_diagnosed !== 'yes') → redirect to dashboard
 *  2. Diagnosed but onboarding not complete       → redirect to personal-medical-info
 *     (except if the user is already navigating TO personal-medical-info)
 *  3. Fully qualified                             → render the stack normally
 */
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';

import { useAppSelector } from '@store/hooks';
import { selectUser } from '@features/auth/authSlice';

export default function PersonalizedLayout() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAppSelector(selectUser);

  const isDiagnosed = user?.diabetes_diagnosed === 'yes';
  const hasCompletedProfile = !!user?.onboardingCompleted;

  // Is the user already navigating to (or already on) personal-medical-info?
  const isOnMedicalInfo = segments.some((s) => s === 'personal-medical-info');

  useEffect(() => {
    if (!user) return; // not yet loaded

    if (!isDiagnosed) {
      // Not a diabetic patient — go back to dashboard
      router.replace('/(tabs)/dashboard');
      return;
    }

    if (!hasCompletedProfile && !isOnMedicalInfo) {
      // Diagnosed but profile incomplete — complete it first
      router.replace('/personalized/personal-medical-info' as any);
    }
  }, [isDiagnosed, hasCompletedProfile, isOnMedicalInfo, user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
