import * as admin from "firebase-admin";

// Parsear la credencial desde el JSON completo en .env
let serviceAccount: admin.ServiceAccount | null = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
} catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
}

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } else {
        // Fallback para desarrollo local sin credenciales
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!projectId) {
            throw new Error(
                "Firebase Admin: No service account or project ID found. " +
                "Please set FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env"
            );
        }
        console.warn("Firebase Admin: No service account found. Using default credentials with projectId:", projectId);
        admin.initializeApp({
            projectId,
        });
    }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };

