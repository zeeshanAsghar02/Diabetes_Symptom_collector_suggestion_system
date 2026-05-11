/**
 * Articles / Content Browser
 * Central hub with search, category filter, and pagination.
 * Matches web ArticlesDashboard.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  useGetContentQuery,
  useGetContentCategoriesQuery,
} from '@features/content/contentApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { EmptyState } from '@components/common/EmptyState';
import { Card } from '@components/common/Card';
import { spacing } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import type { Content, Category } from '@app-types/api';

const PAGE_SIZE = 10;

export default function ArticlesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: contentData,
    isLoading: contentLoading,
    isError: contentError,
    refetch: refetchContent,
  } = useGetContentQuery({
    type: selectedCategory ? undefined : undefined,
    ...(selectedCategory ? { tags: [selectedCategory] } : {}),
  });

  const {
    data: catData,
    isLoading: catLoading,
  } = useGetContentCategoriesQuery();

  const categories: Category[] = catData?.data || [];

  // Client-side search + filter (same as web)
  const filteredContent = useMemo(() => {
    let items: Content[] = contentData?.data || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.excerpt?.toLowerCase().includes(q)
      );
    }
    // Sort newest first
    items = [...items].sort(
      (a, b) =>
        new Date(b.createdAt || b.publishedAt || '').getTime() -
        new Date(a.createdAt || a.publishedAt || '').getTime()
    );
    return items;
  }, [contentData, searchQuery]);

  const handlePress = (item: Content) => {
    router.push(`/content/details/${item._id}`);
  };

  const renderItem = ({ item }: { item: Content }) => (
    <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.excerpt && (
            <Text style={styles.cardExcerpt} numberOfLines={3}>
              {item.excerpt}
            </Text>
          )}
          <View style={styles.cardFooter}>
            {item.category && (
              <Chip compact textStyle={styles.chipText} style={styles.categoryChip}>
                {typeof item.category === 'string' ? item.category : (item.category as any).name || 'General'}
              </Chip>
            )}
            <Text style={styles.dateText}>
              {new Date(item.createdAt || item.publishedAt || '').toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (contentLoading && !contentData) return <FullScreenLoader />;
  if (contentError)
    return <ErrorState onRetry={refetchContent} error="Failed to load articles." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Articles & Resources</Text>
        <Text style={styles.subtitle}>
          Browse health articles, tips, and educational content
        </Text>

        <Searchbar
          placeholder="Search articles..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Category filter chips */}
        <FlatList
          data={[{ _id: 'all', name: 'All' } as any, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c._id}
          style={styles.categoryRow}
          renderItem={({ item: cat }) => (
            <Chip
              selected={
                cat._id === 'all'
                  ? selectedCategory === null
                  : selectedCategory === cat._id
              }
              onPress={() =>
                setSelectedCategory(cat._id === 'all' ? null : cat._id)
              }
              style={styles.filterChip}
            >
              {cat.name}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={filteredContent}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={contentLoading} onRefresh={refetchContent} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-document-outline"
            title="No Articles"
            message="No articles found matching your search."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.light.background.primary },
  headerSection: { padding: spacing[4], paddingBottom: 0 },
  title: { ...textStyles.h2, color: colors.primary[600], marginBottom: spacing[1] },
  subtitle: {
    ...textStyles.body2,
    color: colors.light.text.secondary,
    marginBottom: spacing[4],
  },
  searchBar: { marginBottom: spacing[3] },
  categoryRow: { marginBottom: spacing[3] },
  filterChip: { marginRight: spacing[2] },
  list: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { overflow: 'hidden' },
  cardTitle: { ...textStyles.h6, marginBottom: spacing[2] },
  cardExcerpt: {
    ...textStyles.body2,
    color: colors.light.text.secondary,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: { height: 28 },
  chipText: { fontSize: 11 },
  dateText: { ...textStyles.caption, color: colors.light.text.tertiary },
});
