import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme, TextInput, IconButton, Text, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseDb, firebaseFunctions, serverTimestamp } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'SOSActive'>; // Reusing param list, but maybe separate route

const ChatScreen = ({ sosId }: { sosId: string }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!sosId) return;

        const unsubscribe = firebaseDb
            .collection('sos')
            .doc(sosId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(msgs);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });

        return () => unsubscribe();
    }, [sosId]);

    const sendMessage = async () => {
        if (!inputText.trim() || !user) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            // Optimistic update? Or just wait for listener.
            // Listener is fast enough usually.

            const sendMessageFn = firebaseFunctions.httpsCallable('sendMessage');
            await sendMessageFn({ sosId, message: text });

        } catch (error) {
            console.error("Failed to send message:", error);
            alert('Failed to send message.');
            setInputText(text); // Restore text
        }
        setSending(false);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.fromUid === user?.uid;
        return (
            <View style={[
                styles.messageContainer,
                isMe ? styles.myMessage : styles.theirMessage,
            ]}>
                {!isMe && (
                    <Text variant="labelSmall" style={{ marginBottom: 2, color: theme.colors.onSurfaceVariant }}>
                        {item.senderName || 'Contact'}
                    </Text>
                )}
                <Surface style={[
                    styles.bubble,
                    { backgroundColor: isMe ? theme.colors.primary : theme.colors.surfaceVariant }
                ]} elevation={1}>
                    <Text style={{ color: isMe ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                        {item.message}
                    </Text>
                </Surface>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                <TextInput
                    mode="outlined"
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    style={styles.input}
                    right={<TextInput.Icon icon="send" onPress={sendMessage} disabled={sending || !inputText.trim()} />}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 10,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    theirMessage: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    bubble: {
        padding: 10,
        borderRadius: 15,
        borderBottomRightRadius: 0, // for my message? logic needed
    },
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    input: {
        backgroundColor: 'transparent',
    },
});

export default ChatScreen;
