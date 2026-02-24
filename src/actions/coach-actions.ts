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
            .where("role", "in", ["athlete", "advanced_athlete"])
            .orderBy("name", "asc")
            .limit(200)
            .get();

        const athletes = snapshot.docs
            .map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name || "Atleta",
                    email: d.email,
                    image: d.image || null,
                    role: d.role || "athlete", // Default to athlete if missing
                    onboardingCompleted: d.onboardingCompleted || false,
                    goal: d.goal || null,
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || null),
                };
            });

        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching athletes:", error);
        return { success: false, error: "Error al cargar atletas" };
    }
}
