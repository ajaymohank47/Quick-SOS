import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const fcm = admin.messaging();

export const updateSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { sosId, location, imageRefs } = data;
    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();

    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS session not found.');
    }

    const sosData = sosDoc.data();
    if (sosData?.userUid !== context.auth.uid) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'You can only update your own SOS session.'
        );
    }

    if (sosData.status !== 'active') {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'SOS session is not active.'
        );
    }

    await sosRef.update({
        currentLocation: location,
        imageRefs: imageRefs ? admin.firestore.FieldValue.arrayUnion(...imageRefs) : sosData.imageRefs,
        history: admin.firestore.FieldValue.arrayUnion({
            ts: new Date().toISOString(),
            lat: location.lat,
            lng: location.lng,
            imageRefs: imageRefs || [],
        }),
    });

    // Notify contacts about update (optional, maybe silent or less frequent)
    // For now, let's just update the data. The app can listen to Firestore changes.

    return { success: true };
});
