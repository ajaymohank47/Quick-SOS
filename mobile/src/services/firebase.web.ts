import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import 'firebase/compat/messaging';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD56bfxpgkdxQSmwlH6I5cBzE9t_zMecy0",
    authDomain: "quick-sos-97d28.firebaseapp.com",
    projectId: "quick-sos-97d28",
    storageBucket: "quick-sos-97d28.firebasestorage.app",
    messagingSenderId: "323011466008",
    appId: "1:323011466008:web:f1e442cd571f82ba07446d",
    measurementId: "G-4PW7B876E2"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const firebaseAuth = firebase.auth();
export const firebaseDb = firebase.firestore();
export const firebaseFunctions = firebase.functions();
export const firebaseMessaging = firebase.messaging();
export const firebaseStorage = firebase.storage();

export const arrayUnion = firebase.firestore.FieldValue.arrayUnion;
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
