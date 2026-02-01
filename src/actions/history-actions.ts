"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getWorkoutHistory() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const workoutsSnapshot = await adminDb.collection("workouts")
            .where("userId", "==", session.user.id)
            .orderBy("completedAt", "desc")
            .limit(20)
            .get();

        const workouts = workoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir Timestamps a Date para serialización
            completedAt: doc.data().completedAt.toDate(),
        }));

        return { success: true, workouts };
    } catch (error) {
        console.error("Error fetching history:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}

export async function getMonthlyStats() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const snapshot = await adminDb.collection("workouts")
            .where("userId", "==", session.user.id)
            .where("completedAt", ">=", firstDay)
            .get();

        let totalSessions = 0;
        let totalDuration = 0;
        let totalVolume = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalSessions++;
            totalDuration += data.durationSeconds || 0;
            totalVolume += data.totalVolume || 0;
        });

        // Formato duración (horas)
        const durationHours = Math.round(totalDuration / 3600 * 10) / 10;

        return {
            success: true,
            stats: {
                totalSessions,
                durationHours,
                totalVolume
            }
        };

    } catch (error) {
        console.error(error);
        return { success: false };
    }
}
