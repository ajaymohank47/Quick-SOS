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
exports.endSOS = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const fcm = admin.messaging();
exports.endSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { sosId } = data;
    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();
    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS session not found.');
    }
    const sosData = sosDoc.data();
    if ((sosData === null || sosData === void 0 ? void 0 : sosData.userUid) !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You can only end your own SOS session.');
    }
    await sosRef.update({
        status: 'ended',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Notify contacts that SOS has ended
    const contacts = sosData.contactsNotified || [];
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
                title: `SOS Ended`,
                body: `${sosData.userName} is safe now.`,
            },
            data: {
                sosId,
                type: 'SOS_ENDED',
            },
        };
        await fcm.sendToDevice(tokens, payload);
    }
    return { success: true };
});
//# sourceMappingURL=endSOS.js.map