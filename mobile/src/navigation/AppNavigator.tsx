import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SOSActiveScreen from '../screens/SOSActiveScreen';
import ContactsScreen from '../screens/ContactsScreen';
import { ActivityIndicator, View, Text as RNText } from 'react-native';

import SOSFeedScreen from '../screens/SOSFeedScreen';
import SOSDetailScreen from '../screens/SOSDetailScreen';

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    SOSActive: { sosId: string };
    SOSFeed: undefined;
    SOSDetail: { sosId: string };
    Contacts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF0000" />
                <RNText style={{ marginTop: 20 }}>Loading...</RNText>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="SOSActive" component={SOSActiveScreen} />
                        <Stack.Screen name="SOSFeed" component={SOSFeedScreen} />
                        <Stack.Screen name="SOSDetail" component={SOSDetailScreen} />
                        <Stack.Screen name="Contacts" component={ContactsScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
