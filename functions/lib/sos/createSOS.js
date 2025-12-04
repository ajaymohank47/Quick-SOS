"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSOS = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const fcm = admin.messaging();
exports.createSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { currentLocation, imageRefs, audioRef } = data;
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userDoc.data();
    const contacts = (userData === null || userData === void 0 ? void 0 : userData.contacts) || [];
    const userName = (userData === null || userData === void 0 ? void 0 : userData.name) || 'Someone';
    const sosRef = db.collection('sos').doc();
    const sosId = sosRef.id;
    const sosData = {
        sosId,
        userUid: uid,
        userName,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        currentLocation,
        imageRefs: imageRefs || [],
        audioRef: audioRef || null,
        history: [
            {
                ts: new Date().toISOString(),
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                imageRefs: imageRefs || [],
                audioRef: audioRef || null,
            },
        ],
        contactsNotified: contacts,
    };
    await sosRef.set(sosData);
    // Send Notifications to Contacts
    const tokens = [];
    for (const contactUid of contacts) {
        const contactDoc = await db.collection('users').doc(contactUid).get();
        const contactData = contactDoc.data();
        if (contactData === null || contactData === void 0 ? void 0 : contactData.deviceTokens) {
            tokens.push(...contactData.deviceTokens);
        }
    }
    if (tokens.length > 0) {
        const payload = {
            notification: {
                title: `SOS from ${userName}`,
                body: 'Tap to view live location',
            },
            data: {
                sosId,
                type: 'SOS_ALERT',
            },
        };
        await fcm.sendToDevice(tokens, payload);
    }
    return { sosId };
});
//# sourceMappingURL=createSOS.js.map