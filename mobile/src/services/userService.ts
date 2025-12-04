import { firebaseDb, arrayUnion, arrayRemove, serverTimestamp } from './firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface Contact {
    contactUid: string;
    name: string;
    email: string;
    addedAt: any;
}

export const userService = {
    async addContact(currentUserUid: string, contactEmail: string) {
        // 1. Find the user by email
        const usersRef = firebaseDb.collection('users');
        const snapshot = await usersRef.where('email', '==', contactEmail.toLowerCase()).limit(1).get();

        if (snapshot.empty) {
            throw new Error('User not found with this email.');
        }

        const contactDoc = snapshot.docs[0];
        const contactData = contactDoc.data();
        const contactUid = contactData.uid;

        if (contactUid === currentUserUid) {
            throw new Error('You cannot add yourself as a contact.');
        }

        // 2. Add to subcollection
        const contactRef = usersRef.doc(currentUserUid).collection('contacts').doc(contactUid);
        await contactRef.set({
            contactUid,
            name: contactData.name || 'Unknown',
            email: contactData.email,
            addedAt: serverTimestamp(),
        });

        // 3. Update main user document contacts array
        await usersRef.doc(currentUserUid).update({
            contacts: arrayUnion(contactUid)
        });

        return contactData;
    },

    async getContacts(currentUserUid: string): Promise<Contact[]> {
        const snapshot = await firebaseDb.collection('users').doc(currentUserUid).collection('contacts').get();
        return snapshot.docs.map(doc => doc.data() as Contact);
    },

    async removeContact(currentUserUid: string, contactUid: string) {
        await firebaseDb.collection('users').doc(currentUserUid).collection('contacts').doc(contactUid).delete();

        // Remove from array (requires reading and filtering, or arrayRemove if available)
        // Firestore arrayRemove is available
        await firebaseDb.collection('users').doc(currentUserUid).update({
            contacts: arrayRemove(contactUid)
        });
    }
};
