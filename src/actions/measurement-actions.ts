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

export async function logBodyMeasurements(data: z.infer<typeof MeasurementInput>, targetUserId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const userId = targetUserId || session.user.id;

    // Si un coach intenta guardar para un atleta, verificar permiso (opcional, por ahora confiamos en la UI)
    // Pero al menos usamos el userId correcto.

    try {
        // Fetch target user data (not necessarily the current user)
        const userSnapshot = await adminDb.collection("users").doc(userId).get();
        const userData = userSnapshot.data();
        const height = userData?.height; // cms
        const gender = userData?.gender || "male";

        // ... rest of the logic using userId ...

        // Calculate Body Fat if possible (US Navy Method)
        let calculatedBodyFat: number | undefined = undefined;

        if (height && data.waist && data.neck) {
            const h = height;
            const w = data.waist;
            const n = data.neck;

            if (gender === "male") {
                // BF = 86.010 * log10(abdomen - neck) - 70.041 * log10(height) + 36.76
                if (w - n > 0) {
                    calculatedBodyFat = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
                }
            } else if (gender === "female" && data.hips) {
                // BF = 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
                const hip = data.hips;
                if (w + hip - n > 0) {
                    calculatedBodyFat = 163.205 * Math.log10(w + hip - n) - 97.684 * Math.log10(h) - 78.387;
                }
            }
        }

        if (calculatedBodyFat) {
            calculatedBodyFat = parseFloat(calculatedBodyFat.toFixed(1));
        }

        const logData = {
            userId: userId,
            date: data.date ? new Date(data.date) : new Date(),
            createdAt: new Date(),
            bodyFat: calculatedBodyFat,
            ...data
        };

        // Ensure date is a Date object for Firestore
        if (typeof logData.date === 'string') {
            logData.date = new Date(logData.date);
        }

        const docRef = await adminDb.collection("body_measurements").add(logData);

        // Clean data for profile (remove non-measurement fields)
        const { date, notes, ...measurementFields } = data;

        const updateData: any = {
            measurements: {
                ...userData?.measurements, // Mantener campos existentes si no se enviaron
                ...measurementFields,
                weight: data.weight,
                updatedAt: new Date()
            },
            weight: data.weight
        };

        if (calculatedBodyFat) {
            updateData.bodyFat = calculatedBodyFat;
            updateData.measurements.bodyFat = calculatedBodyFat;
        }

        await adminDb.collection("users").doc(userId).update(updateData);

        revalidatePath("/profile");
        revalidatePath("/analytics");
        revalidatePath(`/progress`);
        if (targetUserId) {
            revalidatePath(`/progress?athleteId=${targetUserId}`);
        }

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

        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                userId: d.userId,
                date: d.date?.toDate ? d.date.toDate().toISOString() : new Date(d.date).toISOString(),
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
                weight: d.weight,
                bodyFat: d.bodyFat,
                neck: d.neck,
                chest: d.chest,
                waist: d.waist,
                hips: d.hips,
                shoulders: d.shoulders,
                glutes: d.glutes,
                bicepsLeft: d.bicepsLeft,
                bicepsRight: d.bicepsRight,
                forearmsLeft: d.forearmsLeft,
                forearmsRight: d.forearmsRight,
                quadsLeft: d.quadsLeft,
                quadsRight: d.quadsRight,
                calvesLeft: d.calvesLeft,
                calvesRight: d.calvesRight,
                notes: d.notes
            };
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching measurement history:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}
