import * as admin from "firebase-admin";

const getAdminApp = () => {
    const projectId = "gymia-b5f4e";

    if (admin.apps.length > 0) {
        const app = admin.app();
        if (app.options.projectId === projectId) {
            return app;
        }
        app.delete();
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
 * REGLA .cursorrules: Firestore Converter para Server SDK (admin)
 */
export const createAdminConverter = <T extends Record<string, any>>() => ({
    toFirestore: (data: T): admin.firestore.DocumentData => {
        // Eliminar undefined para que Firestore no proteste
        const clean: any = {};
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) clean[key] = value;
        });
        return clean;
    },
    fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): T => {
        const data = snapshot.data();
        return {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as unknown as T;
    }
});
