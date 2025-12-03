import axios from 'axios';
import { firebaseFunctions } from './firebase';

// Helper to upload image to Cloudinary
export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    try {
        // 1. Get signature from Cloud Function
        const getSignature = firebaseFunctions.httpsCallable('getUploadSignature');
        const result = await getSignature();
        const signatureData = result.data as any;
        const { signature, timestamp, cloudName, apiKey } = signatureData;

        // 2. Prepare form data
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'upload.jpg',
        } as any);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', 'sos_images');

        // 3. Upload
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};
