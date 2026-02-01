"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TrainingLogSchema } from "@/lib/schemas";

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
export async function logWorkoutSession(data: any) {
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
