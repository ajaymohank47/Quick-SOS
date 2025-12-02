import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export * from './sos/getUploadSignature';
export * from './sos/createSOS';
export * from './sos/updateSOS';
export * from './sos/endSOS';
export * from './sos/registerDeviceToken';
export * from './sos/cleanupOldSOS';
export * from './sos/updateSOSLocation';
