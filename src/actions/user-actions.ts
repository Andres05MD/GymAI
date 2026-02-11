"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function linkWithCoach(coachCode: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    if (!coachCode || coachCode.length < 5) {
        return { success: false, error: "Código inválido" };
    }

    try {
        // Buscar al coach por su ID (usaremos el ID como código por simplicidad inicial)
        // Opcionalmente podríamos tener un campo "inviteCode" en el documento del coach.
        const coachDoc = await adminDb.collection("users").doc(coachCode).get();

        if (!coachDoc.exists) {
            return { success: false, error: "Coach no encontrado con ese código" };
        }

        const coachData = coachDoc.data();
        if (coachData?.role !== "coach") {
            return { success: false, error: "El usuario no es un coach" };
        }

        // Actualizar al atleta
        await adminDb.collection("users").doc(session.user.id).update({
            coachId: coachCode,
            coachName: coachData?.name || "Coach",
            linkedAt: new Date()
        });

        // Opcional: Añadir el atleta a la lista del coach (si desnormalizamos)
        // Pero es mejor query on-demand: users where coachId == myId

        revalidatePath("/profile");
        return { success: true, coachName: coachData?.name };

    } catch (error) {
        console.error("Error linking coach:", error);
        return { success: false, error: "Error al vincular coach" };
    }
}

export async function unlinkCoach() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("users").doc(session.user.id).update({
            coachId: null, // o admin.firestore.FieldValue.delete()
            coachName: null,
            linkedAt: null
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al desvincular" };
    }
}

export async function getCoachAthletes() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("users")
            .where("coachId", "==", session.user.id)
            .get();

        const athletes = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            email: doc.data().email,
            photoUrl: doc.data().photoUrl
        }));

        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching athletes:", error);
        return { success: false, error: "Error al cargar atletas" };
    }
}


