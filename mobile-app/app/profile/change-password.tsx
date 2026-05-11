/**
 * Change Password Screen
 * Gradient hero + secure form fields with visibility toggles
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@utils/validation';
import type { ChangePasswordForm } from '@utils/validation';
import { useChangePasswordMutation } from '@features/auth/authApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A6078';
const HERO_TO = '#384D60';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (d: ChangePasswordForm) => {
    if (d.newPassword !== d.confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    try {
      await changePassword({ oldPassword: d.oldPassword, newPassword: d.newPassword }).unwrap();
      Alert.alert('Success', 'Your password has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Failed', e.data?.message || 'Could not change your password.');
    }
  };

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
              <MaterialCommunityIcons name="lock-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Change Password</Text>
          <Text style={s.heroSub}>Keep your account secure with a strong password</Text>
        </LinearGradient>

        {/* Security note */}
        <View style={s.noteCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={HERO_FROM} />
          <Text style={s.noteText}>Password must be 8+ characters with uppercase, lowercase, number, and special character.</Text>
        </View>

        {/* Fields */}
        <PwField label="Current Password" icon="lock-open-outline" error={errors.oldPassword?.message} show={showOld} toggle={() => setShowOld(!showOld)}>
          <Controller name="oldPassword" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry={!showOld} placeholder="Enter current password" placeholderTextColor={colors.neutral[400]} />
          )} />
        </PwField>

        <PwField label="New Password" icon="lock-outline" error={errors.newPassword?.message} show={showNew} toggle={() => setShowNew(!showNew)}>
          <Controller name="newPassword" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry={!showNew} placeholder="Enter new password" placeholderTextColor={colors.neutral[400]} />
          )} />
        </PwField>

        <PwField label="Confirm Password" icon="lock-check-outline" error={errors.confirmPassword?.message} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)}>
          <Controller name="confirmPassword" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput style={s.input} value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry={!showConfirm} placeholder="Re-enter new password" placeholderTextColor={colors.neutral[400]} />
          )} />
        </PwField>

        {/* Save */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSubmit(onSubmit)} disabled={isLoading} activeOpacity={0.8}>
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
            {isLoading ? <ActivityIndicator color="#FFF" size={18} /> : <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{isLoading ? 'Updating...' : 'Update Password'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PwField({ label, icon, error, show, toggle, children }: { label: string; icon: string; error?: string; show: boolean; toggle: () => void; children: React.ReactNode }) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.fieldLabel}>
        <MaterialCommunityIcons name={icon as any} size={14} color={colors.neutral[500]} />
        <Text style={s.fieldLabelText}>{label}</Text>
      </View>
      <View style={s.inputRow}>
        <View style={{ flex: 1 }}>{children}</View>
        <TouchableOpacity onPress={toggle} style={s.eyeBtn}>
          <MaterialCommunityIcons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>
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

  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], backgroundColor: HERO_FROM + '0C', borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[5], borderWidth: 1, borderColor: HERO_FROM + '20' },
  noteText: { flex: 1, fontSize: 13, color: colors.neutral[600], lineHeight: 19 },

  fieldWrap: { marginBottom: spacing[4] },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[1] },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  fieldError: { fontSize: 12, color: colors.error.main, marginTop: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: 15, color: colors.neutral[900] },
  eyeBtn: { position: 'absolute', right: spacing[3], padding: spacing[1] },

  saveBtn: { marginTop: spacing[2] },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

