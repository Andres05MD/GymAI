"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getCoachNotifications() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // En una app real, esto vendría de una colección 'notifications'
        // Para este requerimiento, vamos a simular que la IA genera alertas
        // basándonos en los logs de entrenamiento recientes de los atletas.

        // 1. Obtener logs de entrenamiento recientes (últimos 24-48h o últimos 10 globales)
        const logsSnapshot = await adminDb.collection("training_logs")
            .orderBy("date", "desc")
            .limit(5)
            .get();

        if (logsSnapshot.empty) {
            return { success: true, notifications: [] };
        }

        // 2. Mapear logs a notificaciones simuladas de IA
        const notifications = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.date.toDate();

            // Lógica simple: si un atleta completó un entrenamiento, la IA "notifica" al coach
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

        return { success: true, notifications };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}
