/**
 * Medical Profile Screen
 * Gradient hero + chip selectors for diabetes type + text fields
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetProfileQuery, useUpdateProfileMutation } from '@features/profile/profileApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#3D7A68';
const HERO_TO = '#2D5A4E';

const DIABETES_TYPES = ['Type 1', 'Type 2', 'Gestational', 'Prediabetes', 'LADA', 'MODY'] as const;

const medicalInfoSchema = z.object({
  diabetes_type: z.enum(DIABETES_TYPES),
  diagnosis_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
});

type MedicalInfoForm = z.infer<typeof medicalInfoSchema>;

function Field({ label, icon, error, children }: { label: string; icon: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.fieldLabel}>
        <MaterialCommunityIcons name={icon as any} size={14} color={colors.neutral[500]} />
        <Text style={s.fieldLabelText}>{label}</Text>
      </View>
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function EditMedicalInfoScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<MedicalInfoForm>({
    resolver: zodResolver(medicalInfoSchema),
    defaultValues: { diabetes_type: 'Type 2', diagnosis_date: '', current_medications: '', allergies: '' },
  });

  React.useEffect(() => {
    if (!data?.data) return;
    const mi = data.data.medicalInfo;
    reset({
      diabetes_type: (mi.diabetes_type as MedicalInfoForm['diabetes_type']) ?? 'Type 2',
      diagnosis_date: String(mi.diagnosis_date ?? '').split('T')[0] || '',
      current_medications: mi.current_medications?.map((m: any) => m.medication_name).filter(Boolean).join(', ') || '',
      allergies: mi.allergies?.map((a: any) => a.allergen).filter(Boolean).join(', ') || '',
    });
  }, [data, reset]);

  const onSubmit = async (fd: MedicalInfoForm) => {
    const payload = {
      ...fd,
      current_medications: fd.current_medications?.split(',').map(n => ({ medication_name: n.trim() })),
      allergies: fd.allergies?.split(',').map(n => ({ allergen: n.trim() })),
    };
    try {
      await updateProfile({ medicalInfo: payload }).unwrap();
      Alert.alert('Updated', 'Medical information saved.');
    } catch {
      Alert.alert('Failed', 'Could not update your information.');
    }
  };

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load profile data." />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.heroIcon}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Medical Profile</Text>
          <Text style={s.heroSub}>Manage your diabetes and health information</Text>
        </LinearGradient>

        {/* Diabetes Type — chip selector */}
        <Field label="Diabetes Type" icon="diabetes" error={errors.diabetes_type?.message}>
          <Controller name="diabetes_type" control={control} render={({ field: { onChange, value } }) => (
            <View style={s.chipRow}>
              {DIABETES_TYPES.map(t => {
                const active = value === t;
                return (
                  <TouchableOpacity key={t} onPress={() => onChange(t)} style={[s.chip, active && s.chipActive]} activeOpacity={0.7}>
                    <Text style={[s.chipText, active && s.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )} />
        </Field>

        {/* Diagnosis Date */}
        <Field label="Diagnosis Date" icon="calendar-heart" error={errors.diagnosis_date?.message}>
          <Controller name="diagnosis_date" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="YYYY-MM-DD" placeholderTextColor={colors.neutral[400]} />
          )} />
        </Field>

        {/* Medications */}
        <Field label="Current Medications" icon="pill" error={errors.current_medications?.message}>
          <Controller name="current_medications" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={[s.input, s.multiInput]} value={value} onChangeText={onChange} onBlur={onBlur} multiline placeholder="Comma-separated list" placeholderTextColor={colors.neutral[400]} />
          )} />
        </Field>

        {/* Allergies */}
        <Field label="Allergies" icon="alert-circle-outline" error={errors.allergies?.message}>
          <Controller name="allergies" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={[s.input, s.multiInput]} value={value} onChangeText={onChange} onBlur={onBlur} multiline placeholder="Comma-separated list" placeholderTextColor={colors.neutral[400]} />
          )} />
        </Field>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSubmit(onSubmit)} disabled={isUpdating} activeOpacity={0.8}>
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
            {isUpdating ? <ActivityIndicator color="#FFF" size={18} /> : <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{isUpdating ? 'Saving...' : 'Save Changes'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[12] },

  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },

  fieldWrap: { marginBottom: spacing[4] },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[1] },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  fieldError: { fontSize: 12, color: colors.error.main, marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.neutral[200] },
  chipActive: { backgroundColor: HERO_FROM + '14', borderColor: HERO_FROM },
  chipText: { fontSize: 13, color: colors.neutral[600] },
  chipTextActive: { color: HERO_FROM, fontWeight: '600' },

  input: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: 15, color: colors.neutral[900] },
  multiInput: { minHeight: 70, textAlignVertical: 'top' },

  saveBtn: { marginTop: spacing[2] },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
