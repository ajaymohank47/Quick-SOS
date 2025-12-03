import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { firebaseFunctions } from '../services/firebase';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

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

            // We need the SOS ID to update. 
            // Problem: TaskManager tasks run in a separate context or might not have access to React state.
            // We should store the active SOS ID in SecureStore or AsyncStorage.

            // For now, let's assume we can retrieve it.
            // In a real app, we'd read from storage.
            // import * as SecureStore from 'expo-secure-store';
            // const sosId = await SecureStore.getItemAsync('active_sos_id');

            // Since we can't easily import SecureStore inside the task definition if it's not top-level or if it requires async,
            // actually SecureStore is async. TaskManager tasks can be async.

            try {
                // Dynamic import or require might be needed if not standard
                const SecureStore = require('expo-secure-store');
                const sosId = await SecureStore.getItemAsync('active_sos_id');

                if (sosId) {
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
                }
            } catch (err) {
                console.error('Failed to update SOS in background:', err);
            }
        }
    }
});
