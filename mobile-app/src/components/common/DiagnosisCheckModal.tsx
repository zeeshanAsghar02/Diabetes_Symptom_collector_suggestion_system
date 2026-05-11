/**
 * DiagnosisCheckModal
 *
 * Shown once per login session on the dashboard — mirrors the web app's
 * "Diabetes Diagnosis Check" popup.
 *
 * Trigger: SHOW_DIAGNOSIS_POPUP AsyncStorage flag (set in signin/signup)
 * Condition: user.diabetes_diagnosed !== 'yes'
 * If user has a previous assessment → also shows risk level chip
 *
 * Three choices:
 *   A. "Yes – I have been diagnosed with diabetes"  → POST 'yes'
 *   B. "Yes – I had tests, I'm not diabetic"        → POST 'no'
 *   C. "Not yet – I haven't had tests"              → dismiss only (shows again next login)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '@store/hooks';
import { updateUser, selectUser } from '@features/auth/authSlice';
import { useUpdateDiabetesDiagnosisMutation } from '@features/personalized/personalizedApi';
import { storage, STORAGE_KEYS } from '@utils/storage';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const FLAG_KEY = STORAGE_KEYS.SHOW_DIAGNOSIS_POPUP;

export function DiagnosisCheckModal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [updateDiagnosis, { isLoading }] = useUpdateDiabetesDiagnosisMutation();

  const [visible, setVisible] = useState(false);

  // Keep a live ref to user so the async effect always reads the latest value
  // (avoids stale closure since the effect has [] deps)
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; });

  // On mount: consume the one-time flag and show modal for undiagnosed users
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Use storage wrapper (JSON.parse-based) so the value matches exactly
        // what storage.setItem wrote in signin/signup
        const flag = await storage.getItem<string>(FLAG_KEY);
        if (flag !== 'true') return;
        // Consume the flag immediately — can't fire twice
        await storage.removeItem(FLAG_KEY);
      } catch {
        return;
      }

      if (cancelled) return;

      // Use the ref so we get the latest Redux user value after the await gap
      const currentUser = userRef.current;
      const notYetDiagnosed = currentUser?.diabetes_diagnosed !== 'yes';
      if (notYetDiagnosed) {
        setVisible(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback(async (answer: 'yes' | 'no' | 'not_yet') => {
    if (answer === 'not_yet') {
      setVisible(false);
      return;
    }
    try {
      const result = await updateDiagnosis({ diabetes_diagnosed: answer }).unwrap();
      // Merge updated fields into Redux user state
      dispatch(updateUser({
        diabetes_diagnosed: answer,
        diabetes_diagnosed_answered_at: result.data?.diabetes_diagnosed_answered_at,
      }));
    } catch (err) {
      console.warn('DiagnosisCheckModal: failed to save answer', err);
      // Still close — don't block the user
    } finally {
      setVisible(false);
    }
  }, [updateDiagnosis, dispatch]);

  // --- Risk level presentation helpers ---
  const riskLevel = user?.last_assessment_risk_level ?? '';
  const hasRisk = !!riskLevel;
  const prettyRisk = hasRisk
    ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase()
    : '';
  const probPercent = user?.last_assessment_probability != null
    ? Math.round(Number(user.last_assessment_probability) * 100)
    : null;

  const riskColor =
    riskLevel.toLowerCase() === 'high' || riskLevel.toLowerCase() === 'critical'
      ? '#DC2626'
      : riskLevel.toLowerCase() === 'medium' || riskLevel.toLowerCase() === 'moderate'
        ? '#D97706'
        : '#059669';

  const riskBg =
    riskLevel.toLowerCase() === 'high' || riskLevel.toLowerCase() === 'critical'
      ? '#FEE2E2'
      : riskLevel.toLowerCase() === 'medium' || riskLevel.toLowerCase() === 'moderate'
        ? '#FEF3C7'
        : '#D1FAE5';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => handleAnswer('not_yet')}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={[s.headerIconWrap, { backgroundColor: hasRisk ? riskBg : colors.primary[50] }]}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={24} color={hasRisk ? riskColor : colors.primary[600]} />
            </View>
            <Text style={s.title}>
              {hasRisk ? 'Your Latest Diabetes Risk Insight' : 'Diabetes Diagnosis Check'}
            </Text>
          </View>

          {/* Risk chip — only shown when user has a previous assessment */}
          {hasRisk && (
            <View style={[s.riskChip, { backgroundColor: riskBg }]}>
              <View style={[s.riskDot, { backgroundColor: riskColor }]} />
              <Text style={[s.riskChipText, { color: riskColor }]}>
                Risk level: {prettyRisk}
                {probPercent !== null ? `  ·  ${probPercent}%` : ''}
              </Text>
            </View>
          )}

          <Text style={s.body}>
            {hasRisk
              ? "This assessment estimates your chance of having diabetes based on your answers. It helps you decide when to get checked, but it\u2019s not a medical diagnosis."
              : 'To personalise your experience and provide the right recommendations, we need to know your diabetes diagnosis status.'}
          </Text>

          {hasRisk && (
            <Text style={s.advice}>
              We strongly recommend booking blood tests (fasting blood glucose or HbA1c) and
              discussing the results with a healthcare professional.
            </Text>
          )}

          {/* Divider + question */}
          <View style={s.divider} />
          <Text style={s.question}>
            Have you already had tests and received a diagnosis for diabetes?
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            style={[s.btn, s.btnPrimary]}
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={() => handleAnswer('yes')}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" />
                <Text style={s.btnPrimaryText}>Yes – I have been diagnosed with diabetes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.btnOutline]}
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={() => handleAnswer('no')}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={17} color={colors.primary[700]} />
            <Text style={s.btnOutlineText}>Yes – I had tests, I am not diabetic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnText}
            activeOpacity={0.75}
            disabled={isLoading}
            onPress={() => handleAnswer('not_yet')}
          >
            <Text style={s.btnTextLabel}>Not yet – I haven{'\u2019'}t had tests for diabetes</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>
            This tool is not a diagnosis and does not replace medical advice.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[3],
    ...shadows.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.neutral[900],
    lineHeight: 22,
  },

  // Risk chip
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskChipText: { fontSize: 13, fontWeight: '800' },

  // Body text
  body: { fontSize: 13, color: colors.neutral[500], lineHeight: 19 },
  advice: { fontSize: 13, color: colors.neutral[600], lineHeight: 19, fontWeight: '500' },

  // Divider + question
  divider: { height: 1, backgroundColor: colors.neutral[100] },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
    textAlign: 'center',
  },

  // Buttons
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[3],
  },
  btnPrimary: {
    backgroundColor: colors.primary[700],
    ...shadows.sm,
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    backgroundColor: colors.neutral[0],
  },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: colors.primary[700] },
  btnText: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  btnTextLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[500] },

  // Disclaimer
  disclaimer: {
    fontSize: 11,
    color: colors.neutral[400],
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 15,
  },
});
