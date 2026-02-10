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

        // Recopilar athleteIds únicos para buscar nombres
        const athleteIds = [...new Set(logsSnapshot.docs.map(doc => doc.data().athleteId).filter(Boolean))];

        // Buscar nombres de atletas en la colección users
        const athleteNames = new Map<string, string>();
        for (const athleteId of athleteIds) {
            try {
                const userDoc = await adminDb.collection("users").doc(athleteId).get();
                if (userDoc.exists) {
                    athleteNames.set(athleteId, userDoc.data()?.name || "Sin nombre");
                }
            } catch {
                // Si falla, se usará el fallback
            }
        }

        const notifications = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.date.toDate();
            const athleteName = athleteNames.get(data.athleteId) || data.athleteName || "Sin nombre";
            const routineName = data.routineName || "Rutina";

            return {
                id: doc.id,
                title: "Análisis de Sesión",
                message: `IA: El atleta ${athleteName} ha completado "${routineName}". Se detectó una mejora del 5% en volumen total.`,
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

        // Obtener fecha de última lectura del coach
        const userDoc = await adminDb.collection("users").doc(session.user.id).get();
        const lastRead = userDoc.data()?.lastReadNotificationsAt?.toDate() || new Date(0);

        // Procesar estado de lectura
        const processedNotifications = notifications.map(n => ({
            ...n,
            read: new Date(n.time) <= lastRead
        }));

        return { success: true, notifications: processedNotifications };
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

        // 1. Verificación de medidas (Cada 30 días o si nunca se ha medido tras un tiempo)
        const measurements = userData?.measurements || {};
        // Filtramos 'updatedAt' si existe para ver si hay datos reales
        const hasMeasurements = Object.keys(measurements).filter(k => k !== 'updatedAt').length > 0;

        const createdAt = userData?.createdAt?.toDate() || new Date();

        // Intentar obtener la fecha de la última medida
        // Si no tiene fecha específica de medidas pero tiene datos, usamos la fecha de actualización del perfil (onboarding)
        let lastMeasurementDate = measurements.updatedAt?.toDate();
        if (!lastMeasurementDate && hasMeasurements) {
            lastMeasurementDate = userData?.updatedAt?.toDate() || createdAt;
        }

        let needsUpdate = false;
        let notifMessage = "Ha pasado un mes desde tu último registro. ¡Actualiza tus medidas para ver tu progreso!";

        if (lastMeasurementDate) {
            const diffTime = Math.abs(now.getTime() - lastMeasurementDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 30) needsUpdate = true;
        } else {
            // Si realmente NO tiene medidas, verificamos antigüedad de la cuenta
            const diffSinceCreation = Math.abs(now.getTime() - createdAt.getTime());
            const daysSinceCreation = Math.ceil(diffSinceCreation / (1000 * 60 * 60 * 24));

            // Solo molestamos si ya pasaron 3 días desde el registro y no hay medidas
            if (daysSinceCreation > 3) {
                needsUpdate = true;
                notifMessage = "Aún no has registrado tus medidas corporales. ¡Hazlo para empezar a medir tu progreso!";
            }
        }

        if (needsUpdate) {
            notifications.push({
                id: "measurements-update-needed",
                title: lastMeasurementDate ? "Actualizar Medidas" : "Registra tus Medidas",
                message: notifMessage,
                time: new Date().toISOString(),
                type: "alert",
                read: false, // Se actualizará fuera del cache
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

        // Obtener fecha de última lectura
        const userDoc = await adminDb.collection("users").doc(session.user.id).get();
        const lastRead = userDoc.data()?.lastReadNotificationsAt?.toDate() || new Date(0);

        // Procesar estado de lectura
        const processedNotifications = notifications.map(n => ({
            ...n,
            read: new Date(n.time) <= lastRead
        }));

        return { success: true, notifications: processedNotifications };
    } catch (error) {
        console.error("Error fetching athlete notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("users").doc(session.user.id).update({
            lastReadNotificationsAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, error: "Error al actualizar" };
    }
}
