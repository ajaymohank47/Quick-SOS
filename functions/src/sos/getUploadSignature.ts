import * as functions from 'firebase-functions';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || functions.config().cloudinary?.cloud_name;
const apiKey = process.env.CLOUDINARY_API_KEY || functions.config().cloudinary?.key;
const apiSecret = process.env.CLOUDINARY_API_SECRET || functions.config().cloudinary?.secret;

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
