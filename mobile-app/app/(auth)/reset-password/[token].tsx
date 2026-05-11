/**
 * Reset Password Screen
 * Enter new password with token from email link
 */

import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { TextInput } from '@components/common/TextInput';
import { useResetPasswordMutation } from '@features/auth/authApi';
import { resetPasswordSchema, type ResetPasswordFormData } from '@utils/validation';
import { spacing, layout } from '@theme/spacing';
import { colors } from '@theme/colors';
import { textStyles } from '@theme/typography';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      Alert.alert('Error', 'Invalid reset token');
      return;
    }

    try {
      await resetPassword({ token, password: data.password }).unwrap();
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/signin'),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to reset password. The link may have expired.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="New Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    password
                    autoComplete="password-new"
                    textContentType="newPassword"
                    leftIcon="lock-outline"
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Confirm New Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    password
                    autoComplete="password-new"
                    textContentType="newPassword"
                    leftIcon="lock-check-outline"
                  />
                )}
              />

              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                style={styles.submitButton}
              >
                Reset Password
              </Button>
            </View>
          </Card>

          {/* Back to Sign In */}
          <View style={styles.footer}>
            <Button
              variant="ghost"
              onPress={() => router.replace('/(auth)/signin')}
              icon="arrow-left"
            >
              Back to Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[4],
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing[10],
    alignItems: 'center',
  },
  title: {
    ...textStyles.h2,
    color: colors.primary[600],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body1,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing[6],
  },
  form: {
    padding: spacing[6],
    gap: spacing[4],
  },
  submitButton: {
    marginTop: spacing[2],
  },
  footer: {
    alignItems: 'center',
  },
});
