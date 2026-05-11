/**
 * Edit Personal Info Screen
 * Gradient hero header + modern form fields
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
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

const HERO_FROM = '#4A7580';
const HERO_TO = '#375A64';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;
const ACTIVITY_OPTIONS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] as const;

const schema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  gender: z.enum(GENDER_OPTIONS),
  weight: z.number().min(20).max(500),
  height: z.number().min(50).max(300),
  activity_level: z.enum(ACTIVITY_OPTIONS),
});

type FormData = z.infer<typeof schema>;

const FEET_OPTIONS = [3, 4, 5, 6, 7, 8];
const INCHES_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function EditPersonalInfoScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', date_of_birth: '', gender: 'Male', weight: 0, height: 0, activity_level: 'Sedentary' },
  });

  React.useEffect(() => {
    if (!data?.data) return;
    const cm = Number(data.data.personalInfo.height ?? 0);
    if (cm > 0) {
      const totalIn = cm / 2.54;
      setHeightFeet(String(Math.floor(totalIn / 12)));
      setHeightInches(String(Math.round(totalIn % 12)));
    }
    reset({
      fullName: data.data.user.fullName ?? '',
      date_of_birth: String(data.data.personalInfo.date_of_birth ?? '').split('T')[0] || '',
      gender: (data.data.personalInfo.gender as FormData['gender']) ?? 'Male',
      weight: Number(data.data.personalInfo.weight ?? 0),
      height: cm,
      activity_level: (data.data.personalInfo.activity_level as FormData['activity_level']) ?? 'Sedentary',
    });
  }, [data, reset]);

  const onSubmit = async (d: FormData) => {
    try {
      await updateProfile({ personalInfo: d }).unwrap();
      Alert.alert('Updated', 'Your personal information has been saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch { Alert.alert('Error', 'Could not update your information.'); }
  };

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load profile." />;

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
              <MaterialCommunityIcons name="account-edit-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Personal Information</Text>
          <Text style={s.heroSub}>Update your profile details</Text>
        </LinearGradient>

        {/* Fields */}
        <Field label="Full Name" icon="account-outline" error={errors.fullName?.message}>
          <Controller name="fullName" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Enter full name" placeholderTextColor={colors.neutral[400]} />
          )} />
        </Field>

        <Field label="Date of Birth" icon="calendar-outline" error={errors.date_of_birth?.message}>
          <Controller name="date_of_birth" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="YYYY-MM-DD" placeholderTextColor={colors.neutral[400]} />
          )} />
        </Field>

        <Field label="Gender" icon="gender-male-female">
          <Controller name="gender" control={control} render={({ field: { onChange, value } }) => (
            <View style={s.chipRow}>
              {GENDER_OPTIONS.map(g => (
                <TouchableOpacity key={g} onPress={() => onChange(g)} style={[s.chip, value === g && s.chipActive]}>
                  <Text style={[s.chipText, value === g && s.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} />
        </Field>

        <View style={s.row}>
          <View style={s.halfField}>
            <Field label="Weight (kg)" icon="weight-kilogram" error={errors.weight?.message}>
              <Controller name="weight" control={control} render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput style={s.input} value={value ? String(value) : ''} onChangeText={v => onChange(Number(v) || 0)} onBlur={onBlur} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.neutral[400]} />
              )} />
            </Field>
          </View>
        </View>

        <Field label="Height" icon="human-male-height" error={errors.height?.message}>
          <Controller name="height" control={control} render={({ field: { onChange } }) => (
            <View>
              <Text style={s.heightSubLabel}>Feet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[2] }}>
                <View style={s.chipRow}>
                  {FEET_OPTIONS.map(ft => {
                    const active = heightFeet === String(ft);
                    return (
                      <TouchableOpacity key={ft} style={[s.chip, active && s.chipActive]} onPress={() => {
                        setHeightFeet(String(ft));
                        const totalCm = Math.round((ft * 30.48) + ((parseFloat(heightInches) || 0) * 2.54));
                        onChange(totalCm);
                      }} activeOpacity={0.7}>
                        <Text style={[s.chipText, active && s.chipTextActive]}>{ft} ft</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={s.heightSubLabel}>Inches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.chipRow}>
                  {INCHES_OPTIONS.map(inc => {
                    const active = heightInches === String(inc);
                    return (
                      <TouchableOpacity key={inc} style={[s.chip, active && s.chipActive]} onPress={() => {
                        setHeightInches(String(inc));
                        const totalCm = Math.round(((parseFloat(heightFeet) || 0) * 30.48) + (inc * 2.54));
                        onChange(totalCm);
                      }} activeOpacity={0.7}>
                        <Text style={[s.chipText, active && s.chipTextActive]}>{inc} in</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              {heightFeet && heightInches !== '' && (
                <Text style={s.heightHint}>
                  {Math.round((parseFloat(heightFeet) * 30.48) + (parseFloat(heightInches) * 2.54))} cm
                </Text>
              )}
            </View>
          )} />
        </Field>

        <Field label="Activity Level" icon="run">
          <Controller name="activity_level" control={control} render={({ field: { onChange, value } }) => (
            <View style={s.chipRow}>
              {ACTIVITY_OPTIONS.map(a => (
                <TouchableOpacity key={a} onPress={() => onChange(a)} style={[s.chip, value === a && s.chipActive]}>
                  <Text style={[s.chipText, value === a && s.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} />
        </Field>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSubmit(onSubmit)} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
            {saving ? <ActivityIndicator color="#FFF" size={18} /> : <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Reusable Field wrapper */
function Field({ label, icon, error, children }: { label: string; icon: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.fieldLabel}>
        <MaterialCommunityIcons name={icon as any} size={14} color={colors.neutral[500]} />
        <Text style={s.fieldLabelText}>{label}</Text>
      </View>
      {children}
      {error && <Text style={s.fieldError}>{error}</Text>}
    </View>
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

  input: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.neutral[900],
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: { backgroundColor: HERO_FROM + '18', borderColor: HERO_FROM },
  chipText: { fontSize: 13, color: colors.neutral[600], fontWeight: '500' },
  chipTextActive: { color: HERO_FROM, fontWeight: '600' },

  row: { flexDirection: 'row', gap: spacing[3] },
  halfField: { flex: 1 },

  heightSubLabel: { fontSize: 12, fontWeight: '500', color: colors.neutral[500], marginBottom: 4 },
  heightHint: { fontSize: 12, fontWeight: '500', color: colors.neutral[500], textAlign: 'center', marginTop: spacing[1] },

  saveBtn: { marginTop: spacing[2] },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

