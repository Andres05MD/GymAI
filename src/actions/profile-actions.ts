"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateProfileSchema = z.object({
    name: z.string().min(2),
    image: z.string().url().optional().or(z.literal("")),
    goal: z.string().optional(),
    level: z.string().optional()
});

export async function updateProfile(data: z.infer<typeof UpdateProfileSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const validation = UpdateProfileSchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Datos inválidos" };

    try {
        await adminDb.collection("users").doc(session.user.id).update({
            ...validation.data,
            updatedAt: new Date()
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al actualizar perfil" };
    }
}
