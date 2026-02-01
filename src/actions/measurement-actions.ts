"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BodyMeasurementLogSchema } from "@/lib/schemas";

const MeasurementInput = BodyMeasurementLogSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    date: true // We can set this from existing date or use current
}).extend({
    date: z.string().optional() // Allow string date from form
});

export async function logBodyMeasurements(data: z.infer<typeof MeasurementInput>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const logData = {
            userId: session.user.id,
            date: data.date ? new Date(data.date) : new Date(),
            createdAt: new Date(),
            ...data
        };

        // Ensure date is a Date object for Firestore
        if (typeof logData.date === 'string') {
            logData.date = new Date(logData.date);
        }

        const docRef = await adminDb.collection("body_measurements").add(logData);

        // Also update the user's latest measurements in their profile for quick access
        await adminDb.collection("users").doc(session.user.id).update({
            measurements: {
                ...data,
                weight: data.weight,
                updatedAt: new Date()
            },
            weight: data.weight // Update main weight field too if present
        });

        revalidatePath("/profile");
        revalidatePath("/analytics");

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error logging measurements:", error);
        return { success: false, error: "Error al guardar medidas" };
    }
}

export async function getBodyMeasurementsHistory(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const targetId = userId || session.user.id;

    // Verify access if querying another user (must be coach)
    if (userId && userId !== session.user.id && session.user.role !== "coach") {
        return { success: false, error: "No autorizado para ver estos datos" };
    }

    try {
        const snapshot = await adminDb
            .collection("body_measurements")
            .where("userId", "==", targetId)
            .orderBy("date", "asc")
            .get();

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(), // Convert Firestore Timestamp to Date
            createdAt: doc.data().createdAt?.toDate()
        }));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching measurement history:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}
