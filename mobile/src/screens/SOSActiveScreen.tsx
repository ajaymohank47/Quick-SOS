import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { firebaseFunctions, firebaseStorage } from '../services/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocation';
import { useTheme, Button } from 'react-native-paper';

type SOSActiveScreenRouteProp = RouteProp<RootStackParamList, 'SOSActive'>;

const SOSActiveScreen = () => {
    const route = useRoute<SOSActiveScreenRouteProp>();
    const navigation = useNavigation();
    const theme = useTheme();
    const [status, setStatus] = useState('Initializing...');
    const [sosId, setSosId] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        startSOS();
        return () => {
            // Cleanup if needed, but we want background task to persist until explicitly ended
        };
    }, []);

    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            const filename = uri.substring(uri.lastIndexOf('/') + 1);
            const storageRef = firebaseStorage.ref(`sos_images/${new Date().getTime()}_${filename}`);
            await storageRef.putFile(uri);
            return await storageRef.getDownloadURL();
        } catch (error) {
            console.error('Image upload failed:', error);
            return null;
        }
    };

    const startSOS = async () => {
        try {
            if (!permission?.granted) {
                await requestPermission();
            }

            setStatus('Capturing location...');
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

            setStatus('Capturing evidence...');
            let imageUrl = null;
            if (cameraRef.current) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
                    if (photo?.uri) {
                        setStatus('Uploading evidence...');
                        imageUrl = await uploadImage(photo.uri);
                    }
                } catch (e) {
                    console.warn('Camera capture failed:', e);
                }
            }

            setStatus('Activating SOS...');
            const createSOS = firebaseFunctions.httpsCallable('createSOS');
            const result = await createSOS({
                currentLocation: {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                },
                imageRefs: imageUrl ? [imageUrl] : [],
            });

            const data = result.data as { sosId: string };
            setSosId(data.sosId);
            await SecureStore.setItemAsync('active_sos_id', data.sosId);

            setStatus('SOS Active. Tracking location...');

            // Start background location updates
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.High,
                distanceInterval: 10, // Update every 10 meters
                deferredUpdatesInterval: 5000, // Minimum 5 seconds
                foregroundService: {
                    notificationTitle: "SOS Active",
                    notificationBody: "Sharing your live location with emergency contacts.",
                    notificationColor: "#FF0000",
                },
            });

        } catch (error) {
            console.error(error);
            setStatus('Error: ' + (error as any).message);
        }
    };

    const endSOS = async () => {
        if (!sosId) return;
        try {
            setStatus('Ending SOS...');

            // Stop background task
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            await SecureStore.deleteItemAsync('active_sos_id');

            const endSOSFunc = firebaseFunctions.httpsCallable('endSOS');
            await endSOSFunc({ sosId });

            navigation.goBack();
        } catch (error) {
            console.error(error);
            alert('Failed to end SOS. Please try again.');
            setStatus('SOS Active. Tracking location...'); // Revert status if failed
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
            <View style={styles.content}>
                <Text style={[styles.status, { color: theme.colors.onErrorContainer }]}>{status}</Text>

                {!sosId && <ActivityIndicator size="large" color={theme.colors.error} />}

                {/* Camera Preview (Small, to ensure capture works) */}
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} ref={cameraRef} facing="back" />
                </View>

                {sosId && (
                    <Button
                        mode="contained"
                        onPress={endSOS}
                        style={styles.endButton}
                        buttonColor={theme.colors.error}
                        textColor={theme.colors.onError}
                        contentStyle={{ height: 60 }}
                        labelStyle={{ fontSize: 20, fontWeight: 'bold' }}
                    >
                        END SOS
                    </Button>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    status: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    cameraContainer: {
        width: 100,
        height: 100,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
        opacity: 0.5, // Subtle preview
    },
    camera: {
        flex: 1,
    },
    endButton: {
        marginTop: 50,
        width: '100%',
        borderRadius: 30,
    },
});

export default SOSActiveScreen;
