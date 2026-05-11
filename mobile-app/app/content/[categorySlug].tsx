/**
 * Content List Screen
 * Displays articles for a specific category with professional card design.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGetContentByCategoryQuery } from '@features/content/contentApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { EmptyState } from '@components/common/EmptyState';
import { spacing, borderRadius } from '@theme/spacing';
import colors from '@theme/colors';
import type { Content } from '@app-types/api';

export default function ContentListScreen() {
  const router = useRouter();
  const { categorySlug, categoryId, categoryName } = useLocalSearchParams<{
    categorySlug: string;
    categoryId: string;
    categoryName: string;
  }>();

  const { data, isLoading, isError, refetch } = useGetContentByCategoryQuery(
    categoryId ?? categorySlug ?? '',
    { skip: !categoryId && !categorySlug },
  );

  const handlePressContent = (content: Content) => {
    router.push(`/content/details/${content._id}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getAuthorName = (author: any): string => {
    if (!author) return 'Admin';
    if (typeof author === 'object' && author.fullName) return author.fullName;
    if (typeof author === 'string') return author;
    return 'Admin';
  };

  const renderItem = ({ item }: { item: Content }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handlePressContent(item)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.excerpt ? (
          <Text style={styles.cardExcerpt} numberOfLines={3}>{item.excerpt}</Text>
        ) : null}

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-outline" size={13} color={colors.neutral[400]} />
            <Text style={styles.metaText}>{getAuthorName((item as any).author)}</Text>
          </View>
          {item.publishedAt ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.neutral[400]} />
              <Text style={styles.metaText}>{formatDate(item.publishedAt)}</Text>
            </View>
          ) : null}
          {(item as any).readingTime ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.neutral[400]} />
              <Text style={styles.metaText}>{(item as any).readingTime} min</Text>
            </View>
          ) : null}
        </View>

        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.neutral[300]} style={styles.cardChevron} />
    </TouchableOpacity>
  );

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load articles." />;

  const articles = data?.data || [];
  const displayName = categoryName || (categorySlug ?? '').replace(/-/g, ' ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={articles}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            {/* Back + Title row */}
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={colors.neutral[800]} />
              </TouchableOpacity>
              <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
            </View>

            {/* Info strip */}
            <View style={styles.infoStrip}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={14} color={colors.neutral[400]} />
              <Text style={styles.infoText}>
                {articles.length} {articles.length === 1 ? 'article' : 'articles'}
              </Text>
              <View style={styles.infoLine} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            icon="newspaper-variant-outline"
            title="No articles yet"
            message="Articles in this category will appear here once published."
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  listHeader: {
    marginBottom: spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    letterSpacing: -0.3,
    textTransform: 'capitalize',
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 44,
  },
  infoText: {
    fontSize: 12,
    color: colors.neutral[400],
    fontWeight: '500',
    marginLeft: 4,
  },
  infoLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardContent: {
    flex: 1,
  },
  cardChevron: {
    marginLeft: spacing[2],
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    lineHeight: 20,
  },
  cardExcerpt: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
});
