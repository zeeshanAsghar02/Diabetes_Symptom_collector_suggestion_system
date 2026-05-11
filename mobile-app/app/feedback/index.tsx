/**
 * Submit Feedback Screen
 * Gradient hero + star rating + category chips + comment field
 * No emojis — MaterialCommunityIcons only
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSubmitFeedbackMutation } from '@features/feedback/feedbackApi';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';

const HERO_FROM = '#D4882A';
const HERO_TO = '#A86D20';
const STAR_COLOR = '#F9A825';

const CATEGORIES = ['bug', 'feature', 'general'] as const;
const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  bug: { icon: 'bug-outline', label: 'Bug Report' },
  feature: { icon: 'lightbulb-on-outline', label: 'Feature' },
  general: { icon: 'message-text-outline', label: 'General' },
};

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.enum(CATEGORIES),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function SubmitFeedbackScreen() {
  const router = useRouter();
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 5, category: 'general', comment: '' },
  });

  const onSubmit = async (data: FeedbackForm) => {
    try {
      await submitFeedback(data).unwrap();
      Alert.alert('Thank You', 'Your feedback has been submitted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Failed', 'Could not submit your feedback.');
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
              <MaterialCommunityIcons name="message-star-outline" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <Text style={s.heroTitle}>Submit Feedback</Text>
          <Text style={s.heroSub}>Help us improve your experience</Text>
        </LinearGradient>

        {/* Rating */}
        <View style={s.fieldWrap}>
          <View style={s.fieldLabel}>
            <MaterialCommunityIcons name="star-outline" size={14} color={colors.neutral[500]} />
            <Text style={s.fieldLabelText}>Rating</Text>
          </View>
          <Controller name="rating" control={control} render={({ field: { onChange, value } }) => (
            <View style={s.starRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name={n <= value ? 'star' : 'star-outline'} size={36} color={n <= value ? STAR_COLOR : colors.neutral[300]} />
                </TouchableOpacity>
              ))}
            </View>
          )} />
          {errors.rating && <Text style={s.fieldError}>{errors.rating.message}</Text>}
        </View>

        {/* Category chips */}
        <View style={s.fieldWrap}>
          <View style={s.fieldLabel}>
            <MaterialCommunityIcons name="tag-outline" size={14} color={colors.neutral[500]} />
            <Text style={s.fieldLabelText}>Category</Text>
          </View>
          <Controller name="category" control={control} render={({ field: { onChange, value } }) => (
            <View style={s.chipRow}>
              {CATEGORIES.map(c => {
                const active = value === c;
                const meta = CATEGORY_META[c];
                return (
                  <TouchableOpacity key={c} onPress={() => onChange(c)} style={[s.chip, active && s.chipActive]} activeOpacity={0.7}>
                    <MaterialCommunityIcons name={meta.icon as any} size={16} color={active ? HERO_FROM : colors.neutral[500]} />
                    <Text style={[s.chipText, active && s.chipTextActive]}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )} />
          {errors.category && <Text style={s.fieldError}>{errors.category.message}</Text>}
        </View>

        {/* Comment */}
        <View style={s.fieldWrap}>
          <View style={s.fieldLabel}>
            <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.neutral[500]} />
            <Text style={s.fieldLabelText}>Comment</Text>
          </View>
          <Controller name="comment" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <RNTextInput
              style={[s.input, s.multiInput]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              placeholder="Tell us what you think (min 10 chars)..."
              placeholderTextColor={colors.neutral[400]}
            />
          )} />
          {errors.comment && <Text style={s.fieldError}>{errors.comment.message}</Text>}
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSubmit(onSubmit)} disabled={isLoading} activeOpacity={0.8}>
          <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
            {isLoading ? <ActivityIndicator color="#FFF" size={18} /> : <MaterialCommunityIcons name="send-outline" size={18} color="#FFF" />}
            <Text style={s.saveBtnText}>{isLoading ? 'Submitting...' : 'Submit Feedback'}</Text>
          </LinearGradient>
        </TouchableOpacity>
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

  fieldWrap: { marginBottom: spacing[4] },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[1] },
  fieldLabelText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  fieldError: { fontSize: 12, color: colors.error.main, marginTop: 4 },

  starRow: { flexDirection: 'row', gap: spacing[2], paddingVertical: spacing[2] },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.neutral[200] },
  chipActive: { backgroundColor: HERO_FROM + '14', borderColor: HERO_FROM },
  chipText: { fontSize: 13, color: colors.neutral[600] },
  chipTextActive: { color: HERO_FROM, fontWeight: '600' },

  input: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: 15, color: colors.neutral[900] },
  multiInput: { minHeight: 100, textAlignVertical: 'top' },

  saveBtn: { marginTop: spacing[2] },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: borderRadius.full },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
