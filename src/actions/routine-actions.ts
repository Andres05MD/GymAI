"use server";

import { z } from "zod";
import { RoutineSchema, RoutineDaySchema, RoutineExerciseSchema, RoutineSetSchema } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient } from "@/lib/ai";
import { getExercises } from "./exercise-actions";
import { unstable_cache, revalidatePath } from "next/cache";

// Schema for generating a routine with AI
const GenerateRoutineSchema = z.object({
    athleteId: z.string(),
    goal: z.string(), // "hypertrophy", "strength", etc.
    daysPerWeek: z.number().min(1).max(7),
    experienceLevel: z.string().optional(),
    injuries: z.array(z.string()).optional(),
    focus: z.string().optional(), // "upper body", "legs", etc. (optional input from coach)
});

type RoutineInput = z.infer<typeof RoutineSchema>;

// Get Routines (Coach sees all created by them, Athlete sees assigned ones)
export async function getRoutines() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        let snapshot;
        if (session.user.role === "coach") {
            snapshot = await adminDb.collection("routines").where("coachId", "==", session.user.id).get();
        } else {
            snapshot = await adminDb.collection("routines").where("athleteId", "==", session.user.id).where("active", "==", true).get();
        }

        const routines = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt,
        }));

        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Get Athlete's Active Routine (for Coach)
export async function getAthleteRoutine(athleteId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") return null;

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt,
        };
    } catch (error) {
        console.error("Error fetching athlete routine:", error);
        return null; // Return null instead of object error for simpler page handling
    }
}

// Get Coach's Routines (for assigning to athletes)
export async function getCoachRoutines() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("routines")
            .where("coachId", "==", session.user.id)
            .get();

        const routines = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt,
        }));

        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching coach routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Assign Routine to Athlete (creates a copy for the athlete)
export async function assignRoutineToAthlete(athleteId: string, routineId: string) {
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
        const batch = adminDb.batch();
        const oldRoutines = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .get();

        oldRoutines.forEach(doc => {
            batch.update(doc.ref, { active: false });
        });

        // 3. Create a COPY of the routine assigned to the athlete
        const templateData = routineSnap.data();
        const newRoutineRef = adminDb.collection("routines").doc();

        batch.set(newRoutineRef, {
            ...templateData,
            name: templateData?.name,
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

// Get Single Routine
export async function getRoutine(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docSnap = await adminDb.collection("routines").doc(id).get();
        if (!docSnap.exists) return { success: false, error: "Rutina no encontrada" };

        const data = docSnap.data();
        if (session.user.role === "athlete" && data?.athleteId !== session.user.id) {
            return { success: false, error: "No autorizado" };
        }
        if (session.user.role === "coach" && data?.coachId !== session.user.id) {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            routine: {
                id: docSnap.id,
                ...data,
                createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt instanceof Date ? data.createdAt.toISOString() : data?.createdAt),
                updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data?.updatedAt instanceof Date ? data.updatedAt.toISOString() : data?.updatedAt),
            }
        };
    } catch (error) {
        return { success: false, error: "Error al cargar rutina" };
    }
}

// Create Routine
export async function createRoutine(data: Partial<RoutineInput>) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "Solo coaches pueden crear rutinas" };
    }

    try {
        const newRoutine = {
            ...data,
            coachId: session.user.id,
            active: data.active ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection("routines").add(newRoutine);
        revalidatePath("/routines");
        revalidatePath("/dashboard");
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating routine:", error);
        return { success: false, error: "Error al crear rutina" };
    }
}

// Update Routine
export async function updateRoutine(id: string, data: Partial<RoutineInput>) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        await adminDb.collection("routines").doc(id).update({
            ...data,
            updatedAt: new Date(),
        });
        revalidatePath("/routines");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al actualizar" };
    }
}

// Delete Routine
export async function deleteRoutine(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        await adminDb.collection("routines").doc(id).delete();
        revalidatePath("/routines");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al eliminar" };
    }
}

// --- AI GENERATION ---

export async function generateRoutineWithAI(data: z.infer<typeof GenerateRoutineSchema>) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Obtener ejercicios disponibles de la biblioteca del coach
        const exercisesResult = await getExercises();
        const exercisesList = exercisesResult.exercises as Array<{
            id: string;
            name: string;
            muscleGroups: string[];
            createdAt: string;
            updatedAt: string;
        }> | undefined;

        const simplifiedExercises = exercisesList?.map(e => `${e.name} (${e.muscleGroups.join(", ")})`).join("; ");

        // 2. Prepare Prompt
        const prompt = `
            Actúa como un entrenador experto de hipertirofia y fuerza.
            Genera una rutina de entrenamiento completa en formato JSON para un atleta con el siguiente perfil:
            - Objetivo: ${data.goal}
            - Días disponibles: ${data.daysPerWeek}
            - Nivel: ${data.experienceLevel || "Intermedio"}
            - Lesiones/Limitaciones: ${data.injuries?.join(", ") || "Ninguna"}
            ${data.focus ? `- Enfoque especial: ${data.focus}` : ""}

            Usa PREFERENTEMENTE los siguientes ejercicios disponibles en mi biblioteca, pero puedes sugerir variantes comunes si faltan básicos:
            [${simplifiedExercises}]

            Tu respuesta DEBE ser un objeto JSON válido que siga esta estructura exacta (sin markdown, solo JSON):
            {
                "name": "Nombre creativo de la rutina",
                "description": "Breve explicación de la estrategia (periodización, intensidad, etc.)",
                "schedule": [
                    {
                        "name": "Día 1 - Pecho y Espalda",
                        "exercises": [
                            {
                                "exerciseName": "Press Banca",
                                "sets": [
                                    { "type": "warmup", "reps": "15", "rpeTarget": 5, "restSeconds": 60 },
                                    { "type": "working", "reps": "8-10", "rpeTarget": 8, "restSeconds": 120 }
                                ],
                                "notes": "Codos a 45 grados",
                                "order": 1
                            }
                        ]
                    }
                ]
            }
            Asegúrate de respetar las lesiones indicadas evitando ejercicios peligrosos para esas zonas.
        `;

        // 3. Call AI
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "La IA no generó respuesta" };

        const generatedRoutine = JSON.parse(content);

        return { success: true, routine: generatedRoutine };

    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "Error generando rutina con IA", details: error instanceof Error ? error.message : "Unknown" };
    }
}
