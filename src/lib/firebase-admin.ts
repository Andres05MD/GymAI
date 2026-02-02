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
        const cleanedKey = key.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
        const serviceAccount = JSON.parse(cleanedKey);

        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        console.log(">>> [Firebase Admin] ✅ Credenciales cargadas para:", serviceAccount.project_id);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    } catch (error: any) {
        console.error(">>> [Firebase Admin] ❌ Error parseando clave ADM:", error.message);
        return admin.initializeApp({ projectId });
    }
};

const app = getAdminApp();
export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export { app };
