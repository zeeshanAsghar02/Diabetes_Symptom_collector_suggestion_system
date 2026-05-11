/**
 * Welcome Screen
 * Clean white design with accent color branding and feature cards
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const ACCENT = '#3D5A80';
const ACCENT_DARK = '#293D56';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        {/* Logo + Branding */}
        <View style={s.brand}>
          <View style={s.logoWrap}>
            <MaterialCommunityIcons name="heart-pulse" size={36} color="#FFF" />
          </View>
          <Text style={s.appName}>Diavise</Text>
          <Text style={s.tagline}>Your Personal Health Companion</Text>
        </View>

        {/* Feature Cards */}
        <View style={s.features}>
          <FeatureCard icon="chart-line" title="Track Metrics" desc="Monitor health data and symptoms over time" />
          <FeatureCard icon="food-apple-outline" title="Diet & Exercise" desc="Get personalized plans tailored for you" />
          <FeatureCard icon="robot-outline" title="AI Assistant" desc="Smart health guidance powered by AI" />
          <FeatureCard icon="shield-check-outline" title="Secure & Private" desc="Your health data stays confidential" />
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/diagnosis')}>
            <LinearGradient colors={[ACCENT, ACCENT_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} activeOpacity={0.8} onPress={() => router.replace('/(auth)/signin')}>
            <Text style={s.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={s.card}>
      <View style={s.cardIcon}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[8] },

  // Brand
  brand: { alignItems: 'center', marginTop: spacing[6] },
  logoWrap: { width: 68, height: 68, borderRadius: 22, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[4], ...shadows.md },
  appName: { fontSize: 30, fontWeight: '800', color: colors.neutral[900], letterSpacing: -0.5, marginBottom: spacing[1] },
  tagline: { fontSize: 14, fontWeight: '500', color: colors.neutral[500] },

  // Features
  features: { gap: spacing[3] },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.neutral[50], borderRadius: borderRadius.md, padding: spacing[3] + 2, borderWidth: 1, borderColor: colors.neutral[100] },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '10', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral[800], marginBottom: 1 },
  cardDesc: { fontSize: 12, fontWeight: '400', color: colors.neutral[500] },

  // CTAs
  ctas: { gap: spacing[3] },
  primaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4], borderRadius: borderRadius.md, ...shadows.sm },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryBtn: { alignItems: 'center', paddingVertical: spacing[3], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200] },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: colors.neutral[600] },
});
