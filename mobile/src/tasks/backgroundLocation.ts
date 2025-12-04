import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { firebaseFunctions } from '../services/firebase';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Only define task on native platforms
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
        if (error) {
            console.error('Background location task error:', error);
            return;
        }

        if (data) {
            const { locations } = data as { locations: Location.LocationObject[] };
            const location = locations[0]; // Get the latest location

            if (location) {
                console.log('Background location update:', location);

                try {
                    const SecureStore = require('expo-secure-store');
                    const sosId = await SecureStore.getItemAsync('active_sos_id');

                    if (sosId) {
                        const updateSOSLocation = firebaseFunctions.httpsCallable('updateSOSLocation');
                        await updateSOSLocation({
                            sosId,
                            location: {
                                lat: location.coords.latitude,
                                lng: location.coords.longitude,
                                accuracy: location.coords.accuracy,
                            },
                        });
                    }
                } catch (err) {
                    console.error('Failed to update SOS in background:', err);
                }
            }
        }
    });
}
