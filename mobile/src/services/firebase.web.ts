// Web compatible firebase mock/implementation
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

// In-memory mock database state
const mockDBState: any = {
    users: {
        'web-test-user': {
            uid: 'web-test-user',
            name: 'Web Tester',
            email: 'test@example.com',
            contacts: []
        },
        'contact-1': {
            uid: 'contact-1',
            name: 'Mom',
            email: 'mom@example.com'
        },
        'contact-2': {
            uid: 'contact-2',
            name: 'Dad',
            email: 'dad@example.com'
        }
    },
    sos: {
        'mock-sos-1': {
            uid: 'mock-sos-1',
            userName: 'Mom',
            startTime: new Date().toISOString(),
            status: 'active',
            contactsNotified: ['web-test-user'],
            currentLocation: { lat: 37.78825, lng: -122.4324 },
            imageRefs: ['https://via.placeholder.com/150']
        }
    }
};

const mockAuth = {
    onAuthStateChanged: (cb: any) => {
        // Simulate logged in user
        cb({
            uid: 'web-test-user',
            email: 'test@example.com',
            displayName: 'Web Tester',
            photoURL: null
        });
        return () => { };
    },
    signInWithCredential: async () => { },
    signOut: async () => { },
    currentUser: {
        uid: 'web-test-user',
        email: 'test@example.com',
        displayName: 'Web Tester',
        photoURL: null
    },
};

const createMockCollection = (collectionName: string) => {
    const getDocs = () => {
        const collection = mockDBState[collectionName] || {};
        return Object.values(collection).map((d: any) => ({ id: d.uid, data: () => d }));
    };

    const applyFilters = (docs: any[], filters: any[]) => {
        return docs.filter(doc => {
            const data = doc.data();
            return filters.every(f => {
                if (f.op === '==') return data[f.field] === f.value;
                if (f.op === 'array-contains') return Array.isArray(data[f.field]) && data[f.field].includes(f.value);
                return true;
            });
        });
    };

    const createQuery = (filters: any[] = []) => ({
        where: (field: string, op: string, value: string) => createQuery([...filters, { field, op, value }]),
        get: async () => {
            const docs = getDocs();
            const filtered = applyFilters(docs, filters);
            return {
                empty: filtered.length === 0,
                docs: filtered
            };
        },
        onSnapshot: (cb: any) => {
            const notify = () => {
                const docs = getDocs();
                const filtered = applyFilters(docs, filters);
                cb({
                    docs: filtered,
                    empty: filtered.length === 0
                });
            };

            notify(); // Initial call
            const interval = setInterval(notify, 1000); // Polling
            return () => clearInterval(interval);
        }
    });

    return {
        doc: (docId: string) => ({
            onSnapshot: (cb: any) => {
                const notify = () => {
                    const data = mockDBState[collectionName]?.[docId];
                    cb({ exists: !!data, data: () => data, id: docId });
                };
                notify();
                const interval = setInterval(notify, 1000);
                return () => clearInterval(interval);
            },
            get: async () => {
                const data = mockDBState[collectionName]?.[docId];
                return { exists: !!data, data: () => data, id: docId };
            },
            set: async (newData: any) => {
                if (!mockDBState[collectionName]) mockDBState[collectionName] = {};
                mockDBState[collectionName][docId] = { ...newData, uid: docId };
            },
            update: async (newData: any) => {
                const current = mockDBState[collectionName]?.[docId] || {};
                if (newData.contacts && Array.isArray(newData.contacts) && newData.contacts[0] === '___ARRAY_UNION___') {
                    const newContacts = [...(current.contacts || [])];
                    const toAdd = newData.contacts.slice(1);
                    toAdd.forEach((c: any) => {
                        if (!newContacts.includes(c)) newContacts.push(c);
                    });
                    current.contacts = newContacts;
                } else {
                    Object.assign(current, newData);
                }
                mockDBState[collectionName][docId] = current;
            },
        }),
        ...createQuery()
    };
};

const mockDb = {
    collection: (collectionName: string) => createMockCollection(collectionName),
};

const mockFunctions = {
    httpsCallable: (name: string) => async (data: any) => {
        console.log(`[Web Mock] Function ${name} called with`, data);
        return { data: { sosId: 'mock-sos-id', signature: 'mock-sig' } };
    },
};

const mockMessaging = {
    getToken: async () => 'mock-web-token',
    onMessage: () => { },
};

const mockStorage = {};

export const firebaseAuth = mockAuth as any;
export const firebaseDb = mockDb as any;
export const firebaseFunctions = mockFunctions as any;
export const firebaseMessaging = mockMessaging as any;
export const firebaseStorage = mockStorage as any;

export const arrayUnion = (...args: any[]) => ['___ARRAY_UNION___', ...args];
export const serverTimestamp = () => new Date().toISOString();
