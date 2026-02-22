"use server";

import { z } from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Input schema for creating/updating exercises (excludes system fields)
const ExerciseInputSchema = ExerciseSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true
});

export type ExerciseInput = z.infer<typeof ExerciseInputSchema>;

export async function getExercises() {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb
            .collection("exercises")
            .get();

        if (snapshot.empty) {
            return { success: true, exercises: [] };
        }

        const exercises = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, exercises };
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return { success: false, error: "Error al cargar ejercicios" };
    }
}

export async function createExercise(data: ExerciseInput) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    const validation = ExerciseInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    try {
        const newExercise = {
            ...validation.data,
            coachId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection("exercises").add(newExercise);

        revalidatePath("/exercises");
        revalidatePath("/dashboard");

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating exercise:", error);
        return { success: false, error: "Error al crear ejercicio" };
    }
}

export async function updateExercise(id: string, data: ExerciseInput) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    const validation = ExerciseInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    try {
        const docRef = adminDb.collection("exercises").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Ejercicio no encontrado" };
        }

        if (docSnap.data()?.coachId !== session.user.id) {
            return { success: false, error: "No tienes permiso para editar este ejercicio" };
        }

        await docRef.update({
            ...validation.data,
            updatedAt: new Date(),
        });

        revalidatePath("/exercises");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error updating exercise:", error);
        return { success: false, error: "Error al actualizar ejercicio" };
    }
}

export async function deleteExercise(id: string) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const docRef = adminDb.collection("exercises").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Ejercicio no encontrado" };
        }

        if (docSnap.data()?.coachId !== session.user.id) {
            return { success: false, error: "No tienes permiso para eliminar este ejercicio" };
        }

        await docRef.delete();

        revalidatePath("/exercises");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error deleting exercise:", error);
        return { success: false, error: "Error al eliminar ejercicio" };
    }
}
export async function getExerciseNames(ids: string[]) {
    if (!ids || ids.length === 0) return { success: true, names: {} };

    try {
        const names: Record<string, string> = {};
        // Firestore 'in' query works up to 10-30 IDs usually.
        // If more, we'd need to chunk.
        const snapshot = await adminDb.collection("exercises")
            .where("__name__", "in", ids)
            .get();

        snapshot.docs.forEach(doc => {
            names[doc.id] = doc.data().name;
        });

        return { success: true, names };
    } catch (error) {
        console.error("Error fetching exercise names:", error);
        return { success: false, error: "Error al cargar nombres de ejercicios" };
    }
}
