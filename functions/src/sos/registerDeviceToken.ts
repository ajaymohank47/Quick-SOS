import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const registerDeviceToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'Token is required.');
    }

    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);

    await userRef.set(
        {
            deviceTokens: admin.firestore.FieldValue.arrayUnion(token),
        },
        { merge: true }
    );

    return { success: true };
});
