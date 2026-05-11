/**
 * Notification Settings Screen
 * Gradient hero + toggle cards + action buttons
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#6B5B8A';
const HERO_TO = '#4E4368';
const ACCENT = '#6B5B8A';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [medicationReminders, setMedicationReminders] = useState(false);
  const [activityReminders, setActivityReminders] = useState(false);

  const scheduleNotification = async (title: string, body: string, kind: string, seconds = 2) => {
    try {
      const Notifications = await import('expo-notifications');
      const { schedulePushNotification } = await import('@services/notificationService');
      schedulePushNotification(title, body, { kind }, { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds });
    } catch {
      Alert.alert('Unavailable', 'Push notifications are not available in this environment.');
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
              <MaterialCommunityIcons name="bell-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Notifications</Text>
          <Text style={s.heroSub}>Manage your reminder preferences</Text>
        </LinearGradient>

        {/* Toggles section */}
        <View style={s.section}>
          <View style={[s.sectionDot, { backgroundColor: ACCENT }]} />
          <Text style={s.sectionLabel}>Reminders</Text>
          <View style={s.sectionLine} />
        </View>

        <ToggleCard
          icon="pill"
          label="Medication Reminders"
          description="Get reminded to take your medications on time"
          value={medicationReminders}
          onToggle={setMedicationReminders}
        />

        <ToggleCard
          icon="run"
          label="Activity Reminders"
          description="Stay active with regular movement reminders"
          value={activityReminders}
          onToggle={setActivityReminders}
        />

        {/* Actions section */}
        <View style={[s.section, { marginTop: spacing[3] }]}>
          <View style={[s.sectionDot, { backgroundColor: ACCENT }]} />
          <Text style={s.sectionLabel}>Quick Actions</Text>
          <View style={s.sectionLine} />
        </View>

        <ActionButton
          icon="bell-ring-outline"
          label="Send Test Notification"
          description="Verify notifications work on your device"
          onPress={() => scheduleNotification('Test Notification', 'This is a test notification from the app!', 'test')}
        />

        <ActionButton
          icon="clock-outline"
          label="Schedule Medication Reminder"
          description="Set a medication reminder in 5 seconds"
          onPress={() => {
            setMedicationReminders(true);
            scheduleNotification('Medication Reminder', 'Time to take your medication.', 'medication', 5);
          }}
        />

        <ActionButton
          icon="walk"
          label="Schedule Activity Reminder"
          description="Set an activity reminder in 5 seconds"
          onPress={() => {
            setActivityReminders(true);
            scheduleNotification('Activity Reminder', 'Time for a short walk or light activity.', 'activity', 5);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleCard({ icon, label, description, value, onToggle }: { icon: string; label: string; description: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.toggleCard}>
      <View style={[s.cardIcon, { backgroundColor: ACCENT + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardDesc}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.neutral[200], true: ACCENT + '50' }} thumbColor={value ? ACCENT : colors.neutral[400]} />
    </View>
  );
}

function ActionButton({ icon, label, description, onPress }: { icon: string; label: string; description: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.cardIcon, { backgroundColor: ACCENT + '14' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardDesc}>{description}</Text>
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

  section: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  cardDesc: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },
});
