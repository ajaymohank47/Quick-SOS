import React, { createContext, useState, useEffect, useContext } from 'react';
import { firebaseAuth, firebaseDb } from '../services/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

interface AuthContextData {
    user: FirebaseAuthTypes.User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Configure Google Sign-In
        const webClientId = 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE';
        if (webClientId === 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE') {
            console.warn('Google Sign-In: Web Client ID is not configured.');
        }

        GoogleSignin.configure({
            webClientId,
        });

        const subscriber = firebaseAuth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return subscriber;
    }, []);

    const signInWithGoogle = async () => {
        try {
            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get the users ID token
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token found');
            }

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            await auth().signInWithCredential(googleCredential);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            alert('Google Sign-In failed. Check console for details.');
        }
    };

    const signOut = async () => {
        try {
            await GoogleSignin.signOut();
            await firebaseAuth.signOut();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
