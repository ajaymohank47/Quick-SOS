import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const cleanupOldSOS = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const retentionDays = 30;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    const snapshot = await db
        .collection('sos')
        .where('startTime', '<', retentionDate)
        .get();

    if (snapshot.empty) {
        console.log('No old SOS records found.');
        return null;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} old SOS records.`);
    return null;
});
