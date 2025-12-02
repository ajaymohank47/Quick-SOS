import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const updateSOSLocation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { sosId, location } = data;

    if (!sosId || !location) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing sosId or location.');
    }

    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();

    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS alert not found.');
    }

    const sosData = sosDoc.data();
    if (sosData?.userUid !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You can only update your own SOS.');
    }

    if (sosData?.status !== 'active') {
        // Don't update if not active
        return { success: false, reason: 'SOS not active' };
    }

    const newHistoryPoint = {
        ts: new Date().toISOString(),
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
    };

    await sosRef.update({
        currentLocation: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
        },
        history: admin.firestore.FieldValue.arrayUnion(newHistoryPoint),
    });

    return { success: true };
});
