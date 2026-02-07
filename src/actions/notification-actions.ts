"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// Caché para notificaciones del coach (revalida cada 2 minutos)
const getCachedCoachNotifications = unstable_cache(
    async () => {
        const logsSnapshot = await adminDb.collection("training_logs")
            .orderBy("date", "desc")
            .limit(5)
            .get();

        if (logsSnapshot.empty) {
            return [];
        }

        const notifications = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.date.toDate();

            return {
                id: doc.id,
                title: "Análisis de Sesión",
                message: `IA: El atleta ${data.athleteName || 'Anónimo'} ha completado su rutina. Se detectó una mejora del 5% en volumen total.`,
                time: date.toISOString(),
                type: "ia_analysis",
                read: false,
                athleteId: data.athleteId
            };
        });

        return notifications;
    },
    ["coach-notifications"],
    { revalidate: 120, tags: ["notifications", "coach-notifications"] }
);

export async function getCoachNotifications() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const notifications = await getCachedCoachNotifications();
        return { success: true, notifications };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}

// Caché para notificaciones del atleta (revalida cada 5 minutos)
const getCachedAthleteNotifications = unstable_cache(
    async (userId: string) => {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return [];

        const userData = userDoc.data();
        const notifications = [];
        const now = new Date();

        // 1. Verificación de medidas (Cada 30 días)
        const lastMeasurementDate = userData?.measurements?.updatedAt?.toDate();

        let needsUpdate = false;
        if (!userData?.measurements || !lastMeasurementDate) {
            needsUpdate = true;
        } else {
            const diffTime = Math.abs(now.getTime() - lastMeasurementDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 30) needsUpdate = true;
        }

        if (needsUpdate) {
            notifications.push({
                id: "measurements-update-needed",
                title: "Actualizar Medidas",
                message: "Ha pasado un mes desde tu último registro. ¡Actualiza tus medidas para ver tu progreso!",
                time: new Date().toISOString(),
                type: "alert",
                read: false,
                link: "/profile"
            });
        }

        return notifications;
    },
    ["athlete-notifications"],
    { revalidate: 300, tags: ["notifications", "athlete-notifications"] }
);

export async function getAthleteNotifications() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const notifications = await getCachedAthleteNotifications(session.user.id);
        return { success: true, notifications };
    } catch (error) {
        console.error("Error fetching athlete notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}
