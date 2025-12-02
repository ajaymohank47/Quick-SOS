# SOS Emergency App - Setup Guide

## Prerequisites
- Node.js (v18+)
- Expo CLI
- Firebase Project (Blaze Plan required for Cloud Functions)
- Cloudinary Account
- Android Studio / Xcode (for development builds)

## Backend Setup (Firebase Cloud Functions)

1. **Navigate to functions directory:**
   ```bash
   cd functions
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Set the Cloudinary credentials in Firebase config:
   ```bash
   firebase functions:config:set cloudinary.cloud_name="YOUR_CLOUD_NAME" cloudinary.key="YOUR_API_KEY" cloudinary.secret="YOUR_API_SECRET"
   ```

4. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

5. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Mobile App Setup

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npx expo install
   ```

3. **Configure Firebase:**
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from Firebase Console.
   - Place them in `mobile/` root directory.
   - Update `app.json` to include these files in `android.googleServicesFile` and `ios.googleServicesFile`.

4. **Run Development Build:**
   Since this app uses native modules (Camera, Location, Background Tasks), you must use a development build (CNG).
   
   **Android:**
   ```bash
   npx expo run:android
   ```
   
   **iOS:**
   ```bash
   npx expo run:ios
   ```

## Testing

1. **Authentication:**
   - Launch app.
   - Sign in with Google (requires SHA-1 setup in Firebase).

2. **SOS Trigger:**
   - Press the big SOS button.
   - Grant permissions.
   - Verify that "SOS Active" screen appears.
   - Check Firestore `sos` collection for new record.
   - Check Cloudinary for uploaded images (simulated in code if camera not available).

3. **Background Updates:**
   - Minimize the app.
   - Simulate location change.
   - Verify Firestore `sos` record updates.

4. **End SOS:**
   - Open app.
   - Press "End SOS".
   - Verify status changes to "ended".

## Troubleshooting

- **Camera/Location Permissions:** Ensure you grant "Always Allow" for location if possible, or "While Using". Background location requires "Always" on iOS for best results, or "While Using" with blue bar.
- **Push Notifications:** Must use a physical device. Simulators cannot receive standard push notifications easily without specific setup.
