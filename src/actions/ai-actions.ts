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

export async function generateRoutinePlan(goal: string, level: string, days: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const prompt = `
            Eres un entrenador personal experto. Genera un plan de rutina de ${days} días para un atleta de nivel ${level} con objetivo de ${goal}.
            
            La respuesta DEBE ser un objeto JSON con esta estructura:
            {
                "exercises": [
                    {
                        "id": "day-1",
                        "name": "Día 1 - [Nombre descriptivo]",
                        "exercises": [
                            {
                                "exerciseId": "temp-1",
                                "exerciseName": "Nombre del Ejercicio",
                                "notes": "Notas técnicas",
                                "order": 0,
                                "sets": [
                                    { "type": "working", "reps": "8-12", "rpeTarget": 8, "restSeconds": 90 }
                                ]
                            }
                        ]
                    }
                ]
            }
            
            Incluye 4-6 ejercicios por día, variando grupos musculares según el split elegido.
            Usa nombres de ejercicios comunes en español.
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.6,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, exercises: result.exercises };

    } catch (error) {
        console.error("Routine Plan Gen Error:", error);
        return { success: false, error: "Error al generar rutina" };
    }
}

// Alias para generateWarmup - usado por warmup-generator.tsx
export async function generateSmartWarmup(muscleGroups: string[]) {
    return generateWarmup(muscleGroups);
}

// Alias para suggestSubstitute - usado por exercise-swap-dialog.tsx
export async function suggestAlternativeExercise(exerciseName: string, reason: "busy" | "pain" | "equipment") {
    return suggestSubstitute(exerciseName, reason);
}

// Chat con el coach AI - usado por ai-coach-chat.tsx
export async function chatWithCoachAI(message: string, context?: { exerciseName?: string; muscleGroups?: string[] }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const contextStr = context?.exerciseName
            ? `Contexto: El atleta está haciendo "${context.exerciseName}" (músculos: ${context.muscleGroups?.join(", ") || "no especificado"}).`
            : "";

        const prompt = `
            Eres un coach de fitness experto y amigable. El atleta te hace la siguiente pregunta:
            "${message}"
            
            ${contextStr}
            
            Responde de manera concisa y útil. Si es sobre técnica, da consejos prácticos.
            Si es sobre alternativas, sugiere opciones específicas.
            
            Respuesta JSON:
            {
                "response": "Tu respuesta aquí"
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, response: result.response };

    } catch (error) {
        console.error("Coach Chat Error:", error);
        return { success: false, error: "Error al procesar tu mensaje" };
    }
}

export async function analyzeRoutineSafety(routineData: any, athleteId: string) {
    const session = await auth();
    // Verify coach role or self (if athlete wants to check their own routine safety? Maybe only coach feature for now)
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const groq = getGroqClient();

        // Get athlete data for context (injuries, experience)
        // Note: In real app, we should fetch athlete data from DB. 
        // For now, let's assume routineData contains context or we fetch it here.
        // Fetching athlete profile from DB:
        const athleteDoc = await adminDb.collection("users").doc(athleteId).get();
        const athlete = athleteDoc.exists ? athleteDoc.data() : {};

        const injuries = athlete?.injuries || "Ninguna reportada";
        const experience = athlete?.experience || "Intermedio";

        const prompt = `
            Actúa como un fisioterapeuta deportivo experto. Analiza la siguiente rutina de entrenamiento en busca de riesgos de seguridad graves, considerando el perfil del atleta.

            PERFIL ATLETA:
            - Nivel: ${experience}
            - Lesiones/Condiciones: ${injuries}

            RUTINA A ANALIZAR:
            ${JSON.stringify(routineData, null, 2)}

            TAREA:
            Evalúa:
            1. Volumen excesivo para el nivel/lesiones.
            2. Selección de ejercicios peligrosos para las lesiones citadas.
            3. Frecuencia inadecuada.

            Responde ÚNICAMENTE en JSON:
            {
                "score": 85, // 0-100 (100 = muy seguro)
                "riskLevel": "Bajo" | "Medio" | "Alto",
                "warnings": [
                    { "title": "Riesgo en Hombro", "description": "Demasiado press militar para lesión de manguito.", "severity": "high" }
                ],
                "goodPoints": ["Buen equilibrio de empuje/tracción"],
                "recommendation": "Reducir volumen de hombro y añadir facepulls."
            }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de análisis" };

        return { success: true, analysis: JSON.parse(content) };

    } catch (error) {
        console.error("Safety Analysis Error:", error);
        return { success: false, error: "Error al analizar seguridad" };
    }
}
