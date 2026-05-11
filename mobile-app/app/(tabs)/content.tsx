/**
 * Articles Screen
 * Shows ALL articles directly with category filter chips and image cards.
 * Single tap to read — no extra category navigation step.
 * No emojis — MaterialCommunityIcons only
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useGetAllArticlesQuery, useGetContentCategoriesQuery } from '@features/content/contentApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { EmptyState } from '@components/common/EmptyState';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { Content, Category } from '@app-types/api';

/* ── Category-based placeholder images (local) ── */
const CATEGORY_PLACEHOLDER: Record<string, string> = {
  diet: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop',
  exercise: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=250&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=250&fit=crop',
  medication: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=250&fit=crop',
  lifestyle: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
  mental: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop',
  prevention: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=250&fit=crop',
};
const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=250&fit=crop';

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

function getPlaceholderImage(category: any): string {
  if (!category) return DEFAULT_PLACEHOLDER;
  const name = (typeof category === 'object' ? category.name : String(category)).toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_PLACEHOLDER)) {
    if (name.includes(key)) return url;
  }
  return DEFAULT_PLACEHOLDER;
}

function getCategoryName(category: any): string {
  if (!category) return '';
  if (typeof category === 'object' && category.name) return category.name;
  if (typeof category === 'string') return category;
  return '';
}

function getAuthorName(author: any): string {
  if (!author) return 'Admin';
  if (typeof author === 'object' && author.fullName) return author.fullName;
  if (typeof author === 'string') return author;
  return 'Admin';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ArticlesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: articlesData, isLoading, isError, refetch } = useGetAllArticlesQuery({ limit: 50 });
  const { data: categoriesData } = useGetContentCategoriesQuery();

  const categories = categoriesData?.data || [];
  const allArticles = articlesData?.data || [];

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return allArticles;
    return allArticles.filter((a) => {
      const cat = a.category;
      if (!cat) return false;
      if (typeof cat === 'object') return cat._id === selectedCategory;
      return cat === selectedCategory;
    });
  }, [allArticles, selectedCategory]);

  const handlePressArticle = (article: Content) => {
    router.push(`/content/details/${article._id}`);
  };

  /* ── Featured / first article card ── */
  const renderFeaturedCard = (item: Content) => {
    const imageUri = item.featuredImage?.url || getPlaceholderImage(item.category);
    const catName = getCategoryName(item.category);

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        activeOpacity={0.8}
        onPress={() => handlePressArticle(item)}
      >
        <Image source={{ uri: imageUri }} style={styles.featuredImage} resizeMode="cover" />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          {catName ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{catName}</Text>
            </View>
          ) : null}
          <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredMetaText}>{getAuthorName(item.author)}</Text>
            {item.publishedAt ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.featuredMetaText}>{formatDate(item.publishedAt)}</Text>
              </>
            ) : null}
            {item.readingTime ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.featuredMetaText}>{item.readingTime} min</Text>
              </>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Regular article card ── */
  const renderArticleCard = ({ item }: { item: Content }) => {
    const imageUri = item.featuredImage?.url || getPlaceholderImage(item.category);
    const catName = getCategoryName(item.category);

    return (
      <TouchableOpacity
        style={styles.articleCard}
        activeOpacity={0.7}
        onPress={() => handlePressArticle(item)}
      >
        <Image source={{ uri: imageUri }} style={styles.articleImage} resizeMode="cover" />
        <View style={styles.articleBody}>
          {catName ? (
            <Text style={styles.articleCategory}>{catName}</Text>
          ) : null}
          <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
          {item.excerpt ? (
            <Text style={styles.articleExcerpt} numberOfLines={2}>{item.excerpt}</Text>
          ) : null}
          <View style={styles.articleMeta}>
            <Text style={styles.articleMetaText}>{getAuthorName(item.author)}</Text>
            {item.publishedAt ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.articleMetaText}>{formatDate(item.publishedAt)}</Text>
              </>
            ) : null}
            {item.readingTime ? (
              <>
                <View style={styles.metaDot} />
                <MaterialCommunityIcons name="clock-outline" size={11} color={colors.neutral[400]} />
                <Text style={styles.articleMetaText}>{item.readingTime} min</Text>
              </>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Category filter chips ── */
  const renderCategoryChips = () => (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(c) => c._id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipList}
      ListHeaderComponent={() => (
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
      )}
      renderItem={({ item }) => {
        const active = selectedCategory === item._id;
        return (
          <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setSelectedCategory(active ? null : item._id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  /* ── List header ── */
  const listHeader = () => (
    <View>
      {/* Hero */}
      <View style={styles.heroWrap}>
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Articles</Text>
              <Text style={styles.heroSub}>Health &amp; Lifestyle</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Category chips */}
      {categories.length > 0 ? renderCategoryChips() : null}

      {/* Featured article (first item) */}
      {filteredArticles.length > 0 ? (
        <View style={styles.featuredWrap}>
          {renderFeaturedCard(filteredArticles[0])}
        </View>
      ) : null}
    </View>
  );

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <ErrorState onRetry={refetch} error="Failed to load articles." />;

  // Remaining articles (skip featured first one)
  const remainingArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {filteredArticles.length === 0 ? (
        <>
          {listHeader()}
          <EmptyState
            icon="newspaper-variant-outline"
            title="No articles yet"
            message="Health and lifestyle articles will appear here once published."
          />
        </>
      ) : (
        <FlatList
          data={remainingArticles}
          renderItem={renderArticleCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
    </SafeAreaView>
  );
}

/* ─────────────────── Styles ─────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  /* ── Hero ── */
  heroWrap: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    marginBottom: spacing[2],
  },
  hero: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    ...shadows.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  /* ── Category chips ── */
  chipList: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },

  /* ── Featured card ── */
  featuredWrap: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  featuredCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: 200,
    backgroundColor: colors.neutral[200],
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 6,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 6,
  },

  /* ── Article list ── */
  list: {
    paddingBottom: spacing[8],
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  articleImage: {
    width: 110,
    height: '100%',
    minHeight: 110,
    backgroundColor: colors.neutral[200],
  },
  articleBody: {
    flex: 1,
    padding: spacing[3],
    justifyContent: 'center',
  },
  articleCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    lineHeight: 19,
    marginBottom: 3,
  },
  articleExcerpt: {
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 16,
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleMetaText: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '500',
  },
});
