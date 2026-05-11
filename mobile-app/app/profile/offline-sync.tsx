/**
 * Offline Sync Screen
 * Gradient hero + connection status + sync queue
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { useNetInfo } from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { triggerSync } from '@store/syncMiddleware';
import { selectPendingActions } from '@store/slices/offlineSlice';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#4A7580';
const HERO_TO = '#375A64';

export default function OfflineSyncScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const netInfo = useNetInfo();
  const isConnected = Boolean(netInfo.isConnected);
  const syncQueue = useSelector(selectPendingActions);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!isConnected) return;
    setIsSyncing(true);
    await dispatch(triggerSync());
    setIsSyncing(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.queueItem}>
      <View style={[s.queueDot, { backgroundColor: colors.warning.main }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.queueType}>{item.type}</Text>
        <Text style={s.queueTime}>{item.timestamp}</Text>
      </View>
      <MaterialCommunityIcons name="clock-outline" size={16} color={colors.neutral[400]} />
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <FlatList
        data={syncQueue}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
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
                  <MaterialCommunityIcons name="cloud-sync-outline" size={22} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              <Text style={s.heroTitle}>Offline & Sync</Text>
              <Text style={s.heroSub}>Manage offline data and synchronization</Text>
            </LinearGradient>

            {/* Connection Status */}
            <View style={[s.statusCard, isConnected ? s.statusOnline : s.statusOffline]}>
              <View style={[s.statusIcon, { backgroundColor: isConnected ? colors.success.main + '20' : colors.error.main + '20' }]}>
                <MaterialCommunityIcons name={isConnected ? 'wifi' : 'wifi-off'} size={22} color={isConnected ? colors.success.main : colors.error.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.statusLabel}>{isConnected ? 'Connected' : 'Offline'}</Text>
                <Text style={s.statusDesc}>{isConnected ? 'Your data will sync automatically' : 'Changes will be queued for later sync'}</Text>
              </View>
            </View>

            {/* Sync button */}
            <TouchableOpacity
              style={[s.syncBtn, (!isConnected || isSyncing || syncQueue.length === 0) && { opacity: 0.5 }]}
              onPress={handleSync}
              disabled={!isConnected || isSyncing || syncQueue.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.syncBtnGrad}>
                {isSyncing ? <ActivityIndicator color="#FFF" size={18} /> : <MaterialCommunityIcons name="sync" size={18} color="#FFF" />}
                <Text style={s.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Queue header */}
            <View style={s.section}>
              <View style={[s.sectionDot, { backgroundColor: HERO_FROM }]} />
              <Text style={s.sectionLabel}>Pending Actions ({syncQueue.length})</Text>
              <View style={s.sectionLine} />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="check-circle-outline" size={40} color={colors.neutral[300]} />
            <Text style={s.emptyText}>All synced</Text>
            <Text style={s.emptySub}>No pending actions in the queue</Text>
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

  statusCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing[4], marginBottom: spacing[4], gap: spacing[3], borderWidth: 1 },
  statusOnline: { backgroundColor: colors.success.main + '08', borderColor: colors.success.main + '25' },
  statusOffline: { backgroundColor: colors.error.main + '08', borderColor: colors.error.main + '25' },
  statusIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusLabel: { fontSize: 16, fontWeight: '700', color: colors.neutral[800] },
  statusDesc: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },

  syncBtn: { marginBottom: spacing[5] },
  syncBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  syncBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  section: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.neutral[700] },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  queueItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[3], marginBottom: spacing[2], gap: spacing[3], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  queueDot: { width: 10, height: 10, borderRadius: 5 },
  queueType: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  queueTime: { fontSize: 12, color: colors.neutral[500], marginTop: 1 },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing[10] },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.neutral[500], marginTop: spacing[3] },
  emptySub: { fontSize: 13, color: colors.neutral[400], marginTop: spacing[1] },
});
