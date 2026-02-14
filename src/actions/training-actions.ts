"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TrainingLogSchema } from "@/lib/schemas";
import { unstable_cache, revalidateTag } from "next/cache";

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
export async function assignRoutineToAthlete(routineId: string, athleteId: string, startDate?: Date) {
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

        // 2. Deactivate previous routines
        const batch = adminDb.batch();
        const oldRoutines = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .get();

        oldRoutines.forEach(doc => {
            batch.update(doc.ref, { active: false });
        });

        // 3. Duplicate routine and link athlete to coach
        const templateData = routineSnap.data();
        const newRoutineRef = adminDb.collection("routines").doc();
        const userRef = adminDb.collection("users").doc(athleteId);
        const assignmentDate = startDate || new Date();

        batch.set(newRoutineRef, {
            ...templateData,
            name: `${templateData?.name} (Assigned)`,
            coachId: session.user.id,
            athleteId: athleteId,
            active: true,
            originalRoutineId: routineId,
            startDate: assignmentDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Update the athlete's doc to set the coachId if not already set or updated
        batch.update(userRef, { coachId: session.user.id });

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

    const targetId = userId || session.user.id;
    if (targetId !== session.user.id && session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        const logs = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

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
        if (data?.athleteId !== session.user.id && session.user.role !== "coach") {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            log: serializeFirestoreData({
                id: docSnap.id,
                ...data,
            })
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

        const routines = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

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
        const routineRef = adminDb.collection("routines").doc(routineId);
        const routineSnap = await routineRef.get();
        if (!routineSnap.exists) return { success: false, error: "Rutina no encontrada" };

        const routineData = routineSnap.data();
        const schedule = routineData?.schedule || [];
        const firstDay = schedule[0] || { name: "Día 1", exercises: [] };

        const workoutRef = await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            routineId: routineId,
            routineName: routineData?.name || "Rutina",
            dayName: firstDay.name,
            exercises: firstDay.exercises.map((ex: RoutineExercise) => ({
                ...ex,
                sets: ex.sets.map((set: RoutineSet) => ({
                    ...set,
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
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, history };
    } catch (error) {
        console.error("Error fetching history:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

// Log a single set
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
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("sessionId", "==", sessionId)
            .where("athleteId", "==", session.user.id)
            .get();

        const sets = setsSnapshot.docs.map(doc => doc.data());
        const calculatedVolume = sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
        const actualSets = sets.length;

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

export async function getLastSessionExerciseData(exerciseId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Obtener historial reciente
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("exerciseId", "==", exerciseId)
            .where("athleteId", "==", session.user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (setsSnapshot.empty) return { success: true, sets: [] };

        const sets: any[] = setsSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() }));

        // La última sesión es la del primer set devuelto (están ordenados por fecha desc)
        const lastSessionId = sets[0].sessionId;

        // Filtrar solo los sets de esa última sesión
        // Invertimos el orden para que coincida con Set 1, Set 2, Set 3... (cronológico dentro de la sesión)
        // Aunque createdAt desc significa que el último set hecho aparece primero. 
        // Normalmente queremos mostrarlos en orden de ejecución (ascendente).
        const lastSessionSets = sets
            .filter((s: any) => s.sessionId === lastSessionId)
            .sort((a: any, b: any) => a.timestamp - b.timestamp); // Ordenar cronólogicamente

        return { success: true, sets: lastSessionSets };
    } catch (error) {
        console.error("Error fetching last session data:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}

export async function getProgressionSuggestion(exerciseId: string): Promise<{ success: boolean; suggestion?: ProgressionSuggestion; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("exerciseId", "==", exerciseId)
            .where("athleteId", "==", session.user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (setsSnapshot.empty) return { success: true, suggestion: undefined };

        const sets: any[] = setsSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() }));
        const lastSessionId = sets[0].sessionId;
        const lastSessionSets = sets.filter((s: any) => s.sessionId === lastSessionId);

        if (lastSessionSets.length === 0) return { success: true };

        lastSessionSets.sort((a: any, b: any) => {
            if (b.weight !== a.weight) return b.weight - a.weight;
            return b.reps - a.reps;
        });

        const topSet = lastSessionSets[0];
        const { weight, reps, rpe, createdAt } = topSet;

        let suggestedWeight = weight;
        let reason = "Mantenimiento";
        const RPE_THRESHOLD_LOW = 7;
        const RPE_THRESHOLD_HIGH = 9;

        if (rpe <= RPE_THRESHOLD_LOW) {
            suggestedWeight = weight + 2.5;
            reason = `RPE bajo (${rpe}) en última sesión. ¡Sube la carga!`;
        } else if (rpe > RPE_THRESHOLD_HIGH) {
            suggestedWeight = weight;
            reason = `RPE alto (${rpe}). Consolida este peso.`;
        } else {
            suggestedWeight = weight;
            reason = `Zona de buen esfuerzo. Intenta superar las repeticiones.`;
        }

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

// --- REGISTRO RETROACTIVO ---

// Schema de validación para entrenamiento retroactivo
const RetroactiveSetSchema = z.object({
    weight: z.coerce.number().min(0, "El peso no puede ser negativo"),
    reps: z.coerce.number().min(0, "Las reps no pueden ser negativas"),
    rpe: z.coerce.number().min(1).max(10).optional(),
    completed: z.boolean().default(true),
});

const RetroactiveExerciseSchema = z.object({
    exerciseId: z.string().optional(),
    exerciseName: z.string().min(1, "El nombre del ejercicio es obligatorio"),
    feedback: z.string().optional(),
    sets: z.array(RetroactiveSetSchema).min(1, "Se requiere al menos una serie"),
});

const RetroactiveWorkoutSchema = z.object({
    routineId: z.string().optional(),
    routineName: z.string().optional(),
    dayId: z.string().optional(),
    date: z.string().min(1, "La fecha es obligatoria"),
    durationMinutes: z.coerce.number().min(1, "La duración debe ser al menos 1 minuto"),
    sessionRpe: z.coerce.number().min(1).max(10),
    sessionNotes: z.string().optional(),
    exercises: z.array(RetroactiveExerciseSchema).min(1, "Se requiere al menos un ejercicio"),
});

export type RetroactiveWorkoutData = z.infer<typeof RetroactiveWorkoutSchema>;

export async function logRetroactiveWorkout(data: RetroactiveWorkoutData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const validation = RetroactiveWorkoutSchema.safeParse(data);
    if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || "Datos inválidos";
        return { success: false, error: firstError };
    }

    const validated = validation.data;

    try {
        const workoutDate = new Date(validated.date);

        // Guardar el log de entrenamiento
        await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            routineId: validated.routineId || null,
            dayId: validated.dayId || null,
            routineName: validated.routineName || "Registro Manual",
            date: workoutDate,
            durationMinutes: validated.durationMinutes,
            sessionRpe: validated.sessionRpe,
            sessionNotes: validated.sessionNotes || "",
            status: "completed",
            isRetroactive: true, // Marca para distinguir de sesiones en tiempo real
            startTime: workoutDate,
            endTime: new Date(workoutDate.getTime() + validated.durationMinutes * 60000),
            exercises: validated.exercises.map(ex => ({
                exerciseId: ex.exerciseId || "",
                exerciseName: ex.exerciseName,
                feedback: ex.feedback || "",
                sets: ex.sets.map(s => ({
                    weight: s.weight,
                    reps: s.reps,
                    rpe: s.rpe || undefined,
                    completed: s.completed,
                })),
            })),
            createdAt: new Date(),
        });

        // También guardar sets individuales para que funcione el historial de progresión
        const sessionId = `retro_${Date.now()}_${session.user.id.slice(0, 6)}`;
        const batch = adminDb.batch();

        for (const exercise of validated.exercises) {
            for (const set of exercise.sets) {
                if (set.weight > 0 || set.reps > 0) {
                    const setRef = adminDb.collection("workout_sets").doc();
                    batch.set(setRef, {
                        exerciseId: exercise.exerciseId || "",
                        exerciseName: exercise.exerciseName,
                        weight: set.weight,
                        reps: set.reps,
                        rpe: set.rpe || null,
                        sessionId,
                        athleteId: session.user.id,
                        timestamp: workoutDate.getTime(),
                        createdAt: workoutDate,
                    });
                }
            }
        }

        await batch.commit();

        // Invalidar cache de historial
        revalidateTag("training-logs", "default");

        return { success: true };
    } catch (error) {
        console.error("Error al registrar entrenamiento retroactivo:", error);
        return { success: false, error: "Error al guardar el entrenamiento" };
    }
}
