/**
 * Manage Habits Screen
 * Gradient hero + styled habit cards with toggle/delete
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetHabitsQuery, useCreateHabitMutation, useUpdateHabitMutation, useDeleteHabitMutation } from '@features/profile/profileApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { UserHabit } from '@app-types/api';

const HERO_FROM = '#6B5B8A';
const HERO_TO = '#4E4368';

export default function ManageHabitsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetHabitsQuery();
  const [createHabit, { isLoading: isAdding }] = useCreateHabitMutation();
  const [updateHabit] = useUpdateHabitMutation();
  const [deleteHabit] = useDeleteHabitMutation();
  const [newName, setNewName] = useState('');

  const habits: UserHabit[] = data?.data || [];

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createHabit({ name: newName.trim(), status: 'active' }).unwrap();
      setNewName('');
    } catch {
      Alert.alert('Error', 'Failed to add habit.');
    }
  };

  const handleToggle = async (h: UserHabit) => {
    const next = h.status === 'active' ? 'paused' : 'active';
    await updateHabit({ id: h._id, habit: { status: next } });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Habit', 'Are you sure you want to remove this habit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  };

  const renderItem = ({ item }: { item: UserHabit }) => {
    const active = item.status === 'active';
    return (
      <View style={s.habitCard}>
        <View style={[s.statusDot, { backgroundColor: active ? colors.success.main : colors.neutral[400] }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.habitName}>{item.name}</Text>
          <Text style={s.habitStatus}>{active ? 'Active' : 'Paused'}</Text>
        </View>
        <TouchableOpacity onPress={() => handleToggle(item)} style={[s.actionBtn, { backgroundColor: active ? colors.warning.light + '20' : colors.success.light + '20' }]}>
          <MaterialCommunityIcons name={active ? 'pause' : 'play'} size={18} color={active ? colors.warning.main : colors.success.main} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={[s.actionBtn, { backgroundColor: colors.error.light + '20' }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error.main} />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load habits." />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.heroTop}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={s.heroIcon}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              <Text style={s.heroTitle}>Habits & Lifestyle</Text>
              <Text style={s.heroSub}>Track your daily habits for better health</Text>
            </LinearGradient>

            {/* Add new */}
            <View style={s.addCard}>
              <View style={s.addRow}>
                <RNTextInput
                  style={s.addInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="New habit name..."
                  placeholderTextColor={colors.neutral[400]}
                />
                <TouchableOpacity onPress={handleAdd} disabled={isAdding || !newName.trim()} style={[s.addBtn, (!newName.trim()) && { opacity: 0.5 }]} activeOpacity={0.7}>
                  {isAdding ? <ActivityIndicator size={16} color="#FFF" /> : <MaterialCommunityIcons name="plus" size={20} color="#FFF" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Section label */}
            <View style={s.section}>
              <View style={[s.sectionDot, { backgroundColor: HERO_FROM }]} />
              <Text style={s.sectionLabel}>Your Habits</Text>
              <View style={s.sectionLine} />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="playlist-plus" size={40} color={colors.neutral[300]} />
            <Text style={s.emptyText}>No habits added yet</Text>
            <Text style={s.emptySub}>Add your first habit above to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  list: { padding: spacing[4], paddingBottom: spacing[12] },

  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },

  addCard: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[5], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  addInput: { flex: 1, backgroundColor: colors.neutral[50], borderRadius: borderRadius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: 14, color: colors.neutral[900], borderWidth: 1, borderColor: colors.neutral[200] },
  addBtn: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: HERO_FROM, justifyContent: 'center', alignItems: 'center' },

  section: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  habitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  habitName: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  habitStatus: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing[10] },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.neutral[500], marginTop: spacing[3] },
  emptySub: { fontSize: 13, color: colors.neutral[400], marginTop: spacing[1] },
});

