import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { firebaseFunctions } from './firebase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SOSLocation {
    lat: number;
    lng: number;
    accuracy: number | null;
}

export const sosService = {
    async getCurrentLocation(): Promise<SOSLocation> {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission not granted');
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy,
        };
    },

    async getUploadSignature(): Promise<{ signature: string; timestamp: number; cloudName: string; apiKey: string }> {
        const getSignature = firebaseFunctions.httpsCallable('getUploadSignature');
        const result = await getSignature();
        return result.data as any;
    },

    async uploadImage(uri: string): Promise<string> {
        // 1. Get signature
        const { signature, timestamp, cloudName, apiKey } = await this.getUploadSignature();

        // 2. Prepare form data
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'sos_image.jpg',
        } as any);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        // 3. Upload to Cloudinary
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data.secure_url;
    },

    async createSOS(data: {
        location: SOSLocation;
        images: string[];
        batteryLevel: number;
    }) {
        const createSOSFn = firebaseFunctions.httpsCallable('createSOS');
        const result = await createSOSFn(data);
        return result.data; // Returns sosId
    },

    async updateSOS(data: {
        sosId: string;
        location: SOSLocation;
        images?: string[];
        batteryLevel?: number;
    }) {
        const updateSOSFn = firebaseFunctions.httpsCallable('updateSOS');
        await updateSOSFn(data);
    },

    async startSOSUpdates(sosId: string) {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status === 'granted') {
            await Location.startLocationUpdatesAsync('background-location-task', {
                accuracy: Location.Accuracy.High,
                timeInterval: 5 * 60 * 1000, // 5 minutes
                distanceInterval: 100, // 100 meters
                foregroundService: {
                    notificationTitle: "SOS Active",
                    notificationBody: "Sharing your location with emergency contacts.",
                },
            });
            // Store active SOS ID for the task to use
            await AsyncStorage.setItem('activeSOSId', sosId);
        }
    },

    async stopSOSUpdates() {
        const isRegistered = await TaskManager.isTaskRegisteredAsync('background-location-task');
        if (isRegistered) {
            await Location.stopLocationUpdatesAsync('background-location-task');
        }
        await AsyncStorage.removeItem('activeSOSId');
    },

    async endSOS(sosId: string) {
        const endSOSFn = firebaseFunctions.httpsCallable('endSOS');
        await endSOSFn({ sosId });
        await this.stopSOSUpdates();
    }
};
