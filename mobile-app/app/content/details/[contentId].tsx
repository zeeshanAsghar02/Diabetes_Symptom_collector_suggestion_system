/**
 * Content Detail Screen
 * Displays the full article with professional layout and HTML rendering.
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';

import { useGetContentByIdQuery } from '@features/content/contentApi';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { spacing, borderRadius } from '@theme/spacing';
import colors from '@theme/colors';

/* ── Placeholder images by category ── */
const CATEGORY_PLACEHOLDER: Record<string, string> = {
  diet: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=300&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=300&fit=crop',
  exercise: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=300&fit=crop',
  medication: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=300&fit=crop',
  lifestyle: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=300&fit=crop',
  mental: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=300&fit=crop',
  prevention: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&h=300&fit=crop',
};
const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=300&fit=crop';

function getPlaceholderImage(category: any): string {
  if (!category) return DEFAULT_PLACEHOLDER;
  const name = (typeof category === 'object' ? category.name : String(category)).toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_PLACEHOLDER)) {
    if (name.includes(key)) return url;
  }
  return DEFAULT_PLACEHOLDER;
}

export default function ContentDetailScreen() {
  const router = useRouter();
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const { data, isLoading, isError, refetch } = useGetContentByIdQuery(contentId ?? '', {
    skip: !contentId,
  });
  const { width } = useWindowDimensions();

  if (isLoading) return <FullScreenLoader />;
  if (isError || !data?.data) return <ErrorState onRetry={refetch} error="Failed to load article." />;

  const content = data.data;

  // Handle populated author object from backend
  const authorName = (() => {
    const a = content.author as any;
    if (!a) return 'Admin';
    if (typeof a === 'object' && a.fullName) return a.fullName;
    if (typeof a === 'string') return a;
    return 'Admin';
  })();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const categoryName = (() => {
    const c = content.category as any;
    if (!c) return null;
    if (typeof c === 'object' && c.name) return c.name;
    if (typeof c === 'string') return c;
    return null;
  })();

  const htmlSource = { html: content.content || '<p>No content available.</p>' };
  const contentWidth = width - spacing[4] * 2;

  const heroImage = content.featuredImage?.url || getPlaceholderImage(content.category);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Full-bleed hero image ── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          {/* Overlaid back button + category */}
          <SafeAreaView edges={['top']} style={styles.heroControls}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {categoryName ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{categoryName}</Text>
              </View>
            ) : null}
          </SafeAreaView>
        </View>

        {/* ── Content body (overlaps image slightly) ── */}
        <View style={styles.bodyContainer}>
          {/* Title */}
          <Text style={styles.title}>{content.title}</Text>

          {/* Author & Meta */}
          <View style={styles.metaRow}>
            <View style={styles.authorWrap}>
              <View style={styles.authorAvatar}>
                <MaterialCommunityIcons name="account" size={16} color={colors.neutral[0]} />
              </View>
              <View>
                <Text style={styles.authorName}>{authorName}</Text>
                {content.publishedAt ? (
                  <Text style={styles.metaDate}>{formatDate(content.publishedAt)}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.metaRight}>
              {(content as any).readingTime ? (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.neutral[400]} />
                  <Text style={styles.metaText}>{(content as any).readingTime} min read</Text>
                </View>
              ) : null}
              {content.viewCount != null && content.viewCount > 0 ? (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="eye-outline" size={14} color={colors.neutral[400]} />
                  <Text style={styles.metaText}>{content.viewCount}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Tags */}
          {content.tags && content.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {content.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* HTML Content */}
          <RenderHtml
            contentWidth={contentWidth}
            source={htmlSource}
            tagsStyles={htmlTagStyles}
            defaultTextProps={{ selectable: true }}
          />

          {/* Bottom spacer */}
          <View style={{ height: spacing[8] }} />
        </View>
      </ScrollView>
    </View>
  );
}

const htmlTagStyles: Record<string, any> = {
  body: {
    color: colors.neutral[700],
    fontSize: 15,
    lineHeight: 24,
  },
  p: {
    color: colors.neutral[700],
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  h1: {
    color: colors.neutral[900],
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: 20,
    marginBottom: 8,
  },
  h2: {
    color: colors.neutral[900],
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 25,
    marginTop: 16,
    marginBottom: 6,
  },
  h3: {
    color: colors.neutral[900],
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: 14,
    marginBottom: 4,
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  li: {
    color: colors.neutral[700],
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 4,
  },
  a: {
    color: colors.primary[600],
    textDecorationLine: 'underline',
  },
  strong: {
    fontWeight: '600',
    color: colors.neutral[800],
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[200],
    paddingLeft: 12,
    marginVertical: 12,
    fontStyle: 'italic',
    color: colors.neutral[600],
  },
  img: {
    borderRadius: 8,
    marginVertical: 8,
  },
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* ── Hero ── */
  heroWrap: {
    height: 280,
    backgroundColor: colors.neutral[800],
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  heroControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* ── Body (overlaps hero) ── */
  bodyContainer: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    minHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  authorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  metaDate: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 1,
  },
  metaRight: {
    flexDirection: 'row',
    gap: spacing[3],
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
    marginBottom: spacing[3],
  },
  tag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginBottom: spacing[4],
  },
});
