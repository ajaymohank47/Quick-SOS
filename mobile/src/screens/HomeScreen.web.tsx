import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, useTheme, Avatar, Card, IconButton } from 'react-native-paper';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { signOut, user } = useAuth();
    const theme = useTheme();

    const handleSOSPress = async () => {
        // Skip permissions for now on web debug
        navigation.navigate('SOSActive', { sosId: 'new' });
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
                <View style={styles.sosContainer}>
                    <TouchableOpacity
                        style={[styles.sosButton, { backgroundColor: theme.colors.error }]}
                        onPress={handleSOSPress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.sosText}>SOS</Text>
                    </TouchableOpacity>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 20 }}>
                        Press for Emergency
                    </Text>
                </View>

                <Card style={styles.incomingCard} mode="elevated" onPress={() => navigation.navigate('SOSFeed' as any)}>
                    <Card.Title
                        title="Incoming Alerts"
                        subtitle="View active SOS from contacts"
                        left={(props) => <Avatar.Icon {...props} icon="bell-ring" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />}
                        right={(props) => <IconButton {...props} icon="chevron-right" />}
                    />
                </Card>
            </View>
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
        padding: 20,
    },
    sosContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)', // Web standard
    },
    sosText: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    incomingCard: {
        marginTop: 20,
        marginBottom: 20,
    },
});

export default HomeScreen;
