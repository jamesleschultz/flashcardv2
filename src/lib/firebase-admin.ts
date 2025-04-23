import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    console.log("Initializing Firebase Admin SDK...");
    if (!process.env.FIREBASE_ADMIN_SDK_JSON_BASE64) {
        throw new Error("FIREBASE_ADMIN_SDK_JSON_BASE64 env var is not set.");
    }
    const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_ADMIN_SDK_JSON_BASE64,
        'base64'
    ).toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK Initialized Successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.stack);
  }
}

export const firebaseAdminAuth = admin.auth();
export default admin;