import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const sendMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { sosId, message } = data;
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const senderName = userData?.name || 'Unknown';

    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();

    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS session not found.');
    }

    const sosData = sosDoc.data();
    // Verify participant (User or Contact)
    const isOwner = sosData?.userUid === uid;
    const isContact = sosData?.contactsNotified?.includes(uid); // Note: contactsNotified stores UIDs

    // If contacts are stored as objects in subcollection, we might need to check differently.
    // But createSOS stores `contactsNotified: contacts` (which is array of UIDs).
    // So this check is valid.

    if (!isOwner && !isContact) {
        // Allow if user is in the contacts list of the SOS owner? 
        // For now, strict check against notified contacts.
        throw new functions.https.HttpsError(
            'permission-denied',
            'You are not a participant of this SOS session.'
        );
    }

    // Add message to subcollection
    await sosRef.collection('messages').add({
        fromUid: uid,
        senderName,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify others
    // If sender is owner, notify contacts.
    // If sender is contact, notify owner.
    // Actually, notify everyone except sender.

    const recipients = [];
    if (isOwner) {
        recipients.push(...(sosData?.contactsNotified || []));
    } else {
        recipients.push(sosData?.userUid);
        // Also notify other contacts? Maybe not needed for MVP.
    }

    const tokens: string[] = [];
    for (const recipientUid of recipients) {
        if (recipientUid === uid) continue; // Skip self
        const doc = await db.collection('users').doc(recipientUid).get();
        const d = doc.data();
        if (d?.deviceTokens) {
            tokens.push(...d.deviceTokens);
        }
    }

    if (tokens.length > 0) {
        await admin.messaging().sendMulticast({
            notification: {
                title: `New Message from ${senderName}`,
                body: message,
            },
            data: {
                sosId,
                type: 'SOS_MESSAGE',
            },
            tokens,
        });
    }

    return { success: true };
});
