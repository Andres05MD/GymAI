"use server";

import { z } from "zod";
import { RegisterInputSchemaServer, OnboardingInputSchema } from "@/lib/schemas";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/auth";

/**
 * Registra un nuevo usuario usando Firebase Authentication + Firestore.
 * 
 * Este flujo:
 * 1. Valida los datos de entrada
 * 2. Crea el usuario en Firebase Authentication (esto genera el UID)
 * 3. Crea el documento del usuario en Firestore con ese UID
 * 
 * Nota: La contraseña es manejada por Firebase Auth, NO guardamos hash manual.
 */
export async function registerUser(data: z.infer<typeof RegisterInputSchemaServer>) {
    const validation = RegisterInputSchemaServer.safeParse(data);

    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    const { name, email, password, role } = validation.data;

    try {
        // 1. Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const firebaseUser = userCredential.user;

        // 2. Actualizar el perfil con el nombre
        await updateProfile(firebaseUser, { displayName: name });

        // 3. Crear el documento del usuario en Firestore
        const newUserData = {
            id: firebaseUser.uid,
            name,
            email,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            onboardingCompleted: false,
        };

        const userDocRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userDocRef, newUserData);

        // 4. Cerrar sesión de Firebase Auth (NextAuth manejará la sesión)
        await firebaseAuth.signOut();

        return { success: true };

    } catch (error: any) {
        console.error("Error registrando usuario:", error);

        // Manejar errores específicos de Firebase Auth
        if (error.code === "auth/email-already-in-use") {
            return { success: false, error: "El email ya está registrado" };
        }
        if (error.code === "auth/weak-password") {
            return { success: false, error: "La contraseña es muy débil" };
        }
        if (error.code === "auth/invalid-email") {
            return { success: false, error: "El email no es válido" };
        }

        return { success: false, error: "Error al crear usuario. Por favor intenta de nuevo." };
    }
}

import { adminDb, adminAuth } from "@/lib/firebase-admin";

/**
 * Completa el onboarding del usuario actual.
 */
export async function completeOnboarding(data: z.infer<typeof OnboardingInputSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const validation = OnboardingInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    const { password, confirmPassword, ...profileData } = validation.data;

    try {
        // Si el usuario proporcionó una contraseña (para usuarios de Google), la actualizamos en Auth
        if (password && password.length >= 6) {
            try {
                await adminAuth.updateUser(session.user.id, {
                    password: password
                });
            } catch (authError) {
                console.error("Error actualizando contraseña:", authError);
                return { success: false, error: "Error al establecer la contraseña. Intenta otra." };
            }
        }

        // Usamos set con { merge: true } para crear el documento si no existe 
        // o actualizarlo si ya existe, evitando el error NOT_FOUND.
        // Si el usuario estableció contraseña, marcar hasPassword como true
        const updateData: Record<string, unknown> = {
            ...profileData,
            onboardingCompleted: true,
            updatedAt: new Date(),
        };

        // Si el usuario de Google estableció contraseña, ahora puede acceder con ambos métodos
        if (password && password.length >= 6) {
            updateData.hasPassword = true;
        }

        await adminDb.collection("users").doc(session.user.id).set(updateData, { merge: true });

        // UNIFICACIÓN: Registrar también las medidas iniciales en el historial `body_measurements`
        // Esto permite que el gráfico del perfil tenga un punto inicial.
        if (profileData.measurements && Object.keys(profileData.measurements).length > 0) {
            try {
                const initialLog = {
                    userId: session.user.id,
                    date: new Date(),
                    createdAt: new Date(),
                    ...profileData.measurements,
                    weight: profileData.weight, // Incluir peso en el log
                    // Nota: Height es más estático, pero weight es clave para el gráfico
                };
                await adminDb.collection("body_measurements").add(initialLog);
            } catch (logError) {
                console.error("Error guardando log inicial de medidas:", logError);
                // No fallamos todo el onboarding si esto falla, es secundario
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error onboarding:", error);
        return { success: false, error: "Error al guardar datos en Firestore" };
    }
}
