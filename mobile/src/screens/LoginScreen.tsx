import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme, Surface } from 'react-native-paper';

const LoginScreen = () => {
    const { signInWithGoogle } = useAuth();
    const theme = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Surface style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
                    <Text style={[styles.logoText, { color: theme.colors.onPrimaryContainer }]}>SOS</Text>
                </Surface>

                <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
                    Emergency
                </Text>
                <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Your safety companion
                </Text>

                <Button
                    mode="contained"
                    onPress={signInWithGoogle}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    icon="google"
                >
                    Sign in with Google
                </Button>
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
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        marginBottom: 50,
    },
    button: {
        width: '100%',
        borderRadius: 30,
    },
    buttonContent: {
        height: 50,
    },
});

export default LoginScreen;
