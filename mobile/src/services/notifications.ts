import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { firebaseFunctions } from './firebase';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        try {
            // This returns the native device push token (FCM on Android, APNs on iOS)
            token = (await Notifications.getDevicePushTokenAsync()).data;
            console.log('Device Push Token:', token);

            // Register token with backend
            const registerToken = firebaseFunctions.httpsCallable('registerDeviceToken');
            await registerToken({ token });

        } catch (e) {
            console.error('Error getting push token:', e);
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}

// Handler for incoming notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
