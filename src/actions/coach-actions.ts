"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getAllAthletes() {
    const session = await auth();
    // Validar que sea coach (o admin)
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("users")
            .where("role", "==", "athlete") // o "user", dependiendo de cómo guardes el rol por defecto
            .get();

        const athletes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Serializar fechas si existen
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null,
        }));

        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching athletes:", error);
        return { success: false, error: "Error al cargar atletas" };
    }
}
