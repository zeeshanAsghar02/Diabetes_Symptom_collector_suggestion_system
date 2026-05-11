/**
 * Community Feedback Dashboard
 * Gradient hero + stats bar + search/filter + feedback cards
 * No emojis — MaterialCommunityIcons only
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { useAppSelector } from '@store/hooks';
import { selectIsAuthenticated } from '@features/auth/authSlice';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import { getApiUrl } from '@utils/constants';

const HERO_FROM = '#D4882A';
const HERO_TO = '#A86D20';
const STAR_COLOR = '#F9A825';

interface FeedbackItem {
  _id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  submitted_on: string;
  category_ratings?: Record<string, number>;
  user?: { fullName?: string };
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  ratingCounts: Record<string, number>;
}

const SORT_OPTIONS = ['Newest First', 'Highest Rated'] as const;

export default function CommunityFeedbackScreen() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('Newest First');

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [feedRes, statsRes] = await Promise.all([
        fetch(`${getApiUrl()}/feedback?page=1&limit=100`),
        fetch(`${getApiUrl()}/feedback/stats`),
      ]);
      const feedData = await feedRes.json();
      const statsData = await statsRes.json();
      if (feedData.success) setFeedbacks(feedData.data?.feedback || []);
      if (statsData.success) setStats(statsData.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let result = [...feedbacks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.comment?.toLowerCase().includes(q));
    }
    if (selectedRating) result = result.filter(f => f.rating === selectedRating);
    if (sortBy === 'Newest First') result.sort((a, b) => new Date(b.submitted_on).getTime() - new Date(a.submitted_on).getTime());
    else result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [feedbacks, searchQuery, selectedRating, sortBy]);

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <MaterialCommunityIcons key={i} name={i < rating ? 'star' : 'star-outline'} size={14} color={i < rating ? STAR_COLOR : colors.neutral[300]} />
      ))}
    </View>
  );

  if (loading) return <FullScreenLoader />;
  if (error) return <ErrorState onRetry={fetchData} error="Failed to load feedback." />;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.heroIcon}>
              <MaterialCommunityIcons name="forum-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Community Feedback</Text>
          <Text style={s.heroSub}>See what others are saying</Text>
        </LinearGradient>

        {/* Stats row */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.totalFeedback}</Text>
              <Text style={s.statLabel}>Total</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.averageRating?.toFixed(1) || '0'}</Text>
              <Text style={s.statLabel}>Average</Text>
            </View>
          </View>
        )}

        {/* Give Feedback CTA */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push(isAuthenticated ? '/feedback' : '/(auth)/signin')}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBtnGrad}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFF" />
            <Text style={s.ctaBtnText}>Give Feedback</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Search */}
        <View style={s.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.neutral[400]} />
          <RNTextInput
            style={s.searchInput}
            placeholder="Search feedback..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Rating filter & Sort */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          <TouchableOpacity onPress={() => setSelectedRating(null)} style={[s.chip, !selectedRating && s.chipActive]}>
            <Text style={[s.chipText, !selectedRating && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map(r => (
            <TouchableOpacity key={r} onPress={() => setSelectedRating(selectedRating === r ? null : r)} style={[s.chip, selectedRating === r && s.chipActive]}>
              <MaterialCommunityIcons name="star" size={12} color={selectedRating === r ? HERO_FROM : colors.neutral[500]} />
              <Text style={[s.chipText, selectedRating === r && s.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.sortRow}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} onPress={() => setSortBy(opt)} style={[s.chip, sortBy === opt && s.chipActive]}>
              <Text style={[s.chipText, sortBy === opt && s.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback List */}
        {filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="message-text-outline" size={40} color={colors.neutral[300]} />
            <Text style={s.emptyText}>No feedback found</Text>
            <Text style={s.emptySub}>Try changing your filters</Text>
          </View>
        ) : (
          filtered.map(fb => (
            <View key={fb._id} style={s.fbCard}>
              <View style={s.fbHeader}>
                {renderStars(fb.rating)}
                <Text style={s.fbDate}>{new Date(fb.submitted_on).toLocaleDateString()}</Text>
              </View>
              <Text style={s.fbUser}>{fb.is_anonymous ? 'Anonymous' : fb.user?.fullName || 'User'}</Text>
              {fb.comment && <Text style={s.fbComment}>{fb.comment}</Text>}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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

  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  statCard: { flex: 1, backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], alignItems: 'center', ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  statValue: { fontSize: 24, fontWeight: '700', color: HERO_FROM },
  statLabel: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },

  ctaBtn: { marginBottom: spacing[4] },
  ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  ctaBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, paddingHorizontal: spacing[3], marginBottom: spacing[3], borderWidth: 1, borderColor: colors.neutral[200] },
  searchInput: { flex: 1, paddingVertical: spacing[2], paddingHorizontal: spacing[2], fontSize: 14, color: colors.neutral[900] },

  chipScroll: { marginBottom: spacing[2] },
  sortRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, borderRadius: borderRadius.full, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.neutral[200], marginRight: spacing[2] },
  chipActive: { backgroundColor: HERO_FROM + '14', borderColor: HERO_FROM },
  chipText: { fontSize: 12, color: colors.neutral[600] },
  chipTextActive: { color: HERO_FROM, fontWeight: '600' },

  fbCard: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], marginBottom: spacing[2], ...shadows.xs, borderWidth: 1, borderColor: colors.neutral[100] },
  fbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  fbDate: { fontSize: 11, color: colors.neutral[400] },
  fbUser: { fontSize: 12, color: colors.neutral[500], marginBottom: spacing[2] },
  fbComment: { fontSize: 14, color: colors.neutral[700], lineHeight: 20 },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing[10] },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.neutral[500], marginTop: spacing[3] },
  emptySub: { fontSize: 13, color: colors.neutral[400], marginTop: spacing[1] },
});
