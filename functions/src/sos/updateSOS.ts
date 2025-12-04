import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();


export const updateSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { sosId, location, images, batteryLevel } = data;
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
        images: images ? admin.firestore.FieldValue.arrayUnion(...images) : sosData.images,
        batteryLevel: batteryLevel || sosData.batteryLevel,
        history: admin.firestore.FieldValue.arrayUnion({
            ts: new Date().toISOString(),
            location: location,
            images: images || [],
            batteryLevel: batteryLevel || null,
        }),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify contacts about update (optional, maybe silent or less frequent)
    // For now, let's just update the data. The app can listen to Firestore changes.

    return { success: true };
});
