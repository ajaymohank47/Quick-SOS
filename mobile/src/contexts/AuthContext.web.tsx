import React, { createContext, useState, useEffect, useContext } from 'react';
import firebase from 'firebase/compat/app';
import { firebaseAuth, firebaseDb, serverTimestamp } from '../services/firebase';

// Mock types - keeping interface compatible with app usage
interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextData {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
            if (!mounted) return;
            if (firebaseUser) {
                // Create or update user profile
                const userRef = firebaseDb.collection('users').doc(firebaseUser.uid);
                try {
                    const doc = await userRef.get();
                    if (!doc.exists) {
                        await userRef.set({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email?.toLowerCase(),
                            name: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            contacts: [],
                            deviceTokens: [],
                            lastActive: serverTimestamp(),
                        });
                    } else {
                        await userRef.update({
                            lastActive: serverTimestamp(),
                            email: firebaseUser.email?.toLowerCase(),
                            name: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                        });
                    }
                } catch (error) {
                    console.error("Error updating user profile:", error);
                }

                if (mounted) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                    });
                }
            } else {
                if (mounted) setUser(null);
            }
            if (mounted) setLoading(false);
        });

        // Force stop loading after 5 seconds to prevent white screen if Firebase is blocked
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth state change timed out (likely network blocked). Defaulting to signed out.");
                setLoading(false);
            }
        }, 5000);

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebaseAuth.signInWithPopup(provider as any);
            // onAuthStateChanged should handle the state update, 
            // but we ensure loading is cleared just in case.
            setLoading(false);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Failed to sign in with Google. Check console for details.");
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await firebaseAuth.signOut();
        } catch (error) {
            console.error("Sign Out Error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
