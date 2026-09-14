import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePushTokenApi } from '@/components/api/notifications';

// Safely obtain expo-notifications to ensure Expo Go on Android never crashes
// while enabling full native push capabilities in standalone / EAS development builds.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.warn(
    '[PUSH] expo-notifications native module is not included in this client (e.g. Expo Go on Android). ' +
    'Push notifications require an EAS development build or standalone build.'
  );
}

/**
 * Registers the device for push notifications, sets up Android notification channels,
 * fetches the unique ExpoPushToken, and syncs it with the AgroMarket backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications) {
    console.log('[PUSH] Notifications module unavailable; skipping registration in Expo Go.');
    return null;
  }

  let token: string | null = null;

  try {
    // Set up Android High-Priority Channel
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AgroMarket Messages & Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D5A27',
        sound: 'default',
      });
    }

    // Push notifications only deliver to physical hardware devices
    if (!Device.isDevice) {
      console.log('[PUSH] Running in emulator/simulator; push token requires physical hardware.');
      return null;
    }

    // Request/verify system permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] User declined notification permissions.');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      '4f92ecda-bb28-41f4-881f-424d5e73b3f0';

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = pushTokenData.data;
    console.log('[PUSH] Successfully obtained ExpoPushToken:', token);

    // Save token to backend user profile
    if (token) {
      await savePushTokenApi(token);
    }
  } catch (error) {
    console.warn('[PUSH WARN] Notification registration skipped or failed:', error);
  }

  return token;
}

/**
 * Listens for user interactions with notification banners and calls the provided callback with conversationId.
 */
export function addNotificationResponseListener(callback: (conversationId: string) => void): () => void {
  if (!Notifications?.addNotificationResponseReceivedListener) {
    return () => {};
  }

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.conversationId) {
        callback(String(data.conversationId));
      }
    });

    return () => subscription.remove();
  } catch (error) {
    console.warn('[PUSH] Could not attach notification response listener:', error);
    return () => {};
  }
}
