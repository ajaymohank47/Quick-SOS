import * as functions from 'firebase-functions';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Note: Secrets should be set via firebase functions:config:set cloudinary.key="KEY" cloudinary.secret="SECRET"
const cloudName = functions.config().cloudinary?.cloud_name || 'demo';
const apiKey = functions.config().cloudinary?.key || '123456789';
const apiSecret = functions.config().cloudinary?.secret || 'secret';

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

export const getUploadSignature = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp: timestamp,
            folder: 'sos_images',
        },
        apiSecret
    );

    return {
        signature,
        timestamp,
        cloudName,
        apiKey,
    };
});
