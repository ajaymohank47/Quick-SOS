import React, { createContext, useState, useEffect, useContext } from 'react';

// Mock types
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
    const [loading, setLoading] = useState(false);

    const signInWithGoogle = async () => {
        console.log('Google Sign-In not supported on Web in this demo.');
        alert('Google Sign-In requires native device or full Web setup.');
        // Simulate login for testing
        setUser({
            uid: 'web-test-user',
            email: 'test@example.com',
            displayName: 'Web Tester',
            photoURL: null,
        });
    };

    const signOut = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
