import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { firebaseDb } from '../services/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, useTheme, Avatar } from 'react-native-paper';

type SOSDetailScreenRouteProp = RouteProp<RootStackParamList, 'SOSDetail'>;

interface SOSData {
    sosId: string;
    userName: string;
    status: string;
    currentLocation: {
        lat: number;
        lng: number;
    };
    imageRefs: string[];
}

const SOSDetailScreen = () => {
    const route = useRoute<SOSDetailScreenRouteProp>();
    const navigation = useNavigation();
    const theme = useTheme();
    const { sosId } = route.params || {};
    const [sosData, setSosData] = useState<SOSData | null>(null);

    useEffect(() => {
        if (!sosId) return;
        const unsubscribe = firebaseDb.collection('sos').doc(sosId).onSnapshot(doc => {
            if (doc.exists) {
                setSosData({ sosId: doc.id, ...doc.data() } as SOSData);
            } else {
                alert('SOS Alert ended or not found.');
                navigation.goBack();
            }
        });
        return unsubscribe;
    }, [sosId]);

    if (!sosData) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading SOS Details...</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {/* Placeholder for Map on Web */}
            <View style={[styles.mapContainer, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                <Text variant="bodyLarge">Map View not available on Web</Text>
                <Text variant="bodyMedium">Lat: {sosData.currentLocation.lat}, Lng: {sosData.currentLocation.lng}</Text>

                <SafeAreaView style={styles.overlayHeader}>
                    <Button mode="contained-tonal" icon="arrow-left" onPress={() => navigation.goBack()}>
                        Back
                    </Button>
                </SafeAreaView>
            </View>

            {/* Details Sheet */}
            <View style={[styles.detailsContainer, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Avatar.Icon size={50} icon="alert" style={{ backgroundColor: theme.colors.error }} color={theme.colors.onError} />
                    <View style={{ marginLeft: 15 }}>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{sosData.userName}</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>Status: {sosData.status.toUpperCase()}</Text>
                    </View>
                </View>

                <Text variant="titleMedium" style={{ marginTop: 20, marginBottom: 10 }}>Evidence</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceList}>
                    {sosData.imageRefs && sosData.imageRefs.length > 0 ? (
                        sosData.imageRefs.map((url, index) => (
                            <Image key={index} source={{ uri: url }} style={styles.evidenceImage} />
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.outline }}>No images captured.</Text>
                    )}
                </ScrollView>

                <Button
                    mode="contained"
                    style={{ marginTop: 20 }}
                    buttonColor={theme.colors.primary}
                    onPress={() => { /* TODO: Open in Maps App */ }}
                >
                    Navigate to Location
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        flex: 1, // Takes 50-60% of screen
    },
    overlayHeader: {
        position: 'absolute',
        top: 10,
        left: 20,
    },
    detailsContainer: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30, // Overlap map slightly
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    evidenceList: {
        flexGrow: 0,
    },
    evidenceImage: {
        width: 120,
        height: 160,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#eee',
    },
});

export default SOSDetailScreen;
