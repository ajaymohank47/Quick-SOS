import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/tasks/backgroundTasks'; // Register background task
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    try {
      registerForPushNotificationsAsync();
    } catch (e) {
      console.warn("Failed to register for push notifications:", e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
