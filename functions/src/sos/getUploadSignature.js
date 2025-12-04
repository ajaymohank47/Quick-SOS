"use strict";
var _a, _b, _c;
exports.__esModule = true;
exports.getUploadSignature = void 0;
var functions = require("firebase-functions");
var cloudinary_1 = require("cloudinary");
// Configure Cloudinary
// Note: Secrets should be set via firebase functions:config:set cloudinary.key="KEY" cloudinary.secret="SECRET"
var cloudName = ((_a = functions.config().cloudinary) === null || _a === void 0 ? void 0 : _a.cloud_name) || 'demo';
var apiKey = ((_b = functions.config().cloudinary) === null || _b === void 0 ? void 0 : _b.key) || '123456789';
var apiSecret = ((_c = functions.config().cloudinary) === null || _c === void 0 ? void 0 : _c.secret) || 'secret';
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});
exports.getUploadSignature = functions.https.onCall(function (data, context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    var timestamp = Math.round(new Date().getTime() / 1000);
    var signature = cloudinary_1.v2.utils.api_sign_request({
        timestamp: timestamp,
        folder: 'sos_images'
    }, apiSecret);
    return {
        signature: signature,
        timestamp: timestamp,
        cloudName: cloudName,
        apiKey: apiKey
    };
});
