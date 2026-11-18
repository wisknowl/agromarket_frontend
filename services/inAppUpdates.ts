import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
  IAUInstallStatus,
} from 'sp-react-native-in-app-updates';

const PLAY_STORE_URL = 'market://details?id=com.agrom.app';
const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=com.agrom.app';

let inAppUpdatesInstance: SpInAppUpdates | null = null;

function getInAppUpdatesInstance(): SpInAppUpdates | null {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return null;
  }
  if (!inAppUpdatesInstance) {
    try {
      // isDebug = false (production mode checks Play Store/App Store)
      inAppUpdatesInstance = new SpInAppUpdates(false);
    } catch (err) {
      console.warn('[InAppUpdates] Failed to instantiate SpInAppUpdates:', err);
      return null;
    }
  }
  return inAppUpdatesInstance;
}

/**
 * Checks for updates on Google Play Store (Android) or App Store (iOS).
 * Automatically handles Flexible background downloads or Immediate forced updates.
 */
export async function checkAndApplyAppUpdates(isForced = false): Promise<void> {
  const inAppUpdates = getInAppUpdatesInstance();
  if (!inAppUpdates) return;

  try {
    const updateResult = await inAppUpdates.checkNeedsUpdate();

    if (updateResult && updateResult.shouldUpdate) {
      console.log(`[InAppUpdates] Update available. Current version: ${(updateResult.other as any)?.version || 'N/A'}`);

      // Listen for download completion on Flexible updates
      if (Platform.OS === 'android' && !isForced) {
        inAppUpdates.addStatusUpdateListener((downloadStatus) => {
          if (downloadStatus.status === IAUInstallStatus.DOWNLOADED) {
            Alert.alert(
              'Update Downloaded 🎉',
              'A new version of Agrom is ready to install. Restart now to complete the update?',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Restart & Install',
                  style: 'default',
                  onPress: () => {
                    try {
                      inAppUpdates.installUpdate();
                    } catch (e) {
                      console.warn('[InAppUpdates] Error completing install:', e);
                    }
                  },
                },
              ]
            );
          }
        });
      }

      // Configure whether to trigger Immediate (blocking modal) or Flexible (background)
      let updateOptions: StartUpdateOptions;
      if (Platform.OS === 'android') {
        updateOptions = {
          updateType: isForced ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE,
        };
      } else {
        updateOptions = {
          title: 'Update Available',
          message: 'A new version of Agrom is available. Please update to enjoy the latest features.',
          buttonUpgradeText: 'Update Now',
          buttonCancelText: isForced ? undefined : 'Later',
        };
      }

      await inAppUpdates.startUpdate(updateOptions);
    } else {
      console.log('[InAppUpdates] App is currently up-to-date.');
    }
  } catch (err: any) {
    // In local development or devices without Google Play services, this may fail quietly
    console.log('[InAppUpdates] Update check finished (or skipped in dev):', err?.message || err);
  }
}

/**
 * Fallback to open the Google Play Store page directly.
 */
export async function openStorePage(): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(PLAY_STORE_URL);
    if (supported) {
      await Linking.openURL(PLAY_STORE_URL);
    } else {
      await Linking.openURL(PLAY_STORE_WEB_URL);
    }
  } catch {
    await Linking.openURL(PLAY_STORE_WEB_URL);
  }
}

/**
 * Hook to automatically check for updates on app startup.
 */
export function useInAppUpdateChecker(isForced = false) {
  useEffect(() => {
    // Avoid running on web or non-mobile platforms
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

    // Small initial delay so root navigation and splash screen dismiss first
    const timer = setTimeout(() => {
      checkAndApplyAppUpdates(isForced);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isForced]);
}

