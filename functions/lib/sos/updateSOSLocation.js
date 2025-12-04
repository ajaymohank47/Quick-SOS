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
exports.updateSOSLocation = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.updateSOSLocation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
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
    if ((sosData === null || sosData === void 0 ? void 0 : sosData.userUid) !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You can only update your own SOS.');
    }
    if ((sosData === null || sosData === void 0 ? void 0 : sosData.status) !== 'active') {
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
//# sourceMappingURL=updateSOSLocation.js.map