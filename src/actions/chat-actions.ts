"use server";

import { getGroqClient } from "@/lib/ai";

import { auth } from "@/lib/auth";

export async function chatWithAI(messages: { role: string, content: string }[]) {
    try {
        const session = await auth();
        const role = session?.user?.role || "athlete";
        const groq = getGroqClient();

        let systemPromptContent = "";

        if (role === "coach") {
            systemPromptContent = `Eres GymIA Copilot, un asistente experto para entrenadores de alto rendimiento.
        Tu conocimiento abarca biomecánica avanzada, fisiología del ejercicio, periodización (lineal, ondulante, conjugada) y nutrición deportiva.
        Ayuda al entrenador a diseñar microciclos, corregir déficits en sus atletas y optimizar el volumen/intensidad.
        Usa terminología técnica precisa. Sé directo y profesional.`;
        } else {
            systemPromptContent = `Eres GymIA, un asistente virtual experto en fitness.
        Tu tono es motivador pero profesional.
        Responde dudas sobre técnica, calentamiento y nutrición básica.
        Mantén las respuestas concisas.`;
        }

        const systemMessage = {
            role: "system",
            content: systemPromptContent
        };

        const completion = await groq.chat.completions.create({
            messages: [systemMessage, ...messages] as any,
            model: "llama3-70b-8192",
            temperature: 0.7,
            max_tokens: 600,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            return { success: false, error: "No se recibió respuesta." };
        }

        return { success: true, message: reply };

    } catch (error: any) {
        console.error("Chat Error:", error);
        return { success: false, error: "Error al conectar con GymIA Assistant." };
    }
}
