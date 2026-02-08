"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TrainingLogSchema } from "@/lib/schemas";
import { unstable_cache } from "next/cache";
import { revalidateCacheTags, CACHE_TAGS } from "./cache-actions";

// --- TIPOS LOCALES ---

export interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rest?: number;
    completed?: boolean;
}

export interface RoutineExercise {
    exerciseId?: string;
    exerciseName?: string;
    sets: RoutineSet[];
}

export interface WorkoutSessionData {
    routineId?: string;
    routineName?: string;
    exercises?: RoutineExercise[];
    notes?: string;
    sessionRpe?: number;
    sessionNotes?: string;
    durationMinutes?: number;
    dayId?: string;
}

export interface ProgressionSuggestion {
    exerciseId: string;
    suggestedWeight: number;
    reason: string;
    lastDate?: string;
    lastWeight?: number;
    lastReps?: number;
    lastRpe?: number;
}

// --- COACH ACTIONS ---

// Assign Routine to Athlete
export async function assignRoutineToAthlete(routineId: string, athleteId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Verify routine ownership
        const routineRef = adminDb.collection("routines").doc(routineId);
        const routineSnap = await routineRef.get();
        if (!routineSnap.exists || routineSnap.data()?.coachId !== session.user.id) {
            return { success: false, error: "Rutina no encontrada o sin permisos" };
        }

        // 2. Deactivate previous active routines for this athlete
        // (Assuming 1 active routine per athlete for simplicity, or we can just add a new one)
        const batch = adminDb.batch();
        const oldRoutines = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .get();

        oldRoutines.forEach(doc => {
            batch.update(doc.ref, { active: false });
        });

        // 3. Create a COPY of the routine assigned to the athlete
        // Better to copy so editing the template doesn't break the athlete's in-progress version immediately
        // OR we can just link it. For now, let's LINK it by updating the athleteId on the routine if it was a template
        // But if it's a template we want to reuse, we should duplicate.
        // Let's assume we DUPLICATE the template for the athlete to allow specific customization.

        const templateData = routineSnap.data();
        const newRoutineRef = adminDb.collection("routines").doc();

        batch.set(newRoutineRef, {
            ...templateData,
            name: `${templateData?.name} (Assigned)`,
            coachId: session.user.id,
            athleteId: athleteId,
            active: true,
            originalRoutineId: routineId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error assigning routine:", error);
        return { success: false, error: "Error al asignar rutina" };
    }
}


// --- ATHLETE ACTIONS ---

// Get Training Log History
export async function getTrainingLogs(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    // If requesting other user, check if coach
    const targetId = userId || session.user.id;
    if (targetId !== session.user.id && session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetId)
            .orderBy("date", "desc")
            .limit(20) // Increased limit for history
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate().toISOString(),
        }));

        return { success: true, logs };
    } catch (error) {
        console.error("Error fetching logs:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

// Log a Workout Session
export async function logWorkoutSession(data: WorkoutSessionData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Validate with rudimentary check or full Zod if strictly typed input
        // data.athleteId = session.user.id;

        await adminDb.collection("training_logs").add({
            ...data,
            athleteId: session.user.id,
            date: new Date(),
            createdAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error logging session:", error);
        return { success: false, error: "Error al guardar entrenamiento" };
    }
}

// Get a single Training Log by ID
export async function getTrainingLog(logId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("training_logs").doc(logId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Log no encontrado" };
        }

        const data = docSnap.data();
        // Check ownership or coach access
        if (data?.athleteId !== session.user.id && session.user.role !== "coach") {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            log: {
                id: docSnap.id,
                ...data,
                date: data?.date?.toDate?.()?.toISOString(),
                startTime: data?.startTime?.toDate?.()?.toISOString(),
                endTime: data?.endTime?.toDate?.()?.toISOString(),
            }
        };
    } catch (error) {
        console.error("Error fetching log:", error);
        return { success: false, error: "Error al cargar log" };
    }
}

// Complete a Workout Session
export async function completeWorkout(logId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("training_logs").doc(logId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Log no encontrado" };
        }

        const data = docSnap.data();
        if (data?.athleteId !== session.user.id) {
            return { success: false, error: "No autorizado" };
        }

        await docRef.update({
            status: "completed",
            endTime: new Date(),
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error completing workout:", error);
        return { success: false, error: "Error al completar entrenamiento" };
    }
}

// Get Routines Assigned to Athlete
export async function getAthleteRoutines() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", session.user.id)
            .where("active", "==", true)
            .get();

        const routines = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
        }));

        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching athlete routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Start a New Workout Session
export async function startWorkout(routineId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Get the routine
        const routineRef = adminDb.collection("routines").doc(routineId);
        const routineSnap = await routineRef.get();

        if (!routineSnap.exists) {
            return { success: false, error: "Rutina no encontrada" };
        }

        const routineData = routineSnap.data();

        // Verify access
        if (routineData?.athleteId !== session.user.id) {
            return { success: false, error: "No autorizado" };
        }

        // Get first day of schedule for default (or could ask user to select)
        const schedule = routineData?.schedule || [];
        const firstDay = schedule[0] || { name: "Día 1", exercises: [] };

        // Create workout log
        const workoutRef = await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            routineId: routineId,
            routineName: routineData?.name || "Rutina",
            dayName: firstDay.name,
            exercises: firstDay.exercises.map((ex: RoutineExercise) => ({
                ...ex,
                sets: ex.sets.map((set: RoutineSet) => ({
                    ...set,
                    actualWeight: null,
                    actualReps: null,
                    actualRPE: null,
                    completed: false
                }))
            })),
            status: "in_progress",
            startTime: new Date(),
            createdAt: new Date()
        });

        return { success: true, workoutId: workoutRef.id };
    } catch (error) {
        console.error("Error starting workout:", error);
        return { success: false, error: "Error al iniciar entrenamiento" };
    }
}

// Get Athlete Training History
export async function getAthleteHistory() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", session.user.id)
            .where("status", "==", "completed")
            .orderBy("endTime", "desc")
            .limit(50)
            .get();

        const history = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate?.()?.toISOString(),
                startTime: data.startTime?.toDate?.()?.toISOString(),
                endTime: data.endTime?.toDate?.()?.toISOString(),
            };
        });

        return { success: true, history };
    } catch (error) {
        console.error("Error fetching history:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

// Log a single set during a workout session
export async function logSet(data: {
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    rpe?: number;
    sessionId: string;
    timestamp: number;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("workout_sets").add({
            ...data,
            athleteId: session.user.id,
            createdAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error logging set:", error);
        return { success: false, error: "Error al guardar serie" };
    }
}

// Finish a workout session
export async function finishWorkoutSession(
    sessionId: string,
    durationSeconds: number,
    totalVolume: number,
    totalSets: number
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Get all sets for this session to calculate totals
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("sessionId", "==", sessionId)
            .where("athleteId", "==", session.user.id)
            .get();

        const sets = setsSnapshot.docs.map(doc => doc.data());

        // Calculate actual volume and sets
        const calculatedVolume = sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
        const actualSets = sets.length;

        // Create training log entry
        await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            sessionId: sessionId,
            durationMinutes: Math.round(durationSeconds / 60),
            totalVolume: calculatedVolume || totalVolume,
            totalSets: actualSets || totalSets,
            status: "completed",
            date: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
            exercises: sets.map(set => ({
                exerciseId: set.exerciseId,
                exerciseName: set.exerciseName,
                sets: [{ reps: set.reps, weight: set.weight, rpe: set.rpe }]
            }))
        });

        return { success: true };
    } catch (error) {
        console.error("Error finishing session:", error);
        return { success: false, error: "Error al finalizar entrenamiento" };
    }
}

// --- INTELLIGENT PROGRESSION ---

export async function getProgressionSuggestion(exerciseId: string): Promise<{ success: boolean; suggestion?: ProgressionSuggestion; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Obtener historial reciente de sets para este ejercicio
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("exerciseId", "==", exerciseId)
            .where("athleteId", "==", session.user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (setsSnapshot.empty) {
            return { success: true, suggestion: undefined };
        }

        // Agrupar sets por sesión para encontrar la "última sesión completa"
        const sets: any[] = setsSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() }));

        // Identificar ID de la última sesión
        const lastSessionId = sets[0].sessionId;

        // Filtrar sets de esa última sesión
        const lastSessionSets = sets.filter((s: any) => s.sessionId === lastSessionId);

        if (lastSessionSets.length === 0) return { success: true };

        // Encontrar el "Top Set" (Mejor rendimiento: Mayor peso, y a igualdad de peso, más reps)
        // Ordenar por Peso DESC, Reps DESC
        lastSessionSets.sort((a: any, b: any) => {
            if (b.weight !== a.weight) return b.weight - a.weight;
            return b.reps - a.reps;
        });

        const topSet = lastSessionSets[0];
        const { weight, reps, rpe, createdAt } = topSet;

        // Reglas de Sobrecarga Progresiva (Algoritmo Básico)
        let suggestedWeight = weight;
        let reason = "Mantenimiento";

        const RPE_THRESHOLD_LOW = 7;
        const RPE_THRESHOLD_HIGH = 9;

        if (rpe <= RPE_THRESHOLD_LOW) {
            // RPE Bajo: Fácil -> Subir Peso
            // Redondear a múltiplos de 2.5 (discos estándar)
            suggestedWeight = weight + 2.5;
            reason = `RPE bajo (${rpe}) en última sesión. ¡Sube la carga!`;
        } else if (rpe > RPE_THRESHOLD_HIGH) {
            // RPE Alto: Muy difícil -> Mantener o descargar si falló (pero no sabemos si falló, asumimos RPE 10 es límite)
            suggestedWeight = weight;
            reason = `RPE alto (${rpe}). Consolida este peso.`;
        } else {
            // RPE Normal (7-9): Zona óptima -> Intentar pequeña subida si se siente bien, o mantener.
            // Para ser conservadores, sugerimos mantener pero indicando que busque reps.
            suggestedWeight = weight;
            reason = `Zona de buen esfuerzo. Intenta superar las repeticiones.`;
        }

        // Si el peso es 0 (ej. peso corporal), no subir kg salvo que use lastre, pero mostramos mensaje.
        if (weight === 0) {
            reason = "Ejercicio de peso corporal. Intenta agregar reps o lastre.";
            suggestedWeight = 0;
        }

        return {
            success: true,
            suggestion: {
                exerciseId,
                suggestedWeight,
                reason,
                lastDate: createdAt.toISOString(),
                lastWeight: weight,
                lastReps: reps,
                lastRpe: rpe
            }
        };

    } catch (error) {
        console.error("Error calculating progression:", error);
        return { success: false, error: "Error al calcular progresión" };
    }
}
