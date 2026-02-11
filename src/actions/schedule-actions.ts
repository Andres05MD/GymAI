"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface AssignmentInput {
    athleteId: string;
    routineId: string; // The Template Routine ID
    dayId: string; // The ID of the day within the routine
    date: string; // YYYY-MM-DD
}

interface BatchAssignmentInput {
    athleteId: string;
    routineId: string;
    startDate: string; // YYYY-MM-DD
    days: {
        dayId: string;
        date: string; // YYYY-MM-DD
    }[];
}

async function getRoutineCopyId(athleteId: string, originalRoutineId: string, coachId: string) {
    // Check if there is an active copy for this athlete derived from originalRoutineId
    const snapshot = await adminDb.collection("routines")
        .where("athleteId", "==", athleteId)
        .where("originalRoutineId", "==", originalRoutineId)
        .where("active", "==", true)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Capture the original routine to copy
    const originalSnap = await adminDb.collection("routines").doc(originalRoutineId).get();
    if (!originalSnap.exists) {
        throw new Error("Rutina original no encontrada");
    }
    const templateData = originalSnap.data();

    // Create new copy
    const newRoutineRef = adminDb.collection("routines").doc();
    await newRoutineRef.set({
        ...templateData,
        name: templateData?.name,
        coachId,
        athleteId,
        active: true,
        originalRoutineId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return newRoutineRef.id;
}

export async function checkAssignmentConflict(athleteId: string, date: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const snapshot = await adminDb.collection("users").doc(athleteId)
        .collection("assignments")
        .where("date", "==", date)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
            conflict: true,
            existingAssignment: {
                id: snapshot.docs[0].id,
                ...data
            }
        };
    }

    return { conflict: false };
}

export async function checkWeekConflicts(athleteId: string, dates: string[]) {
    // Helper to check multiple dates
    // Firestore 'in' query supports up to 10 items, but dates might be more suitable for individual checks or range if needed.
    // For a week (7 days), Promise.all is fine.

    const conflicts = [];

    for (const date of dates) {
        const res = await checkAssignmentConflict(athleteId, date);
        if (res.conflict) {
            conflicts.push({ date, ...res.existingAssignment });
        }
    }

    return {
        hasConflicts: conflicts.length > 0,
        conflicts
    };
}

export async function assignRoutineDay(data: AssignmentInput, confirmReplace: boolean = false) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Check Conflicts
        const conflictCheck = await checkAssignmentConflict(data.athleteId, data.date);

        if (conflictCheck.conflict && !confirmReplace) {
            return {
                success: false,
                requiresConfirmation: true,
                message: "Ya existe una rutina asignada para este día."
            };
        }

        // 2. Get or Create Routine Copy
        const routineCopyId = await getRoutineCopyId(data.athleteId, data.routineId, session.user.id);

        // 3. Create/Overwrite Assignment
        // Use date as doc ID to ensure uniqueness per day? 
        // Or generic ID? Using generic ID allows multiple workouts per day technically, 
        // but prompt implies checking constraints. Let's assume 1 per day for now for simplicity, 
        // or just use add() and let conflict check handle it.
        // If we want to replace, we should delete existing ones.

        const assignmentsRef = adminDb.collection("users").doc(data.athleteId).collection("assignments");

        if (conflictCheck.conflict && confirmReplace) {
            // Delete existing
            await assignmentsRef.doc(conflictCheck.existingAssignment!.id).delete();
        }

        // Fetch routine details for denormalization (optional, but good for calendar display)
        const routineSnap = await adminDb.collection("routines").doc(routineCopyId).get();
        const routineData = routineSnap.data();
        const dayName = routineData?.schedule?.find((d: any) => d.id === data.dayId)?.name || "Día de Rutina";

        await assignmentsRef.add({
            routineId: routineCopyId,
            originalRoutineId: data.routineId,
            dayId: data.dayId,
            date: data.date,
            routineName: routineData?.name,
            dayName: dayName,
            assignedBy: session.user.id,
            createdAt: new Date(),
        });

        revalidatePath(`/athletes/${data.athleteId}`);
        return { success: true };

    } catch (error) {
        console.error("Error assigning routine:", error);
        return { success: false, error: "Error al asignar rutina" };
    }
}

export async function assignRoutineWeek(data: BatchAssignmentInput, confirmReplace: boolean = false) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const dates = data.days.map(d => d.date);
        const conflictCheck = await checkWeekConflicts(data.athleteId, dates);

        if (conflictCheck.hasConflicts && !confirmReplace) {
            return {
                success: false,
                requiresConfirmation: true,
                message: `Existen rutinas asignadas en ${conflictCheck.conflicts.length} de los días seleccionados.`,
                conflicts: conflictCheck.conflicts
            };
        }

        const routineCopyId = await getRoutineCopyId(data.athleteId, data.routineId, session.user.id);
        const assignmentsRef = adminDb.collection("users").doc(data.athleteId).collection("assignments");
        const routineSnap = await adminDb.collection("routines").doc(routineCopyId).get();
        const routineData = routineSnap.data();

        const batch = adminDb.batch();

        // If replacing, delete conflicts
        if (conflictCheck.hasConflicts && confirmReplace) {
            for (const conflict of conflictCheck.conflicts) {
                batch.delete(assignmentsRef.doc(conflict.id!));
            }
        }

        // Add new assignments
        for (const day of data.days) {
            const dayName = routineData?.schedule?.find((d: any) => d.id === day.dayId)?.name || "Día de Rutina";
            const docRef = assignmentsRef.doc(); // Auto ID
            batch.set(docRef, {
                routineId: routineCopyId,
                originalRoutineId: data.routineId, // To track origin
                dayId: day.dayId,
                date: day.date,
                routineName: routineData?.name,
                dayName: dayName,
                assignedBy: session.user.id,
                createdAt: new Date(),
            });
        }

        await batch.commit();
        revalidatePath(`/athletes/${data.athleteId}`);
        return { success: true };

    } catch (error) {
        console.error("Error batch assigning:", error);
        return { success: false, error: "Error en asignación masiva" };
    }
}

export async function getAthleteAssignments(athleteId: string, start: string, end: string) {
    // Very basic query not strictly filtering by range if string comparison fails on edge cases, 
    // but ISO strings YYYY-MM-DD work well for lexicographical comparison.
    try {
        const snapshot = await adminDb.collection("users").doc(athleteId).collection("assignments")
            .where("date", ">=", start)
            .where("date", "<=", end)
            .get();

        const assignments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, assignments };
    } catch (error) {
        console.error("Error fetching assignments:", error);
        return { success: false, error: "Error al cargar calendario" };
    }
}

export async function getTodayAssignment(athleteId: string, date: string) {
    try {
        const snapshot = await adminDb.collection("users").doc(athleteId)
            .collection("assignments")
            .where("date", "==", date)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: true, assignment: null };
        }

        const doc = snapshot.docs[0];
        const assignment = {
            id: doc.id,
            ...doc.data()
        };

        return { success: true, assignment };
    } catch (error) {
        console.error("Error checking today assignment:", error);
        return { success: false, error: "Error verificando sesión de hoy" };
    }
}
