import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { firebaseDb } from '../services/firebase';
import { userService } from '../services/userService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, List, Text, IconButton, useTheme, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface Contact {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
}

const ContactsScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const theme = useTheme();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = firebaseDb.collection('users').doc(user.uid).onSnapshot(async (doc: any) => {
            const data = doc.data();
            if (data && data.contacts) {
                // Fetch contact details
                const contactPromises = data.contacts.map(async (uid: string) => {
                    const userDoc = await firebaseDb.collection('users').doc(uid).get();
                    return { uid, ...userDoc.data() } as Contact;
                });
                const contactList = await Promise.all(contactPromises);
                setContacts(contactList);
            } else {
                setContacts([]);
            }
        });
        return unsubscribe;
    }, [user]);

    const addContact = async () => {
        const emailToSearch = searchEmail.trim();
        if (!emailToSearch || !user) return;

        // Check if already added
        if (contacts.some(c => c.email.toLowerCase() === emailToSearch.toLowerCase())) {
            Alert.alert('Contact exists', 'This user is already in your emergency contacts.');
            return;
        }

        setLoading(true);
        try {
            await userService.addContact(user.uid, emailToSearch);
            setSearchEmail('');
            Alert.alert('Success', 'Emergency contact added.');
        } catch (error: any) {
            console.error("Error adding contact:", error);
            Alert.alert('Error', error.message || 'Failed to add contact.');
        }
        setLoading(false);
    };

    const removeContact = async (contactUid: string) => {
        if (!user) return;
        Alert.alert(
            'Remove Contact',
            'Are you sure you want to remove this emergency contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userService.removeContact(user.uid, contactUid);
                        } catch (error) {
                            console.error("Error removing contact:", error);
                            Alert.alert('Error', 'Failed to remove contact.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                    <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Contacts</Text>
                </View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 15 }}>
                    People who will be notified when you activate SOS.
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    mode="outlined"
                    label="Contact Email"
                    placeholder="Enter email address"
                    value={searchEmail}
                    onChangeText={setSearchEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    right={<TextInput.Icon icon="account-plus" onPress={addContact} disabled={loading} />}
                    style={styles.input}
                />
            </View>

            <FlatList
                data={contacts}
                keyExtractor={(item) => item.uid}
                ItemSeparatorComponent={() => <Divider />}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name || 'Unknown'}
                        description={item.email}
                        left={props => <Avatar.Text {...props} size={40} label={item.name ? item.name[0].toUpperCase() : 'U'} />}
                        right={props => <IconButton {...props} icon="delete" onPress={() => removeContact(item.uid)} />}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: theme.colors.outline }}>No emergency contacts added yet.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
    },
    inputContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    input: {
        backgroundColor: 'transparent',
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
});

export default ContactsScreen;
