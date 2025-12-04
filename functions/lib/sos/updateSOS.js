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
exports.updateSOS = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.updateSOS = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { sosId, location, imageRefs } = data;
    const sosRef = db.collection('sos').doc(sosId);
    const sosDoc = await sosRef.get();
    if (!sosDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'SOS session not found.');
    }
    const sosData = sosDoc.data();
    if ((sosData === null || sosData === void 0 ? void 0 : sosData.userUid) !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You can only update your own SOS session.');
    }
    if (sosData.status !== 'active') {
        throw new functions.https.HttpsError('failed-precondition', 'SOS session is not active.');
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
//# sourceMappingURL=updateSOS.js.map