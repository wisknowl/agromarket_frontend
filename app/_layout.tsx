import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "auth/login",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="yield/[id]"
          options={{
            title: "Product Details",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="farmer/[id]"
          options={{
            title: "Farmer Profile",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            title: "Chat",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: "Register",
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}