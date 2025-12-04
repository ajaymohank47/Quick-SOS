import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Button, Text, useTheme, Surface, ActivityIndicator, IconButton, Avatar, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { sosService } from '../services/sosService';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const { user, signOut } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [cameraType, setCameraType] = useState<CameraType>('front');
    const [cameraReady, setCameraReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [captureStep, setCaptureStep] = useState<'idle' | 'front' | 'back' | 'uploading'>('idle');
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleSOSPress = async () => {
        if (!permission?.granted) {
            Alert.alert('Permission Required', 'Camera permission is needed for SOS.');
            await requestPermission();
            return;
        }

        Alert.alert(
            'Confirm SOS',
            'Are you sure you want to trigger an SOS alert?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'YES, HELP ME',
                    style: 'destructive',
                    onPress: startSOSFlow
                }
            ]
        );
    };

    const startSOSFlow = async () => {
        setLoading(true);
        setIsSOSActive(true);
        setCaptureStep('front');
        setCameraType('front');
    };

    const onCameraReady = async () => {
        console.log('Camera ready, step:', captureStep);
        if (captureStep === 'front' && cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
                if (photo?.uri) {
                    setImages(prev => [...prev, photo.uri]);
                    setCaptureStep('back');
                    setCameraType('back');
                }
            } catch (e) {
                console.error("Front capture failed", e);
                setCaptureStep('back');
                setCameraType('back');
            }
        } else if (captureStep === 'back' && cameraRef.current) {
            setTimeout(async () => {
                try {
                    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.5 });
                    if (photo?.uri) {
                        setImages(prev => [...prev, photo.uri]);
                    }
                } catch (e) {
                    console.error("Back capture failed", e);
                }
                setCaptureStep('uploading');
                finalizeSOS();
            }, 1000); // Wait a bit for camera switch
        }
    };

    const finalizeSOS = async () => {
        try {
            console.log('Finalizing SOS...');
            const location = await sosService.getCurrentLocation();
            const batteryLevel = await Battery.getBatteryLevelAsync();

            const uploadedImageUrls = [];
            for (const uri of images) {
                try {
                    const url = await sosService.uploadImage(uri);
                    uploadedImageUrls.push(url);
                } catch (e) {
                    console.error("Image upload failed", e);
                }
            }

            const sosId = await sosService.createSOS({
                location,
                images: uploadedImageUrls,
                batteryLevel: Math.round(batteryLevel * 100),
            });

            setLoading(false);
            setIsSOSActive(false);
            setCaptureStep('idle');
            setImages([]);

            navigation.navigate('SOSActive', { sosId });

        } catch (error: any) {
            console.error("SOS Failed:", error);
            Alert.alert('SOS Error', 'Failed to send SOS. Please call emergency services directly.');
            setLoading(false);
            setIsSOSActive(false);
            setCaptureStep('idle');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>Welcome,</Text>
                    <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                        {user?.displayName?.split(' ')[0] || 'User'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="account-group" mode="contained-tonal" onPress={() => navigation.navigate('Contacts')} />
                    <IconButton icon="logout" onPress={signOut} />
                </View>
            </View>

            <View style={styles.content}>
                <Surface style={styles.sosContainer} elevation={4}>
                    <TouchableOpacity
                        style={[styles.sosButton, { backgroundColor: theme.colors.error }]}
                        onPress={handleSOSPress}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="large" />
                        ) : (
                            <Text style={styles.sosLabel}>SOS</Text>
                        )}
                    </TouchableOpacity>
                </Surface>

                <Text style={{ marginTop: 20, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                    {loading ? 'Sending Alert...' : 'Press for Emergency'}
                </Text>

                <Card style={styles.incomingCard} mode="elevated" onPress={() => navigation.navigate('SOSFeed' as any)}>
                    <Card.Title
                        title="Incoming Alerts"
                        subtitle="View active SOS from contacts"
                        left={(props) => <Avatar.Icon {...props} icon="bell-ring" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />}
                        right={(props) => <IconButton {...props} icon="chevron-right" />}
                    />
                </Card>
            </View>

            {isSOSActive && (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        facing={cameraType}
                        onCameraReady={onCameraReady}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sosContainer: {
        borderRadius: 110,
        elevation: 10,
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)',
            },
            default: {
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
            },
        }),
    },
    sosButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosLabel: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
    },
    incomingCard: {
        marginTop: 40,
        width: '100%',
    },
    cameraContainer: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
});

export default HomeScreen;
