/**
 * Notification Service
 *
 * Encapsulates all logic related to push notifications,
 * including permission handling, token registration, and scheduling
 * local notifications.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { NotificationTriggerInput } from 'expo-notifications';

let notificationHandlerInitialized = false;

const isExpoGo = () => {
  // executionEnvironment is the most reliable; appOwnership is a reasonable fallback.
  return (
    (Constants as any)?.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo'
  );
};

const isValidUuid = (value: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
};

const getNotificationsModule = async () => {
  return await import('expo-notifications');
};

const ensureNotificationHandler = async () => {
  if (notificationHandlerInitialized) return;
  const Notifications = await getNotificationsModule();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  notificationHandlerInitialized = true;
};

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go on Android (SDK 53+) does not support remote push notifications.
  // Avoid importing expo-notifications in Expo Go to prevent runtime errors.
  if (isExpoGo()) {
    return null;
  }

  const Notifications = await getNotificationsModule();
  await ensureNotificationHandler();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || typeof projectId !== 'string' || !isValidUuid(projectId)) {
    // Without a valid EAS projectId, Expo cannot issue a push token.
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  return token;
}

export async function schedulePushNotification(
  title: string,
  body: string,
  data: Record<string, unknown>,
  trigger: NotificationTriggerInput
) {
  if (isExpoGo()) {
    return;
  }

  const Notifications = await getNotificationsModule();
  await ensureNotificationHandler();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger,
  });
}
