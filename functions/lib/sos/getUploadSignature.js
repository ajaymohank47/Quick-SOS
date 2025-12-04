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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadSignature = void 0;
const functions = __importStar(require("firebase-functions"));
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
// Note: Secrets should be set via firebase functions:config:set cloudinary.key="KEY" cloudinary.secret="SECRET"
const cloudName = ((_a = functions.config().cloudinary) === null || _a === void 0 ? void 0 : _a.cloud_name) || 'demo';
const apiKey = ((_b = functions.config().cloudinary) === null || _b === void 0 ? void 0 : _b.key) || '123456789';
const apiSecret = ((_c = functions.config().cloudinary) === null || _c === void 0 ? void 0 : _c.secret) || 'secret';
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});
exports.getUploadSignature = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary_1.v2.utils.api_sign_request({
        timestamp: timestamp,
        folder: 'sos_images',
    }, apiSecret);
    return {
        signature,
        timestamp,
        cloudName,
        apiKey,
    };
});
//# sourceMappingURL=getUploadSignature.js.map