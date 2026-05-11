/**
 * Profile Screen
 * Clean, modern design with gradient hero and organized settings sections.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectUser, logout } from '@features/auth/authSlice';
import { useLogoutMutation } from '@features/auth/authApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A5568';
const HERO_TO = '#2D3748';

const ACCENT = {
  account: '#4A7580',
  health: '#3D7A68',
  prefs: '#6B5B8A',
  support: '#D4882A',
};

interface MenuItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  route?: string;
  accent?: string;
}

interface MenuSection {
  title: string;
  accent: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [logoutMutation, { isLoading }] = useLogoutMutation();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await logoutMutation().unwrap(); } catch {}
          dispatch(logout());
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const sections: MenuSection[] = [
    {
      title: 'Account',
      accent: ACCENT.account,
      items: [
        { icon: 'account-edit-outline', title: 'Personal Information', subtitle: 'Name, email, and profile details', route: '/profile/personal', accent: ACCENT.account },
        { icon: 'lock-outline', title: 'Change Password', subtitle: 'Update your password', route: '/profile/change-password', accent: ACCENT.account },
      ],
    },
    {
      title: 'Health',
      accent: ACCENT.health,
      items: [
        { icon: 'clipboard-pulse-outline', title: 'Medical Profile', subtitle: 'Health details and conditions', route: '/profile/medical', accent: ACCENT.health },
        { icon: 'heart-pulse', title: 'Habits & Lifestyle', subtitle: 'Daily habits tracking', route: '/profile/habits', accent: ACCENT.health },
        { icon: 'google-fit', title: 'Google Fit', subtitle: 'Connect Health Connect and sync activity data', route: '/profile/google-fit', accent: ACCENT.health },
      ],
    },
    {
      title: 'Preferences',
      accent: ACCENT.prefs,
      items: [
        { icon: 'bell-outline', title: 'Notifications', subtitle: 'Manage alerts and reminders', route: '/profile/notifications', accent: ACCENT.prefs },
        { icon: 'shield-outline', title: 'Privacy & Security', subtitle: 'Data and security settings', route: '/profile/privacy', accent: ACCENT.prefs },
        { icon: 'sync', title: 'Offline & Sync', subtitle: 'Manage offline data', route: '/profile/offline-sync', accent: ACCENT.prefs },
      ],
    },
    {
      title: 'Support',
      accent: ACCENT.support,
      items: [
        { icon: 'message-text-outline', title: 'Submit Feedback', route: '/feedback', accent: ACCENT.support },
        { icon: 'comment-check-outline', title: 'Community Feedback', route: '/feedback/community', accent: ACCENT.support },
        { icon: 'help-circle-outline', title: 'Help Center', route: '/profile/support', accent: ACCENT.support },
      ],
    },
    // Dev-only section — only visible in __DEV__ builds
    ...(__DEV__ ? [{
      title: 'Developer',
      accent: '#7C3AED',
      items: [
        {
          icon: 'wrench-outline' as const,
          title: 'Dev Settings',
          subtitle: 'Override API URL at runtime',
          route: '/profile/dev-settings',
          accent: '#7C3AED',
        },
      ],
    }] : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="account-cog-outline" size={22} color="rgba(255,255,255,0.85)" />
            </View>
          </View>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <MaterialCommunityIcons
                name={user?.diabetes_diagnosed ? 'check-circle-outline' : 'circle-outline'}
                size={12}
                color={user?.diabetes_diagnosed ? '#6EE7B7' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.statusText, { color: user?.diabetes_diagnosed ? '#6EE7B7' : 'rgba(255,255,255,0.6)' }]}>
                {user?.diabetes_diagnosed ? 'Diagnosed' : 'Not Diagnosed'}
              </Text>
            </View>
            <View style={styles.statusChip}>
              <MaterialCommunityIcons name="account-check-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={[styles.statusText, { color: 'rgba(255,255,255,0.6)' }]}>Member</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: section.accent }]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <React.Fragment key={item.title}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.6}
                    onPress={() => { if (item.route) router.push(item.route as any); }}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: (item.accent || section.accent) + '14' }]}>
                      <MaterialCommunityIcons name={item.icon} size={18} color={item.accent || section.accent} />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[300]} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Version */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>DiaCare v1.0.0</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout} disabled={isLoading}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.error.main} />
          <Text style={styles.logoutText}>{isLoading ? 'Signing out...' : 'Sign Out'}</Text>
        </TouchableOpacity>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  scrollContent: { paddingBottom: spacing[4] },

  heroCard: { margin: spacing[4], borderRadius: borderRadius.lg, padding: spacing[5], ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing[3] },
  heroIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], marginBottom: spacing[4] },
  avatarWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: spacing[3], backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.sm, paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },

  section: { marginBottom: spacing[2], paddingHorizontal: spacing[4] },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2], marginTop: spacing[2] },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[100] },
  sectionCard: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[100], overflow: 'hidden', ...shadows.xs },
  divider: { height: 1, backgroundColor: colors.neutral[100], marginLeft: spacing[4] + 36 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], paddingHorizontal: spacing[4], gap: spacing[3] },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: colors.neutral[800] },
  menuSubtitle: { fontSize: 12, color: colors.neutral[400], marginTop: 1 },

  appInfo: { alignItems: 'center', paddingVertical: spacing[3] },
  appVersion: { fontSize: 12, color: colors.neutral[400] },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error.main + '30', backgroundColor: colors.error.bg, gap: spacing[2] },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error.main },
});
