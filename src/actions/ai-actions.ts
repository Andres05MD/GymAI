"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient } from "@/lib/ai";

export async function generateWarmup(muscleGroups: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const prompt = `
            Genera una rutina de calentamiento específica y rápida (5-10 min) para preparar los siguientes grupos musculares: ${muscleGroups.join(", ")}.
            
            La respuesta DEBE ser un objeto JSON con esta estructura:
            {
                "warmupRoutine": [
                    { "name": "Nombre Movimiento", "duration": "30s" or "15 reps", "notes": "Tip técnico breve" }
                ]
            }
            Incluye movilidad articular, activación y aproximación.
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, data: result.warmupRoutine };

    } catch (error) {
        console.error("Warmup Gen Error:", error);
        return { success: false, error: "Error al generar calentamiento" };
    }
}

export async function suggestSubstitute(exerciseName: string, reason: "busy" | "pain" | "equipment") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Fetch available exercises to suggest form library if possible, but for now generic is fine
        // Ideally we would feed the available library but context limit might vary.
        // Let's rely on LLM general knowledge for now.

        const prompt = `
            Soy un atleta en medio de mi entrenamiento. Tenía que hacer "${exerciseName}" pero no puedo porque: ${reason === "busy" ? "la máquina está ocupada" : reason === "pain" ? "siento dolor/molestia" : "falta equipo"}.
            
            Sugiéreme 3 alternativas biomecánicamente equivalentes (mismo patrón de movimiento y músculo objetivo).
            
            Respuesta JSON estricta:
            {
                "alternatives": [
                    { "name": "Nombre Ejercicio", "why": "Breve explicación de por qué sirve" }
                ]
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, data: result.alternatives };

    } catch (error) {
        console.error("Substitute Gen Error:", error);
        return { success: false, error: "Error al buscar alternativas" };
    }
}
