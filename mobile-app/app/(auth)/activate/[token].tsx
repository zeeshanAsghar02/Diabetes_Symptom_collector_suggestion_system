/**
 * Account Activation Screen
 * Activates user account from email link
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { useActivateAccountMutation } from '@features/auth/authApi';
import { spacing, layout } from '@theme/spacing';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';

export default function ActivateAccountScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [activateAccount, { isLoading }] = useActivateAccountMutation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid activation token');
        return;
      }

      try {
        await activateAccount(token).unwrap();
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(
          error?.data?.message || 'Failed to activate account. The link may have expired.'
        );
      }
    };

    activate();
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.content}>
            {status === 'loading' && (
              <>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.title}>Activating Account...</Text>
                <Text style={styles.message}>Please wait while we verify your email.</Text>
              </>
            )}

            {status === 'success' && (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={64} color={colors.success.main} />
                <Text style={styles.successTitle}>Account Activated!</Text>
                <Text style={styles.message}>
                  Your account has been successfully activated. You can now sign in.
                </Text>
                <Button
                  variant="primary"
                  onPress={() => router.replace('/(auth)/signin')}
                  fullWidth
                  style={styles.button}
                >
                  Sign In
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <MaterialCommunityIcons name="close-circle-outline" size={64} color={colors.error.main} />
                <Text style={styles.errorTitle}>Activation Failed</Text>
                <Text style={styles.message}>{errorMessage}</Text>
                <View style={styles.buttonGroup}>
                  <Button
                    variant="primary"
                    onPress={() => router.replace('/(auth)/signin')}
                    style={styles.buttonHalf}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => router.replace('/(auth)/signup')}
                    style={styles.buttonHalf}
                  >
                    Sign Up
                  </Button>
                </View>
              </>
            )}
          </View>
        </Card>
      </View>
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
    justifyContent: 'center',
    padding: spacing[4],
  },
  card: {
    padding: spacing[6],
  },
  content: {
    alignItems: 'center',
    padding: spacing[6],
  },
  title: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    lineHeight: textStyles.h3.lineHeight,
    color: colors.light.text.primary,
    marginTop: spacing[6],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: colors.success.main,
    marginBottom: spacing[4],
  },
  successTitle: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    lineHeight: textStyles.h3.lineHeight,
    color: colors.success.main,
    marginBottom: spacing[4],
  },
  errorIcon: {
    fontSize: 64,
    color: colors.error.main,
    marginBottom: spacing[4],
  },
  errorTitle: {
    fontSize: textStyles.h3.fontSize,
    fontWeight: textStyles.h3.fontWeight,
    lineHeight: textStyles.h3.lineHeight,
    color: colors.error.main,
    marginBottom: spacing[4],
  },
  message: {
    fontSize: textStyles.body1.fontSize,
    fontWeight: textStyles.body1.fontWeight,
    lineHeight: textStyles.body1.lineHeight,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    marginTop: spacing[4],
    minWidth: 200,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[4],
  },
  buttonHalf: {
    flex: 1,
  },
});
