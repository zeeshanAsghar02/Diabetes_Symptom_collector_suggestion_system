/**
 * Diagnosis Question Screen
 * Ask user if they have been diagnosed with diabetes
 * Gradient hero + muted card design — no emojis
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useUpdateDiagnosisStatusMutation } from '@features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { updateUser, selectUser } from '@features/auth/authSlice';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

export default function DiagnosisScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [updateDiagnosisStatus, { isLoading }] = useUpdateDiagnosisStatusMutation();
  const [selected, setSelected] = useState<'yes' | 'no' | null>(
    user?.diabetes_diagnosed as 'yes' | 'no' | null
  );

  const handleSubmit = async () => {
    if (!selected) {
      Alert.alert('Please select an option', 'Please answer the question to continue.');
      return;
    }

    try {
      if (!user) {
        if (selected === 'yes') {
          router.push('/(auth)/signin');
        } else {
          router.push('/(onboarding)/symptoms');
        }
        return;
      }

      const result = await updateDiagnosisStatus({ diabetes_diagnosed: selected }).unwrap();
      dispatch(updateUser(result.data));

      if (selected === 'yes') {
        router.replace('/(tabs)/dashboard');
      } else {
        router.push('/(onboarding)/symptoms');
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to save your response. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/welcome');
            }
          }} style={s.heroBack}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={s.heroIcon}>
            <MaterialCommunityIcons name="stethoscope" size={28} color={HERO_FROM} />
          </View>

          <Text style={s.heroTitle}>Diabetes Diagnosis</Text>
          <Text style={s.heroSub}>
            This helps us personalise your experience and provide relevant recommendations.
          </Text>
        </LinearGradient>

        {/* Question */}
        <View style={s.card}>
          <Text style={s.question}>Have you been diagnosed with diabetes?</Text>

          {/* Yes */}
          <TouchableOpacity
            style={[s.option, selected === 'yes' && s.optionActive]}
            activeOpacity={0.7}
            onPress={() => setSelected('yes')}
          >
            <View style={[s.optionDot, selected === 'yes' && s.optionDotActive]}>
              {selected === 'yes' && <View style={s.optionDotInner} />}
            </View>
            <View style={s.optionInfo}>
              <Text style={[s.optionTitle, selected === 'yes' && s.optionTitleActive]}>Yes</Text>
              <Text style={s.optionDesc}>I have been diagnosed with diabetes</Text>
            </View>
            {selected === 'yes' && (
              <MaterialCommunityIcons name="check-circle" size={20} color={HERO_FROM} />
            )}
          </TouchableOpacity>

          {/* No */}
          <TouchableOpacity
            style={[s.option, selected === 'no' && s.optionActive]}
            activeOpacity={0.7}
            onPress={() => setSelected('no')}
          >
            <View style={[s.optionDot, selected === 'no' && s.optionDotActive]}>
              {selected === 'no' && <View style={s.optionDotInner} />}
            </View>
            <View style={s.optionInfo}>
              <Text style={[s.optionTitle, selected === 'no' && s.optionTitleActive]}>No</Text>
              <Text style={s.optionDesc}>I have not been diagnosed with diabetes</Text>
            </View>
            {selected === 'no' && (
              <MaterialCommunityIcons name="check-circle" size={20} color={HERO_FROM} />
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <TouchableOpacity
          style={[s.submitWrap, !selected && { opacity: 0.5 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!selected || isLoading}
        >
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
            <Text style={s.submitText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Privacy Info */}
        <View style={s.privacyRow}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={colors.neutral[400]} />
          <Text style={s.privacyText}>
            Your privacy is important. This information is kept confidential and used only to provide better health recommendations.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { flex: 1, padding: spacing[4] },

  // Hero
  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], alignItems: 'center', ...shadows.md },
  heroBack: { position: 'absolute', top: spacing[4], left: spacing[4], width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: spacing[3], ...shadows.sm },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3, marginBottom: spacing[2] },
  heroSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 19, paddingHorizontal: spacing[2] },

  // Card
  card: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[5], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  question: { fontSize: 17, fontWeight: '700', color: colors.neutral[800], textAlign: 'center', marginBottom: spacing[5] },

  // Options
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: borderRadius.md, padding: spacing[4], marginBottom: spacing[3] },
  optionActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '08' },
  optionDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.neutral[300], justifyContent: 'center', alignItems: 'center' },
  optionDotActive: { borderColor: HERO_FROM },
  optionDotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: HERO_FROM },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[700], marginBottom: 2 },
  optionTitleActive: { color: HERO_FROM },
  optionDesc: { fontSize: 13, fontWeight: '400', color: colors.neutral[500] },

  // Submit button
  submitWrap: { borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing[3], ...shadows.sm },
  submitGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Privacy
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], paddingHorizontal: spacing[2] },
  privacyText: { flex: 1, fontSize: 11, fontWeight: '400', color: colors.neutral[400], fontStyle: 'italic', lineHeight: 16 },
});
