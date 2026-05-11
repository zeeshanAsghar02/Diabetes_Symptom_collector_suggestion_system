/**
 * Sign Up Screen
 * 3-step registration wizard with gradient hero + progress bar
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { TextInput } from '@components/common/TextInput';

import { useAppDispatch } from '@store/hooks';
import { setUser } from '@features/auth/authSlice';
import { registrationSchema, type RegistrationFormData } from '@utils/validation';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import { GENDER_OPTIONS } from '@utils/constants';
import { storage, STORAGE_KEYS, secureStorage } from '@utils/storage';
import { getRuntimeApiUrl } from '@utils/constants';

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

const STEPS = [
  { label: 'Personal Info', icon: 'account-outline' as const, fields: ['fullName', 'dateOfBirth', 'gender'] },
  { label: 'Account Details', icon: 'shield-lock-outline' as const, fields: ['email', 'password', 'confirmPassword'] },
  { label: 'Review', icon: 'clipboard-check-outline' as const, fields: [] as string[] },
];

export default function SignUpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [processingAssessment, setProcessingAssessment] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: new Date(2005, 0, 1),
      gender: 'Male',
      phoneNumber: '',
    },
  });

  const handleNext = async () => {
    const fieldsToValidate = STEPS[currentStep].fields as Array<keyof RegistrationFormData>;
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
      // Use raw fetch with NO AbortController/timeout for registration.
      // The backend's SMTP connection can take 30-90 s to time out on its own,
      // which blows past any client-side AbortController deadline and causes a
      // false "Registration failed" even though the account was created.
      const apiBase = await getRuntimeApiUrl();
      const rawRes = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          date_of_birth: data.dateOfBirth.toISOString(),
          gender: data.gender,
          phoneNumber: data.phoneNumber,
        }),
        credentials: 'include',
      });

      const json = await rawRes.json();

      if (!rawRes.ok || !json.success) {
        // Real server-side error (e.g. email already registered)
        Alert.alert('Registration Error', json?.message || 'Registration failed. Please try again.');
        return;
      }


      const result = json; // shape: { success, data: { user, accessToken, refreshToken } }

      // Persist token so all subsequent fetch calls are authenticated
      const token = result.data?.accessToken;
      if (token) {
        await secureStorage.setAccessToken(token);
      }
      dispatch(setUser(result.data.user));
      // Flag for the diagnosis-check popup on the next dashboard mount
      await storage.setItem(STORAGE_KEYS.SHOW_DIAGNOSIS_POPUP, 'true');

      // Check for assessment answers saved before the user registered
      const pendingPayload = await storage.getItem(STORAGE_KEYS.PENDING_ONBOARDING_ANSWERS) as {
        answers: Array<{ questionId: string; answerText: string }>;
      } | null;

      await storage.removeItem(STORAGE_KEYS.PENDING_ONBOARDING_ANSWERS);

      if (pendingPayload?.answers?.length) {
        setProcessingAssessment(true);
        try {
          await processPendingAssessment(pendingPayload.answers, token);
        } catch (_) {
          // processPendingAssessment is fully guarded internally;
          // this catch is a last-resort so no error popup ever fires.
          router.replace('/(tabs)/dashboard');
        } finally {
          setProcessingAssessment(false);
        }
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      // Only network-level errors reach here (device offline, DNS failure, etc.)
      Alert.alert('Registration Error', 'Could not connect to server. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Uses raw fetch (with explicit token) to save answers and run the assessment.
   * This avoids RTK Query Redux-store timing issues right after a fresh login.
   * Always navigates to the results screen — with inline data if the assessment
   * ran successfully, or without (so the screen auto-fetches the latest one).
   */
  const processPendingAssessment = async (
    answers: Array<{ questionId: string; answerText: string }>,
    token: string | undefined,
  ) => {
    const apiBase = await getRuntimeApiUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // 1. Save answers — best effort
    try {
      await fetch(`${apiBase}/questions/batch-save-answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers }),
      });
    } catch (saveErr) {
      console.warn('batch-save-answers failed (non-fatal):', saveErr);
    }

    // 2. Run assessment — navigate to results with inline data if it works,
    //    or without data so the results screen auto-fetches the latest one.
    let inlineData: string | undefined;
    try {
      const res = await fetch(`${apiBase}/assessment/diabetes?force_new=true`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (json?.success && json?.data) {
        inlineData = JSON.stringify(json.data);
      }
    } catch (runErr) {
      console.warn('run-assessment failed (non-fatal):', runErr);
    }

    // Navigate — always succeed, fall back to dashboard if router throws
    try {
      router.replace({
        pathname: '/assessment/results' as any,
        params: inlineData ? { data: inlineData } : {},
      });
    } catch (_) {
      router.replace('/(tabs)/dashboard');
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <TouchableOpacity onPress={currentStep > 0 ? handleBack : () => router.back()} style={s.heroBack}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={s.heroTitle}>Create Account</Text>
            <Text style={s.heroSub}>Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}</Text>

            {/* Progress bar */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* Step dots */}
            <View style={s.stepDots}>
              {STEPS.map((step, i) => (
                <View key={i} style={s.stepDot}>
                  <View style={[s.dotCircle, i <= currentStep && s.dotCircleActive]}>
                    <MaterialCommunityIcons name={step.icon as any} size={14} color={i <= currentStep ? '#FFF' : 'rgba(255,255,255,0.4)'} />
                  </View>
                  <Text style={[s.dotLabel, i <= currentStep && s.dotLabelActive]}>{step.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Form Card */}
          <View style={s.card}>
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <View style={s.stepContent}>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput label="Full Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.fullName?.message} autoCapitalize="words" leftIcon="account-outline" />
                  )}
                />

                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TouchableOpacity style={s.dateBtn} activeOpacity={0.7} onPress={() => setShowDatePicker(true)}>
                        <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.neutral[500]} />
                        <Text style={s.dateBtnText}>{value.toLocaleDateString()}</Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={value}
                          mode="date"
                          display="spinner"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) onChange(selectedDate);
                          }}
                          maximumDate={new Date()}
                        />
                      )}
                      {errors.dateOfBirth && <Text style={s.errorText}>{errors.dateOfBirth.message}</Text>}
                    </>
                  )}
                />

                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <View style={s.chipRow}>
                      {GENDER_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[s.chip, value === opt.value && s.chipActive]}
                          activeOpacity={0.7}
                          onPress={() => onChange(opt.value)}
                        >
                          <Text style={[s.chipText, value === opt.value && s.chipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>
            )}

            {/* Step 2: Account Details */}
            {currentStep === 1 && (
              <View style={s.stepContent}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" leftIcon="email-outline" />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput label="Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} password autoComplete="password-new" textContentType="newPassword" leftIcon="lock-outline" />
                  )}
                />
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput label="Confirm Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} password autoComplete="password-new" textContentType="newPassword" leftIcon="lock-check-outline" />
                  )}
                />
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput label="Phone Number (Optional)" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" leftIcon="phone-outline" />
                  )}
                />
              </View>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <View style={s.stepContent}>
                <ReviewRow icon="account-outline" label="Full Name" value={watch('fullName')} />
                <ReviewRow icon="calendar-outline" label="Date of Birth" value={watch('dateOfBirth').toLocaleDateString()} />
                <ReviewRow icon="gender-male-female" label="Gender" value={watch('gender')} />
                <ReviewRow icon="email-outline" label="Email" value={watch('email')} />
                {!!watch('phoneNumber') && <ReviewRow icon="phone-outline" label="Phone" value={watch('phoneNumber') ?? ''} />}
                {/* Show any validation errors that slipped through */}
                {Object.keys(errors).length > 0 && (
                  <View style={s.errorSummary}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error.main} />
                    <Text style={s.errorSummaryText}>
                      {Object.values(errors)[0]?.message ?? 'Please go back and fix the highlighted fields.'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={s.btnRow}>
              {currentStep > 0 && (
                <TouchableOpacity style={s.outlineBtn} activeOpacity={0.7} onPress={handleBack}>
                  <Text style={s.outlineBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              {currentStep < STEPS.length - 1 ? (
                <TouchableOpacity style={[s.filledBtn, currentStep === 0 && { flex: 1 }]} activeOpacity={0.85} onPress={handleNext}>
                  <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.filledGrad}>
                    <Text style={s.filledBtnText}>Next</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.filledBtn} activeOpacity={0.85} onPress={handleSubmit(onSubmit)} disabled={isLoading || processingAssessment}>
                  <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.filledGrad}>
                    <Text style={s.filledBtnText}>
                      {processingAssessment ? 'Processing assessment...' : isLoading ? 'Creating...' : 'Create Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text style={s.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.reviewRow}>
      <View style={s.reviewIconWrap}>
        <MaterialCommunityIcons name={icon as any} size={16} color={HERO_FROM} />
      </View>
      <View style={s.reviewInfo}>
        <Text style={s.reviewLabel}>{label}</Text>
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flexGrow: 1, padding: spacing[4] },

  // Hero
  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroBack: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing[3] },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: spacing[4] },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: spacing[4], overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between' },
  stepDot: { alignItems: 'center', flex: 1 },
  dotCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dotCircleActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  dotLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  dotLabelActive: { color: 'rgba(255,255,255,0.9)' },

  // Form card
  card: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[5], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100], marginBottom: spacing[5] },
  stepContent: { gap: spacing[4], marginBottom: spacing[4] },

  // Date picker button
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm, padding: spacing[3], borderWidth: 1, borderColor: colors.neutral[200] },
  dateBtnText: { fontSize: 14, fontWeight: '500', color: colors.neutral[700] },
  errorText: { color: colors.error.main, fontSize: 12, marginTop: spacing[1] },

  // Gender chips
  chipRow: { flexDirection: 'row', gap: spacing[2] },
  chip: { flex: 1, paddingVertical: spacing[3], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], alignItems: 'center' },
  chipActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '10' },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.neutral[500] },
  chipTextActive: { color: HERO_FROM },

  // Review
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  reviewIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: HERO_FROM + '10', justifyContent: 'center', alignItems: 'center' },
  reviewInfo: { flex: 1 },
  reviewLabel: { fontSize: 11, fontWeight: '500', color: colors.neutral[500] },
  reviewValue: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },

  // Buttons
  btnRow: { flexDirection: 'row', gap: spacing[3] },
  outlineBtn: { flex: 1, paddingVertical: spacing[3] + 2, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: colors.neutral[600] },
  filledBtn: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  filledGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] + 2 },
  filledBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 13, fontWeight: '500', color: colors.neutral[500] },
  footerLink: { fontSize: 13, fontWeight: '700', color: colors.primary[600] },

  // Error summary on review step
  errorSummary: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], backgroundColor: colors.error.main + '12', borderRadius: borderRadius.sm, padding: spacing[3] },
  errorSummaryText: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.error.main },
});
