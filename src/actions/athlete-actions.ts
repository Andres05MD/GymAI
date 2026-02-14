"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getActiveRoutine() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", session.user.id)
            .where("active", "==", true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: false, error: "No tienes una rutina asignada" };
        }

        const doc = snapshot.docs[0];
        const routine = serializeFirestoreData({
            id: doc.id,
            ...doc.data(),
        });

        return { success: true, routine };
    } catch (error) {
        console.error("Error fetching active routine:", error);
        return { success: false, error: "Error al cargar rutina" };
    }
}
