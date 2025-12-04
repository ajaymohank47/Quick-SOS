import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebaseDb } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Avatar, useTheme, IconButton } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns'; // You might need to install date-fns or use a simple formatter

interface SOSAlert {
    sosId: string;
    userName: string;
    startTime: any;
    status: string;
    currentLocation: {
        lat: number;
        lng: number;
    };
}

import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ... imports

const SOSFeedScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useTheme();
    const [alerts, setAlerts] = useState<SOSAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Query active SOS alerts where current user is a contact
        const unsubscribe = firebaseDb.collection('sos')
            .where('contactsNotified', 'array-contains', user.uid)
            .where('status', '==', 'active')
            .onSnapshot(snapshot => {
                const newAlerts = snapshot.docs.map(doc => ({
                    sosId: doc.id,
                    ...doc.data()
                })) as SOSAlert[];

                // Sort by time (newest first)
                newAlerts.sort((a, b) => {
                    const getTime = (t: any) => t?.toDate ? t.toDate().getTime() : new Date(t).getTime();
                    return getTime(b.startTime) - getTime(a.startTime);
                });

                setAlerts(newAlerts);
                setLoading(false);
            }, error => {
                console.error("Error fetching SOS alerts:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [user]);

    const renderItem = ({ item }: { item: SOSAlert }) => {
        const timeAgo = item.startTime?.toDate
            ? formatDistanceToNow(item.startTime.toDate(), { addSuffix: true })
            : 'Just now';

        return (
            <Card style={styles.card} onPress={() => navigation.navigate('SOSDetail', { sosId: item.sosId })}>
                <Card.Title
                    title={`SOS from ${item.userName}`}
                    subtitle={`Started ${timeAgo}`}
                    left={(props) => <Avatar.Icon {...props} icon="alert-circle" style={{ backgroundColor: theme.colors.error }} color={theme.colors.onError} />}
                />
                <Card.Content>
                    <Text variant="bodyMedium">Tap to view live location and evidence.</Text>
                </Card.Content>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Incoming Alerts</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={item => item.sosId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>No active SOS alerts.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    list: {
        padding: 20,
    },
    card: {
        marginBottom: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default SOSFeedScreen;
