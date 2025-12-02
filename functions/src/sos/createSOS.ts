import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const fcm = admin.messaging();

export const createSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { currentLocation, imageRefs } = data;
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }

    const userData = userDoc.data();
    const contacts = userData?.contacts || [];
    const userName = userData?.name || 'Someone';

    const sosRef = db.collection('sos').doc();
    const sosId = sosRef.id;

    const sosData = {
        sosId,
        userUid: uid,
        userName,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        currentLocation,
        imageRefs: imageRefs || [], // Array of Storage URLs
        history: [
            {
                ts: new Date().toISOString(),
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                imageRefs: imageRefs || [],
            },
        ],
        contactsNotified: contacts,
    };

    await sosRef.set(sosData);

    // Send Notifications to Contacts
    const tokens: string[] = [];
    for (const contactUid of contacts) {
        const contactDoc = await db.collection('users').doc(contactUid).get();
        const contactData = contactDoc.data();
        if (contactData?.deviceTokens) {
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
