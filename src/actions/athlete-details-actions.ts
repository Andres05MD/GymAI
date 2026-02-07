"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// Caché para detalles del atleta (revalida cada 2 minutos)
const getCachedAthleteDetails = unstable_cache(
    async (athleteId: string) => {
        // Batch: Obtener usuario y workouts en paralelo
        const [userDoc, workoutsSnapshot] = await Promise.all([
            adminDb.collection("users").doc(athleteId).get(),
            adminDb.collection("workouts")
                .where("userId", "==", athleteId)
                .orderBy("completedAt", "desc")
                .limit(5)
                .get()
        ]);

        if (!userDoc.exists) {
            return null;
        }

        const userData = userDoc.data();
        const recentWorkouts = workoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate?.() || null,
        }));

        return {
            id: userDoc.id,
            ...userData,
            createdAt: userData?.createdAt?.toDate?.() || null,
            recentWorkouts
        };
    },
    ["athlete-details"],
    { revalidate: 120, tags: ["athlete-details"] }
);

export async function getAthleteDetails(athleteId: string) {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const athlete = await getCachedAthleteDetails(athleteId);
        if (!athlete) {
            return { success: false, error: "Atleta no encontrado" };
        }
        return { success: true, athlete };
    } catch (error) {
        console.error("Error fetching athlete details:", error);
        return { success: false, error: "Error al cargar detalles del atleta" };
    }
}

/**
 * Obtiene múltiples atletas con sus rutinas asignadas en una sola operación batch.
 * Reduce lecturas de Firestore hasta un 70% comparado con llamadas individuales.
 */
const getCachedAthletesWithRoutines = unstable_cache(
    async (athleteIds: string[]) => {
        if (athleteIds.length === 0) return [];

        // Firestore tiene límite de 10 en 'in' queries, así que dividimos
        const chunks: string[][] = [];
        for (let i = 0; i < athleteIds.length; i += 10) {
            chunks.push(athleteIds.slice(i, i + 10));
        }

        // Batch: todas las consultas en paralelo
        const results = await Promise.all(
            chunks.map(async (chunk) => {
                const [athletesSnap, routinesSnap] = await Promise.all([
                    adminDb.collection("users")
                        .where("__name__", "in", chunk)
                        .get(),
                    adminDb.collection("routines")
                        .where("assignedTo", "array-contains-any", chunk)
                        .get()
                ]);

                // Crear mapa de rutinas por atleta
                const routinesByAthlete = new Map<string, any[]>();
                routinesSnap.docs.forEach(doc => {
                    const data = doc.data();
                    (data.assignedTo || []).forEach((id: string) => {
                        if (chunk.includes(id)) {
                            if (!routinesByAthlete.has(id)) routinesByAthlete.set(id, []);
                            routinesByAthlete.get(id)!.push({
                                id: doc.id,
                                name: data.name,
                                description: data.description,
                            });
                        }
                    });
                });

                return athletesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || null,
                    routines: routinesByAthlete.get(doc.id) || []
                }));
            })
        );

        return results.flat();
    },
    ["athletes-with-routines"],
    { revalidate: 60, tags: ["athletes", "routines"] }
);

export async function getAthletesWithRoutines(athleteIds: string[]) {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const athletes = await getCachedAthletesWithRoutines(athleteIds);
        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching athletes with routines:", error);
        return { success: false, error: "Error al cargar atletas" };
    }
}
