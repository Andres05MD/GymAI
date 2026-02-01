"use server";

import { getGroqClient } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export async function analyzeAthleteProgress(athleteId: string) {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "Solo entrenadores pueden realizar análisis" };
    }

    try {
        // 1. Obtener últimos 5 entrenamientos del atleta
        const q = query(
            collection(db, "training_logs"),
            where("athleteId", "==", athleteId),
            where("status", "==", "completed"),
            orderBy("endTime", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return { success: false, error: "El atleta no tiene suficientes datos para un análisis." };
        }

        const history = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                date: data.endTime?.toDate().toISOString().split('T')[0],
                routine: data.routineName,
                feedback: data.sessionFeedback || "Sin feedback",
                exercises: data.exercises.map((ex: any) => ({
                    name: ex.exerciseName,
                    sets_completed: ex.sets.filter((s: any) => s.completed).length,
                    best_set: ex.sets[0] ? `${ex.sets[0].weight}kg x ${ex.sets[0].reps}` : "N/A"
                }))
            };
        });

        // 2. Enviar a Groq
        const groq = getGroqClient();
        const prompt = `
            Analiza el progreso reciente de este atleta basándote en sus últimas sesiones:
            ${JSON.stringify(history, null, 2)}

            Proporciona un resumen técnico breve para el entrenador:
            1. Adherencia y consistencia.
            2. Progresión de cargas (si se detecta).
            3. Sugerencias de ajuste para el siguiente mesociclo.
            
            Formato: Markdown conciso.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Eres un analista de rendimiento deportivo experto." },
                { role: "user", content: prompt }
            ],
            model: "llama3-70b-8192",
            temperature: 0.4,
        });

        return { success: true, analysis: completion.choices[0]?.message?.content };

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return { success: false, error: "Error al generar análisis." };
    }
}
