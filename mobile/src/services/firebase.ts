import app from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';

// Initialize Firebase if not already initialized
// @react-native-firebase/app automatically initializes the default app 
// from google-services.json / GoogleService-Info.plist

export const firebaseAuth = auth();
export const firebaseDb = firestore();
export const firebaseFunctions = functions();
export const firebaseMessaging = messaging();
export const firebaseStorage = storage();

export const arrayUnion = firestore.FieldValue.arrayUnion;
export const serverTimestamp = firestore.FieldValue.serverTimestamp;

// Use emulator if in development (optional, can be toggled)
if (__DEV__) {
    // Uncomment to use emulators
    // firebaseAuth.useEmulator('http://localhost:9099');
    // firebaseDb.useEmulator('localhost', 8080);
    // firebaseFunctions.useEmulator('localhost', 5001);
}
