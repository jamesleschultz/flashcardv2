// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// --- Check if already initialized ---
if (!admin.apps.length) { // Check the length of the apps array
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
  } catch (error) {
    console.error("Firebase Admin SDK Initialization Error:", error instanceof Error ? error.stack : error);
    // Decide how to handle init failure - maybe throw to prevent app start?
  }
} else {
   console.log("Firebase Admin SDK already initialized."); // Log if reusing
}

// Export the auth instance regardless of whether it was just initialized or already existed
export const firebaseAdminAuth = admin.auth();
export default admin; // Export default instance if needed