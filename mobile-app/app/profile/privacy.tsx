/**
 * Privacy & Security Settings Screen
 * Gradient hero + toggle cards + danger zone
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A6078';
const HERO_TO = '#384D60';
const ACCENT = '#4A6078';

export default function PrivacyScreen() {
  const router = useRouter();
  const [dataSharing, setDataSharing] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(true);
  const [twoFactor, setTwoFactor] = React.useState(false);

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
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Privacy & Security</Text>
          <Text style={s.heroSub}>Control your data and account security</Text>
        </LinearGradient>

        {/* Data Privacy */}
        <SectionHeader label="Data Privacy" />

        <ToggleCard icon="database-outline" label="Share Health Data" desc="Allow anonymous data sharing for research" value={dataSharing} onToggle={setDataSharing} />
        <ToggleCard icon="chart-line" label="Usage Analytics" desc="Help us improve the app experience" value={analytics} onToggle={setAnalytics} />

        {/* Security */}
        <SectionHeader label="Security" />

        <ToggleCard icon="shield-check-outline" label="Two-Factor Authentication" desc="Add extra security to your account" value={twoFactor} onToggle={setTwoFactor} />

        <MenuCard icon="devices" label="Active Sessions" desc="Manage logged-in devices" onPress={() => {}} />

        {/* Data Management */}
        <SectionHeader label="Data Management" />

        <MenuCard icon="download-outline" label="Download My Data" desc="Export all your health data" onPress={() => {}} />

        {/* Danger zone */}
        <View style={s.dangerCard}>
          <View style={s.dangerHeader}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={colors.error.main} />
            <Text style={s.dangerTitle}>Danger Zone</Text>
          </View>
          <TouchableOpacity
            style={s.dangerBtn}
            onPress={() => Alert.alert('Delete Account', 'This action is irreversible. Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error.main} />
            <Text style={s.dangerBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.section}>
      <View style={[s.sectionDot, { backgroundColor: ACCENT }]} />
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function ToggleCard({ icon, label, desc, value, onToggle }: { icon: string; label: string; desc: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.card}>
      <View style={[s.cardIcon, { backgroundColor: ACCENT + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardDesc}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.neutral[200], true: ACCENT + '50' }} thumbColor={value ? ACCENT : colors.neutral[400]} />
    </View>
  );
}

function MenuCard({ icon, label, desc, onPress }: { icon: string; label: string; desc: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.cardIcon, { backgroundColor: ACCENT + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardDesc}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.neutral[400]} />
    </TouchableOpacity>
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

  section: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3], marginTop: spacing[3] },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  cardDesc: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  dangerCard: { marginTop: spacing[5], backgroundColor: colors.error.light + '10', borderRadius: borderRadius.md, padding: spacing[4], borderWidth: 1, borderColor: colors.error.light + '30' },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: colors.error.main },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.error.light + '18', borderRadius: borderRadius.md, padding: spacing[3], borderWidth: 1, borderColor: colors.error.light + '30' },
  dangerBtnText: { fontSize: 14, fontWeight: '600', color: colors.error.main },
});
