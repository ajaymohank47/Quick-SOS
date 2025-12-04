import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const fcm = admin.messaging();

export const endSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { sosId } = data;
    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();

    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS session not found.');
    }

    const sosData = sosDoc.data();
    if (sosData?.userUid !== context.auth.uid) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'You can only end your own SOS session.'
        );
    }

    await sosRef.update({
        status: 'ended',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify contacts that SOS has ended
    const contacts = sosData.contactsNotified || [];
    const tokens: string[] = [];

    for (const contactUid of contacts) {
        const contactDoc = await db.collection('users').doc(contactUid).get();
        const contactData = contactDoc.data();
        if (contactData?.deviceTokens) {
            tokens.push(...contactData.deviceTokens);
        }
    }

    if (tokens.length > 0) {
        const message = {
            notification: {
                title: `SOS Ended`,
                body: `${sosData.userName} is safe now.`,
            },
            data: {
                sosId,
                type: 'SOS_ENDED',
            },
            tokens: tokens,
        };
        await admin.messaging().sendMulticast(message);
    }

    return { success: true };
});
