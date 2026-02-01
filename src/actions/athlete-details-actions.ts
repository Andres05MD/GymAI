"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getAthleteDetails(athleteId: string) {
    const session = await auth();
    // Validar que sea coach
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const userDoc = await adminDb.collection("users").doc(athleteId).get();
        if (!userDoc.exists) {
            return { success: false, error: "Atleta no encontrado" };
        }

        const userData = userDoc.data();

        // Obtener historial reciente
        const workoutsSnapshot = await adminDb.collection("workouts")
            .where("userId", "==", athleteId)
            .orderBy("completedAt", "desc")
            .limit(5)
            .get();

        const recentWorkouts = workoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt.toDate(),
        }));

        const athlete = {
            id: userDoc.id,
            ...userData,
            createdAt: userData?.createdAt?.toDate ? userData.createdAt.toDate() : null,
            recentWorkouts
        };

        return { success: true, athlete };

    } catch (error) {
        console.error("Error fetching athlete details:", error);
        return { success: false, error: "Error al cargar detalles del atleta" };
    }
}
