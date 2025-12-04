"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.updateSOS = void 0;
var functions = require("firebase-functions");
var admin = require("firebase-admin");
var db = admin.firestore();
exports.updateSOS = functions.https.onCall(function (data, context) { return __awaiter(void 0, void 0, void 0, function () {
    var sosId, location, imageRefs, sosRef, sosDoc, sosData;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!context.auth) {
                    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
                }
                sosId = data.sosId, location = data.location, imageRefs = data.imageRefs;
                sosRef = db.collection('sos').doc(sosId);
                return [4 /*yield*/, sosRef.get()];
            case 1:
                sosDoc = _b.sent();
                if (!sosDoc.exists) {
                    throw new functions.https.HttpsError('not-found', 'SOS session not found.');
                }
                sosData = sosDoc.data();
                if ((sosData === null || sosData === void 0 ? void 0 : sosData.userUid) !== context.auth.uid) {
                    throw new functions.https.HttpsError('permission-denied', 'You can only update your own SOS session.');
                }
                if (sosData.status !== 'active') {
                    throw new functions.https.HttpsError('failed-precondition', 'SOS session is not active.');
                }
                return [4 /*yield*/, sosRef.update({
                        currentLocation: location,
                        imageRefs: imageRefs ? (_a = admin.firestore.FieldValue).arrayUnion.apply(_a, imageRefs) : sosData.imageRefs,
                        history: admin.firestore.FieldValue.arrayUnion({
                            ts: new Date().toISOString(),
                            lat: location.lat,
                            lng: location.lng,
                            imageRefs: imageRefs || []
                        })
                    })];
            case 2:
                _b.sent();
                // Notify contacts about update (optional, maybe silent or less frequent)
                // For now, let's just update the data. The app can listen to Firestore changes.
                return [2 /*return*/, { success: true }];
        }
    });
}); });
