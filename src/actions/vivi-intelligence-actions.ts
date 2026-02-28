"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient, DEFAULT_AI_MODEL } from "@/lib/ai";
import { revalidateTag } from "next/cache";

export interface ViviInsight {
    type: "fatigue" | "pr" | "nutrition" | "memory";
    title: string;
    content: string;
    severity: "low" | "medium" | "high";
    actionable?: string;
}

export interface ViviIntelligenceData {
    lastAnalyzed: any;
    insights: ViviInsight[];
    readinessScore: number; // 0-100
    memories: Array<{
        content: string;
        date: any;
        category: string;
    }>;
}

/**
 * Motor central de inteligencia de Vivi.
 * Analiza el historial completo del atleta y genera un documento de "insights" persistente.
 */
export async function analyzeViviIntelligence(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const targetUserId = userId || session.user.id;

    try {
        const groq = getGroqClient();

        // 1. Obtener datos masivos para el análisis (Logs, Medidas, Perfil)
        const [userDoc, logsSnap, measurementsSnap] = await Promise.all([
            adminDb.collection("users").doc(targetUserId).get(),
            adminDb.collection("training_logs")
                .where("athleteId", "==", targetUserId)
                .limit(40)
                .get(),
            adminDb.collection("body_measurements")
                .where("userId", "==", targetUserId)
                .limit(20)
                .get()
        ]);

        const userData = userDoc.data();

        // Ordenar logs en memoria
        const rawLogs = logsSnap.docs.map(doc => doc.data());
        const sortedLogs = rawLogs.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
            const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
            return dateB - dateA;
        }).slice(0, 15);

        const logs = sortedLogs.map(d => ({
            date: d.date?.toDate().toISOString().split('T')[0],
            routineName: d.routineName,
            duration: d.durationMinutes,
            exercises: (d.exercises || []).map((e: any) => ({
                name: e.exerciseName,
                avgRpe: (e.sets || []).reduce((acc: number, s: any) => acc + (s.rpe || 8), 0) / (e.sets?.length || 1),
                topWeight: Math.max(...(e.sets || []).map((s: any) => s.weight || 0), 0)
            }))
        }));

        // Ordenar medidas en memoria
        const rawMeasurements = measurementsSnap.docs.map(doc => doc.data());
        const sortedMeasurements = rawMeasurements.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
            const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
            return dateB - dateA;
        }).slice(0, 5);

        const measurements = sortedMeasurements.map(d => ({
            date: d.date?.toDate().toISOString().split('T')[0],
            weight: d.weight,
            bodyFat: d.bodyFat
        }));


        const prompt = `
            Eres Vivi, una IA entrenadora experta, empática y proactiva. 
            Analiza estos datos del atleta y genera INSIGHTS ESTRATÉGICOS.

            DATOS DEL ATLETA:
            - Objetivo: ${userData?.goal}
            - Lesiones: ${userData?.injuries?.join(", ") || "Ninguna"}
            - Historial entrenos: ${JSON.stringify(logs)}
            - Historial medidas: ${JSON.stringify(measurements)}

            TAREAS:
            1. ANALIZA FATIGA: Mira si el RPE ha subido en los últimos entrenos sin aumento de carga (Fatiga acumulada).
            2. DETECTA PR CHALLENGES: Encuentra ejercicios donde el atleta esté estancado o progrese lento y sugiérele un peso objetivo para romper su récord.
            3. NUTRICIÓN INTELIGENTE: Basado en el volumen de entrenamiento reciente y su peso, da un consejo nutricional específico (ej: más carbs si entrena duro, más proteína si busca hipertrofia).
            4. PUNTUACIÓN DE "READINESS": Da un score del 0 al 100 de qué tan preparado está hoy para un entrenamiento intenso.

            Respuesta JSON obligatoria:
            {
                "readinessScore": 85,
                "insights": [
                    { "type": "fatigue", "title": "...", "content": "...", "severity": "medium", "actionable": "Descansa mañana" },
                    { "type": "pr", "title": "¡Récord a la vista!", "content": "En Press de Banca puedes tirar 80kg hoy.", "severity": "low", "actionable": "Prueba 80kg en la 1ra serie" },
                    { "type": "nutrition", "title": "Carga de combustible", "content": "Tu volumen subió un 20%. Sube 30g de carbohidratos.", "severity": "low" }
                ]
            }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // 2. Guardar en la colección de inteligencia
        const intelligenceRef = adminDb.collection("vivi_intelligence").doc(targetUserId);
        const currentIntel = await intelligenceRef.get();
        const existingMemories = currentIntel.exists ? (currentIntel.data()?.memories || []) : [];

        await intelligenceRef.set({
            lastAnalyzed: new Date(),
            readinessScore: result.readinessScore || 70,
            insights: result.insights || [],
            memories: existingMemories // Preservamos memorias
        }, { merge: true });

        return { success: true, data: result };

    } catch (error) {
        console.error("Vivi Intelligence Error:", error);
        return { success: false, error: "Error al generar inteligencia de Vivi" };
    }
}

/**
 * Guarda una "memoria" o consejo importante que debe recordar en futuras sesiones.
 */
export async function saveViviMemory(content: string, category: string = "general") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const intelRef = adminDb.collection("vivi_intelligence").doc(session.user.id);

        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(intelRef);
            const memories = doc.exists ? (doc.data()?.memories || []) : [];

            // Mantener solo las últimas 10 memorias relevantes
            const newMemories = [
                { content, category, date: new Date() },
                ...memories
            ].slice(0, 10);

            transaction.set(intelRef, { memories: newMemories }, { merge: true });
        });

        return { success: true };
    } catch (error) {
        console.error("Save Memory Error:", error);
        return { success: false, error: "No se pudo guardar la memoria" };
    }
}

export async function getViviIntelligence(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const targetUserId = userId || session.user.id;

    try {
        const doc = await adminDb.collection("vivi_intelligence").doc(targetUserId).get();
        if (!doc.exists) return null;
        return doc.data() as ViviIntelligenceData;
    } catch (error) {
        return null;
    }
}
