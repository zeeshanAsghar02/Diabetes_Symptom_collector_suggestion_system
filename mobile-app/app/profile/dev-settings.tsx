/**
 * Developer Settings Screen
 * Only visible in __DEV__ builds.
 * Allows overriding the API base URL at runtime without rebuilding the app.
 * Useful when testing on a physical device with a different LAN IP.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '@components/common/TextInput';

import {
  getRuntimeApiUrl,
  setRuntimeApiUrl,
  resetRuntimeApiUrl,
  API_CONFIG,
} from '@utils/constants';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A5568';
const HERO_TO = '#2D3748';

// Always include the currently-baked .env IP as the first preset so users can
// one-tap back to whatever is in mobile-app/.env without typing.
const getPresets = () => [
  { label: `Current .env  (${API_CONFIG.BASE_URL.replace('http://', '')})`, host: API_CONFIG.BASE_URL },
  { label: 'Android Emulator', host: 'http://10.0.2.2:5000' },
  { label: 'iOS Simulator', host: 'http://127.0.0.1:5000' },
  { label: 'Localhost', host: 'http://localhost:5000' },
];

export default function DevSettingsScreen() {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputHost, setInputHost] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const refresh = async () => {
    const url = await getRuntimeApiUrl();
    setCurrentUrl(url);
    // Show only the host part (strip /api/v1) in the input
    setInputHost(url.replace(API_CONFIG.API_VERSION, ''));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    const trimmed = inputHost.trim();
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'Host must start with http:// or https://\nExample: http://192.168.1.50:5000');
      return;
    }
    setSaving(true);
    await setRuntimeApiUrl(trimmed);
    await refresh();
    setSaving(false);
    Alert.alert(
      'Saved',
      `API host updated to:\n${trimmed}\n\nAll future requests will use this URL immediately.`,
    );
  };

  const handlePreset = async (host: string) => {
    setInputHost(host);
    setSaving(true);
    await setRuntimeApiUrl(host);
    await refresh();
    setSaving(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(`${currentUrl}/diseases/public`, { signal: controller.signal });
      clearTimeout(tid);
      const json = await resp.json();
      if (json.success) {
        setTestResult({ ok: true, msg: `Connected! Found ${json.data?.length ?? 0} disease(s).` });
      } else {
        setTestResult({ ok: false, msg: `Server replied but returned success=false.` });
      }
    } catch (e: any) {
      const isTimeout = e?.name === 'AbortError';
      setTestResult({
        ok: false,
        msg: isTimeout
          ? 'Timed out — server not reachable. Check IP and firewall.'
          : `Error: ${e?.message || 'Network failed'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset to Default',
      `Revert to the baked-in env URL?\n${API_CONFIG.BASE_URL}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetRuntimeApiUrl();
            await refresh();
          },
        },
      ],
    );
  };

  if (!__DEV__) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.productionWrap}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.neutral[300]} />
          <Text style={s.productionText}>Dev settings are only available in development builds.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
            style={s.heroBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={s.heroRow}>
            <View style={s.heroIconWrap}>
              <MaterialCommunityIcons name="wrench-outline" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>Developer Settings</Text>
              <Text style={s.heroSub}>Override API base URL at runtime</Text>
            </View>
          </View>
          {/* DEV badge */}
          <View style={s.devBadge}>
            <MaterialCommunityIcons name="bug-outline" size={12} color="#FCD34D" />
            <Text style={s.devBadgeText}>DEV BUILD ONLY</Text>
          </View>
        </LinearGradient>

        {/* Current Active URL */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="link-variant" size={16} color={colors.neutral[500]} />
            <Text style={s.cardTitle}>Active API URL</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={HERO_FROM} style={{ marginVertical: spacing[2] }} />
          ) : (
            <Text style={s.activeUrl} selectable>{currentUrl}</Text>
          )}
          <View style={s.envRow}>
            <MaterialCommunityIcons name="information-outline" size={13} color={colors.neutral[400]} />
            <Text style={s.envText}>
              .env baked IP: <Text style={s.envValue}>{API_CONFIG.BASE_URL}</Text>
            </Text>
          </View>

          {/* Test Connection */}
          <TouchableOpacity
            style={s.testBtn}
            onPress={handleTest}
            activeOpacity={0.8}
            disabled={testing || loading}
          >
            {testing ? (
              <ActivityIndicator size="small" color={HERO_FROM} />
            ) : (
              <MaterialCommunityIcons name="lan-connect" size={16} color={HERO_FROM} />
            )}
            <Text style={s.testBtnText}>{testing ? 'Testing…' : 'Test Connection'}</Text>
          </TouchableOpacity>

          {testResult && (
            <View style={[s.testResult, testResult.ok ? s.testResultOk : s.testResultFail]}>
              <MaterialCommunityIcons
                name={testResult.ok ? 'check-circle-outline' : 'alert-circle-outline'}
                size={16}
                color={testResult.ok ? '#16A34A' : '#DC2626'}
              />
              <Text style={[s.testResultText, { color: testResult.ok ? '#16A34A' : '#DC2626' }]}>
                {testResult.msg}
              </Text>
            </View>
          )}
        </View>

        {/* Manual Override */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.neutral[500]} />
            <Text style={s.cardTitle}>Override Host</Text>
          </View>
          <Text style={s.hint}>
            Enter the base host of your backend (without /api/v1).{'\n'}
            The API version prefix is added automatically.
          </Text>
          <TextInput
            label="API Host"
            value={inputHost}
            onChangeText={setInputHost}
            placeholder="http://192.168.x.x:5000"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            <LinearGradient
              colors={[HERO_FROM, HERO_TO]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtnGrad}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={16} color="#FFF" />
                  <Text style={s.saveBtnText}>Save & Apply</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Presets */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color={colors.neutral[500]} />
            <Text style={s.cardTitle}>Quick Presets</Text>
          </View>
          {getPresets().map((preset) => {
            const isActive = inputHost === preset.host;
            return (
              <TouchableOpacity
                key={preset.host}
                style={[s.presetRow, isActive && s.presetRowActive]}
                onPress={() => handlePreset(preset.host)}
                activeOpacity={0.7}
              >
                <View style={[s.presetDot, { backgroundColor: isActive ? HERO_FROM : colors.neutral[200] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.presetLabel, isActive && s.presetLabelActive]}>{preset.label}</Text>
                  <Text style={s.presetHost}>{preset.host}</Text>
                </View>
                {isActive && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={HERO_FROM} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reset */}
        <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <MaterialCommunityIcons name="restore" size={16} color={colors.error.main} />
          <Text style={s.resetBtnText}>Reset to Env Default</Text>
        </TouchableOpacity>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[4] },

  // Hero
  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[4], ...shadows.md },
  heroBack: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing[3],
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  devBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing[3],
    backgroundColor: 'rgba(252,211,77,0.15)', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 4, alignSelf: 'flex-start',
  },
  devBadgeText: { fontSize: 11, fontWeight: '700', color: '#FCD34D', letterSpacing: 0.8 },

  // Cards
  card: {
    backgroundColor: colors.neutral[0], borderRadius: borderRadius.md,
    padding: spacing[4], marginBottom: spacing[3],
    borderWidth: 1, borderColor: colors.neutral[100], ...shadows.xs,
    gap: spacing[2],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },

  activeUrl: { fontSize: 14, fontWeight: '600', color: HERO_FROM, lineHeight: 20 },
  envRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing[1] },
  envText: { fontSize: 12, color: colors.neutral[400] },
  envValue: { color: colors.neutral[600], fontWeight: '600' },
  hint: { fontSize: 12, color: colors.neutral[500], lineHeight: 18 },

  // Save btn
  saveBtn: { marginTop: spacing[1], borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.md,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Presets
  presetRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[2], paddingHorizontal: spacing[3],
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  presetRowActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '08' },
  presetDot: { width: 8, height: 8, borderRadius: 4 },
  presetLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[700] },
  presetLabelActive: { color: HERO_FROM },
  presetHost: { fontSize: 12, color: colors.neutral[400], marginTop: 2 },

  // Test connection button
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    paddingVertical: spacing[2] + 2, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: HERO_FROM + '40',
    backgroundColor: HERO_FROM + '08',
  },
  testBtnText: { fontSize: 13, fontWeight: '600', color: HERO_FROM },
  testResult: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2],
    padding: spacing[3], borderRadius: borderRadius.sm, borderWidth: 1,
  },
  testResultOk: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  testResultFail: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  testResultText: { fontSize: 12, fontWeight: '500', lineHeight: 18, flex: 1 },

  // Reset btn
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    paddingVertical: spacing[3], borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.error.main + '30',
    backgroundColor: colors.error.bg,
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: colors.error.main },

  // Production guard
  productionWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[4], padding: spacing[8] },
  productionText: { fontSize: 15, color: colors.neutral[500], textAlign: 'center', lineHeight: 22 },
});
