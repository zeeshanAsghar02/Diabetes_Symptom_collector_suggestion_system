/**
 * Forgot Password Screen
 * Request password reset email
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { TextInput } from '@components/common/TextInput';
import { useForgotPasswordMutation } from '@features/auth/authApi';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@utils/validation';
import { spacing, layout } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap();
      setEmailSent(true);
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to send reset email. Please try again.';
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
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive password reset instructions'}
            </Text>
          </View>

          {!emailSent ? (
            <>
              {/* Form Card */}
              <Card style={styles.card}>
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Email"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        leftIcon="email-outline"
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
                    Send Reset Link
                  </Button>
                </View>
              </Card>
            </>
          ) : (
            <Card style={styles.card}>
              <View style={styles.successContent}>
                <View style={styles.successIconContainer}>
                  <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.success.main} />
                </View>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successMessage}>
                  We've sent password reset instructions to:
                </Text>
                <Text style={styles.emailText}>{watch('email')}</Text>
                <Text style={styles.successMessage}>
                  Please check your inbox and follow the link to reset your password.
                </Text>
                
                <Button
                  variant="primary"
                  onPress={() => router.replace('/(auth)/signin')}
                  fullWidth
                  style={styles.backButton}
                >
                  Back to Sign In
                </Button>
              </View>
            </Card>
          )}

          {/* Back to Sign In */}
          {!emailSent && (
            <View style={styles.footer}>
              <Button
                variant="ghost"
                onPress={() => router.back()}
                icon="arrow-left"
              >
                Back to Sign In
              </Button>
            </View>
          )}
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
  successContent: {
    padding: spacing[6],
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: spacing[4],
  },
  successTitle: {
    ...textStyles.h3,
    color: colors.success.main,
    marginBottom: spacing[4],
  },
  successMessage: {
    ...textStyles.body1,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emailText: {
    ...textStyles.body1,
    color: colors.primary[600],
    fontWeight: '600',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing[6],
  },
  footer: {
    alignItems: 'center',
  },
});
