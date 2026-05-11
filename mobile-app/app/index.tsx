/**
 * Splash/Entry Screen
 * Checks authentication token and redirects accordingly
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { secureStorage } from '@utils/storage';
import colors from '@theme/colors';
import { textStyles } from '@theme/typography';
import { spacing } from '@theme/spacing';

type JwtPayload = {
  exp?: number;
};

const isTokenValid = (token: string) => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default function SplashScreen() {
  const router = useRouter();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (initialCheckDone) return;

    const checkAuthAndRedirect = async () => {
      const token = await secureStorage.getAccessToken();

      setInitialCheckDone(true);
      if (token && isTokenValid(token)) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/welcome');
      }
    };

    checkAuthAndRedirect();
  }, [initialCheckDone, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="hospital-building" size={56} color={colors.primary[600]} />
        </View>

        {/* App Name */}
        <Text style={styles.title}>Diavise</Text>
        <Text style={styles.subtitle}>Your Personal Health Companion</Text>

        {/* Loader */}
        <ActivityIndicator
          size="large"
          color={colors.primary[600]}
          style={styles.loader}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[600],
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logo: {
    fontSize: 72,
  },
  title: {
    fontSize: textStyles.h1.fontSize,
    fontWeight: textStyles.h1.fontWeight,
    lineHeight: textStyles.h1.lineHeight,
    color: '#FFFFFF',
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: textStyles.body1.fontSize,
    fontWeight: textStyles.body1.fontWeight,
    lineHeight: textStyles.body1.lineHeight,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing[8],
  },
  footer: {
    paddingBottom: spacing[8],
    alignItems: 'center',
  },
  footerText: {
    fontSize: textStyles.caption.fontSize,
    fontWeight: textStyles.caption.fontWeight,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
