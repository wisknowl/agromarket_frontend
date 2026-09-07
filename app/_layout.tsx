import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';

import { FeatureFlagProvider } from '../core/feature-flags/useFeatureFlags';

export const unstable_settings = {
  initialRouteName: 'auth/login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Sync Android system navigation bar style safely (supporting edge-to-edge)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setButtonStyleAsync('dark');
      } catch (e) {
        // Edge-to-edge mode handles background/border automatically
      }
    }
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.white }}>
        <FeatureFlagProvider>
          <RootLayoutNav />
        </FeatureFlagProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function NavigationLogger() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (pathname) {
      console.log(`🧭 [SCREEN NAVIGATE] Visited: ${pathname} (segments: /${segments.join('/')})`);
    }
  }, [pathname, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <NavigationLogger />
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTintColor: Colors.espresso,
          headerTitleStyle: {
            fontFamily: Fonts.bodySemiBold,
            fontSize: 17,
            color: Colors.espresso,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.white,
          },
        }}
      >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="feed/create" options={{ headerShown: false }} />
        <Stack.Screen
          name="yield/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen name="farmer/new" options={{ headerShown: false }} />
        <Stack.Screen name="farmer/manage" options={{ headerShown: false }} />
        <Stack.Screen name="farmer/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="cart/checkout"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="partners/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="notifications/system"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="notifications/activity"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="notifications/followers"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: 'Create Account',
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="fintech/loans" options={{ headerShown: false }} />
        <Stack.Screen name="settings/settings" options={{ headerShown: false }} />
        <Stack.Screen name="become-farmer" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}