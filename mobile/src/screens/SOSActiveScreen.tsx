import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Button, Text, ActivityIndicator } from 'react-native-paper';
import { sosService } from '../services/sosService';
import ChatComponent from '../components/ChatComponent';

type SOSActiveScreenRouteProp = RouteProp<RootStackParamList, 'SOSActive'>;

const SOSActiveScreen = () => {
    const route = useRoute<SOSActiveScreenRouteProp>();
    const navigation = useNavigation();
    const theme = useTheme();
    const { sosId } = route.params;
    const [status, setStatus] = useState('Initializing...');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sosId) {
            initializeSOS();
        }
    }, [sosId]);

    const initializeSOS = async () => {
        try {
            setStatus('Starting background tracking...');
            await sosService.startSOSUpdates(sosId);
            setStatus('SOS Active. Sharing location...');
        } catch (error) {
            console.error("Failed to start updates:", error);
            setStatus('Error starting tracking.');
        }
    };

    const handleEndSOS = async () => {
        Alert.alert(
            'End SOS',
            'Are you safe? This will stop sharing your location.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'I AM SAFE',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await sosService.endSOS(sosId);
                            navigation.goBack();
                        } catch (error) {
                            console.error("Failed to end SOS:", error);
                            Alert.alert('Error', 'Failed to end SOS. Please try again.');
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <Text variant="displaySmall" style={[styles.status, { color: theme.colors.onErrorContainer }]}>
                        SOS ACTIVE
                    </Text>

                    <Text variant="bodyLarge" style={{ color: theme.colors.onErrorContainer, textAlign: 'center', marginBottom: 10 }}>
                        {status}
                    </Text>

                    {sosId && (
                        <View style={styles.chatContainer}>
                            <ChatComponent sosId={sosId} />
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleEndSOS}
                        style={styles.endButton}
                        buttonColor={theme.colors.error}
                        textColor={theme.colors.onError}
                        contentStyle={{ height: 60 }}
                        labelStyle={{ fontSize: 20, fontWeight: 'bold' }}
                        loading={loading}
                        disabled={loading}
                    >
                        END SOS
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    status: {
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    chatContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
    },
    endButton: {
        width: '100%',
        borderRadius: 30,
    },
});

export default SOSActiveScreen;
