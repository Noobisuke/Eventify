import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { EventProvider } from './src/context/EventContext';
import RootNavigator from './src/navigation/RootNavigator';
import WebShell from './src/components/WebShell';

// Keep the native splash visible until we know which screen to show
SplashScreen.preventAutoHideAsync().catch(() => {});

// Hides the splash once the saved-login check has finished.
// Must sit inside AuthProvider so it can read the auth state.
function SplashGate({ children }) {
  const { loading } = useAuth(); // adjust if your flag is named differently (e.g. isLoading, initializing)

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  return children;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* WebShell only does anything in the browser (centres the app in a phone-sized card) */}
          <WebShell>
            <AuthProvider>
              <SplashGate>
                <EventProvider>
                  <RootNavigator />
                  <Toast />
                </EventProvider>
              </SplashGate>
            </AuthProvider>
          </WebShell>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}