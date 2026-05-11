/**
 * Help & Support Screen
 * Gradient hero + resource cards + contact form + emergency info
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, TouchableOpacity, TextInput as RNTextInput, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#D4882A';
const HERO_TO = '#A86D20';
const ACCENT = '#D4882A';

export default function SupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendEmail = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in both subject and message.');
      return;
    }
    const email = 'support@diabeteshealth.com';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`);
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
              <MaterialCommunityIcons name="help-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Help Center</Text>
          <Text style={s.heroSub}>Find answers and get support</Text>
        </LinearGradient>

        {/* Quick Help */}
        <SectionHeader label="Quick Help" />

        <MenuItem icon="frequently-asked-questions" label="FAQs" desc="Find answers to common questions" onPress={() => {}} />
        <MenuItem icon="book-open-variant" label="User Guide" desc="Learn how to use the app" onPress={() => {}} />
        <MenuItem icon="play-circle-outline" label="Video Tutorials" desc="Watch helpful video guides" onPress={() => {}} />

        {/* Contact Us */}
        <SectionHeader label="Contact Us" />

        <View style={s.formCard}>
          <View style={s.fieldWrap}>
            <View style={s.fieldLabel}>
              <MaterialCommunityIcons name="text-short" size={14} color={colors.neutral[500]} />
              <Text style={s.fieldLabelText}>Subject</Text>
            </View>
            <RNTextInput style={s.input} value={subject} onChangeText={setSubject} placeholder="What can we help you with?" placeholderTextColor={colors.neutral[400]} />
          </View>

          <View style={s.fieldWrap}>
            <View style={s.fieldLabel}>
              <MaterialCommunityIcons name="message-text-outline" size={14} color={colors.neutral[500]} />
              <Text style={s.fieldLabelText}>Message</Text>
            </View>
            <RNTextInput style={[s.input, s.multiInput]} value={message} onChangeText={setMessage} placeholder="Describe your issue or question" placeholderTextColor={colors.neutral[400]} multiline />
          </View>

          <TouchableOpacity onPress={handleSendEmail} disabled={!subject.trim() || !message.trim()} style={[s.sendBtn, (!subject.trim() || !message.trim()) && { opacity: 0.5 }]} activeOpacity={0.8}>
            <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendBtnGrad}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#FFF" />
              <Text style={s.sendBtnText}>Send Email</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Other Resources */}
        <SectionHeader label="Other Resources" />

        <MenuItem icon="bug-outline" label="Report a Bug" desc="Help us improve by reporting issues" onPress={() => {}} />
        <MenuItem icon="lightbulb-on-outline" label="Feature Request" desc="Suggest new features" onPress={() => {}} />

        {/* Emergency info */}
        <View style={s.infoCard}>
          <View style={s.infoHeader}>
            <MaterialCommunityIcons name="information-outline" size={18} color={ACCENT} />
            <Text style={s.infoTitle}>Need immediate help?</Text>
          </View>
          <Text style={s.infoText}>For urgent medical concerns, please contact your healthcare provider or call emergency services.</Text>
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

function MenuItem({ icon, label, desc, onPress }: { icon: string; label: string; desc: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.menuCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.menuIcon, { backgroundColor: ACCENT + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={s.menuDesc}>{desc}</Text>
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

  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  menuDesc: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  formCard: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], marginBottom: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  fieldWrap: { marginBottom: spacing[3] },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[1] },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  input: { backgroundColor: colors.neutral[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: 14, color: colors.neutral[900] },
  multiInput: { minHeight: 100, textAlignVertical: 'top' },

  sendBtn: { marginTop: spacing[1] },
  sendBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  sendBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  infoCard: { marginTop: spacing[3], backgroundColor: ACCENT + '0A', borderRadius: borderRadius.md, padding: spacing[4], borderWidth: 1, borderColor: ACCENT + '20' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  infoTitle: { fontSize: 14, fontWeight: '700', color: ACCENT },
  infoText: { fontSize: 13, color: colors.neutral[600], lineHeight: 19 },
});
