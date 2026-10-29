import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { EventProvider } from './src/context/EventContext';
import RootNavigator from './src/navigation/RootNavigator';
import WebShell from './src/components/WebShell';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* WebShell only does anything in the browser (centres the app in a phone-sized card) */}
          <WebShell>
            <AuthProvider>
              <EventProvider>
                <RootNavigator />
                <Toast />
              </EventProvider>
            </AuthProvider>
          </WebShell>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}