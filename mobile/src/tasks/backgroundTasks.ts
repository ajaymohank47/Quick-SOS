import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { sosService } from '../services/sosService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("Background task error:", error);
        return;
    }

    if (data) {
        const { locations } = data as any;
        const location = locations[0]; // Get the first location update

        if (location) {
            try {
                // Check if SOS is active (stored in AsyncStorage or similar, since Context isn't available here)
                const activeSOSId = await AsyncStorage.getItem('activeSOSId');

                if (activeSOSId) {
                    console.log(`Background update for SOS ID: ${activeSOSId}`);

                    const batteryLevel = await Battery.getBatteryLevelAsync();

                    await sosService.updateSOS({
                        sosId: activeSOSId,
                        location: {
                            lat: location.coords.latitude,
                            lng: location.coords.longitude,
                            accuracy: location.coords.accuracy,
                        },
                        batteryLevel: Math.round(batteryLevel * 100),
                    });
                } else {
                    // Stop task if no active SOS? 
                    // Or just ignore. Better to stop it from the app when SOS ends.
                    console.log("No active SOS ID found in background task.");
                }
            } catch (err) {
                console.error("Failed to update SOS in background:", err);
            }
        }
    }
});
