/**
 * Google Fit / Health Connect Setup Screen
 *
 * Google Fit syncs through Android Health Connect.
 * This screen shows setup state, permission state, and latest synced values.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@components/common/Button';
import { useGoogleFitData } from '@hooks/useGoogleFitData';
import { HEALTH_CONNECT_SDK_STATUS } from '@services/googleFitService';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import Constants from 'expo-constants';

export default function GoogleFitScreen() {
  const router = useRouter();
  const googleFit = useGoogleFitData();

  const needsDevBuild = useMemo(() => Constants.appOwnership === 'expo', []);
  const sdkStatus = googleFit.sdkStatus;
  const hcNotInstalled = sdkStatus === HEALTH_CONNECT_SDK_STATUS.SDK_UNAVAILABLE_PROVIDER_NOT_INSTALLED;
  const hcNeedsUpdate = sdkStatus === HEALTH_CONNECT_SDK_STATUS.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  const needsHealthConnect = googleFit.isModuleAvailable && !googleFit.isAvailable;
  const needsPermissions = googleFit.isAvailable && !googleFit.isAuthorized;

  const openHealthConnectStore = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata').catch(() => {});
  };

  const handleAuthorize = async () => {
    const granted = await googleFit.authorize();

    if (granted) {
      Alert.alert('Permissions granted', 'Health Connect permissions were granted successfully.');
      await googleFit.refresh();
      return;
    }

    googleFit.openSettings();

    Alert.alert(
      'Finish setup in Health Connect',
      'In Health Connect, grant permissions for this app, ensure Google Fit is connected as a data source, then return and tap Refresh.',
    );
  };

  const metricRows = [
    { label: 'Steps', value: googleFit.latestValues.steps, unit: 'steps', icon: 'walk' },
    { label: 'Distance', value: googleFit.latestValues.distance, unit: 'km', icon: 'map-marker-distance' },
    { label: 'Calories', value: googleFit.latestValues.calories_burned, unit: 'kcal', icon: 'fire' },
    { label: 'Sleep', value: googleFit.latestValues.sleep_time, unit: 'hrs', icon: 'power-sleep' },
    { label: 'Heart Rate', value: googleFit.latestValues.heart_rate, unit: 'bpm', icon: 'heart-pulse' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <LinearGradient colors={['#4A7580', '#375A64']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="google-fit" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Google Fit</Text>
              <Text style={styles.subtitle}>Sync fitness data through Android Health Connect</Text>
            </View>
          </View>
        </LinearGradient>

        {needsDevBuild ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Development build required</Text>
            <Text style={styles.description}>Health Connect will not work in Expo Go. Build and install a development client or production APK/AAB first.</Text>
          </View>
        ) : needsHealthConnect ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{hcNeedsUpdate ? 'Update Health Connect' : hcNotInstalled ? 'Install Health Connect' : 'Health Connect unavailable'}</Text>
            <Text style={styles.description}>
              {hcNeedsUpdate
                ? 'Update Health Connect from the Play Store, then connect Google Fit as a data source inside Health Connect.'
                : hcNotInstalled
                  ? 'Install Health Connect, then open Health Connect and allow Google Fit to sync data into it.'
                  : 'Health Connect is not ready on this device yet.'}
            </Text>
            <Button variant="primary" onPress={openHealthConnectStore} style={styles.button}>
              {hcNeedsUpdate ? 'Update Health Connect' : 'Open Play Store'}
            </Button>
          </View>
        ) : needsPermissions ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grant permissions</Text>
            <Text style={styles.description}>Allow access to steps, distance, calories, sleep, and heart rate so the app can show them on Home and Health Summary.</Text>
            <Button variant="primary" onPress={handleAuthorize} style={styles.button}>Grant Health Connect Permissions</Button>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.cardTitle}>Connection status</Text>
            {googleFit.isLoading ? <ActivityIndicator size="small" color={colors.primary[600]} /> : null}
          </View>
          <Text style={styles.statusText}>Module: {googleFit.isModuleAvailable ? 'Available' : 'Unavailable'}</Text>
          <Text style={styles.statusText}>Health Connect: {googleFit.isAvailable ? 'Ready' : 'Not Ready'}</Text>
          <Text style={styles.statusText}>Permissions: {googleFit.isAuthorized ? 'Granted' : 'Missing'}</Text>
          {googleFit.isModuleAvailable ? (
            <Button variant="outline" onPress={googleFit.openSettings} style={styles.button}>Open Health Connect Settings</Button>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.cardTitle}>Today's synced data</Text>
            <Button variant="ghost" onPress={googleFit.refresh}>Refresh</Button>
          </View>
          {metricRows.map((metric) => (
            <View key={metric.label} style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <MaterialCommunityIcons name={metric.icon as any} size={18} color={colors.primary[700]} />
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
              <Text style={styles.metricValue}>{metric.value != null ? `${metric.value.toFixed(metric.unit === 'km' || metric.unit === 'hrs' ? 1 : 0)} ${metric.unit}` : '--'}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: spacing[4],
  },
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing[3],
    color: colors.neutral[800],
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[600],
  },
  statusText: {
    fontSize: 14,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  button: {
    marginTop: spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metricLabel: {
    fontSize: 14,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    color: colors.neutral[900],
    fontWeight: '700',
  },
});
