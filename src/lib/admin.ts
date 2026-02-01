import "server-only";
import admin from "firebase-admin";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    } else {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found or invalid. Falling back to default application credentials (ADC). This may fail if not running in a Google Cloud environment.");
        try {
            admin.initializeApp();
        } catch (e) {
            console.error("Firebase Admin failed to initialize:", e);
        }
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
