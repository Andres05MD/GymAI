import * as admin from "firebase-admin";

const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!key) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing in .env");
    }

    try {
        let cleanedKey = key.trim();
        // Remove enclosing single quotes
        if (cleanedKey.startsWith("'") && cleanedKey.endsWith("'")) {
            cleanedKey = cleanedKey.slice(1, -1);
        }
        // Remove enclosing double quotes
        else if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
            cleanedKey = cleanedKey.slice(1, -1);
        }

        // Try to parse
        const serviceAccount = JSON.parse(cleanedKey);

        // Fix private_key newlines if needed (Firebase expects \n, usually present as literal \\n string in JSON)
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        console.log(">>> [Firebase Admin] ✅ Credenciales cargadas para:", serviceAccount.project_id);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        console.error(">>> [Firebase Admin] ❌ CRITICAL ERROR parsing service account key:", errorMessage);
        // Do not fallback to unauthenticated app; throw to stop execution and force fix.
        throw new Error("Failed to initialize Firebase Admin: " + errorMessage);
    }
};

const app = getAdminApp();
export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export { app };

/**
 * Generic converter for Firestore Admin SDK
 */
export const createAdminConverter = <T extends admin.firestore.DocumentData>() => ({
    toFirestore(data: T): admin.firestore.DocumentData {
        return data;
    },
    fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot): T {
        return snapshot.data() as T;
    },
});

/**
 * Utility to serialize Firestore data (convert Timestamps to strings)
 */
export const serializeFirestoreData = (data: any): any => {
    if (!data) return data;

    // Handle Firestore Timestamp (admin and client have different structures but both usually have toDate)
    if (data && typeof data === "object" && (data.toDate || "_seconds" in data)) {
        try {
            const date = data.toDate ? data.toDate() : new Date(data._seconds * 1000);
            return date.toISOString();
        } catch (e) {
            return data;
        }
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => serializeFirestoreData(item));
    }

    // Handle Objects
    if (typeof data === "object" && data !== null) {
        const serialized: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            serialized[key] = serializeFirestoreData(value);
        }
        return serialized;
    }

    return data;
};
