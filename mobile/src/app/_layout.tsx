import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { isRunningInExpoGo } from 'expo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DialogProvider } from '@/components/feedback/dialog';
import { ToastProvider } from '@/components/feedback/toast';
import { configureNotifications } from '@/services/notifications/reminders';
import { queryClient } from '@/services/query-client';
import { useAuth } from '@/store/auth';
import { ThemeProvider, useTheme } from '@/theme';

// Keep the native splash up until fonts are ready and the session is known,
// so the first frame the user sees is the right screen, fully styled.
SplashScreen.preventAutoHideAsync().catch(() => {});
// Expo Go can't customise the splash screen (it only warns); the APK can.
if (!isRunningInExpoGo()) SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_600SemiBold,
  });
  const status = useAuth((s) => s.status);

  useEffect(() => {
    void useAuth.getState().restore();
    void configureNotifications();
  }, []);

  // Fonts failing to load must not trap the user on the splash screen.
  const ready = (fontsLoaded || !!fontError) && status !== 'restoring';
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <DialogProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </DialogProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const t = useTheme();
  const signedIn = useAuth((s) => s.status === 'signedIn');

  // Match the navigation container and Android window background to the
  // theme, so no white flashes appear between screens in dark mode.
  const navTheme = useMemo(() => {
    const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: t.colors.primary,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.text,
        border: t.colors.border,
      },
    };
  }, [t]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.colors.background).catch(() => {});
  }, [t]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background }, animation: 'fade' }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </NavigationThemeProvider>
  );
}
