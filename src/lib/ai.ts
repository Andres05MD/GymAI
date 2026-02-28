import Groq from "groq-sdk";
import { adminDb } from "@/lib/firebase-admin";

/** Modelo IA por defecto para todas las llamadas */
export const DEFAULT_AI_MODEL = "llama-3.3-70b-versatile";

export const getGroqClient = () => {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

/**
 * Obtiene un resumen contextual del perfil del atleta para inyectar en prompts de IA.
 * Incluye datos de salud, lesiones, objetivos y condiciones médicas.
 */
import { getViviIntelligence } from "@/actions/vivi-intelligence-actions";

/**
 * Obtiene un resumen contextual del perfil del atleta para inyectar en prompts de IA.
 * Incluye datos de salud, lesiones, objetivos, condiciones médicas, insights de inteligencia y memorias.
 */
export async function getAthleteContext(userId: string): Promise<string> {
  try {
    const [userDoc, measurementsSnap, routinesSnap, logsSnap, viviIntel] = await Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb.collection("body_measurements")
        .where("userId", "==", userId)
        .limit(20) // Traemos suficientes para ordenar en memoria
        .get(),
      adminDb.collection("routines")
        .where("athleteId", "==", userId)
        .get(),
      adminDb.collection("training_logs")
        .where("athleteId", "==", userId)
        .limit(30)
        .get(),
      getViviIntelligence(userId)
    ]);



    if (!userDoc.exists) return "Sin perfil de atleta disponible.";

    const data = userDoc.data()!;
    const parts: string[] = [];

    // --- PERFIL BÁSICO ---
    parts.push("--- PERFIL DEL ATLETA ---");
    if (data.name) parts.push(`Nombre: ${data.name}`);
    if (data.gender) parts.push(`Sexo: ${data.gender === "male" ? "Hombre" : "Mujer"}`);
    if (data.birthDate) {
      const birth = data.birthDate.toDate ? data.birthDate.toDate() : new Date(data.birthDate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Edad: ${age} años`);
    }
    if (data.goal) parts.push(`Objetivo Personal: ${data.goal}`);
    if (data.experienceLevel) parts.push(`Nivel de Experiencia: ${data.experienceLevel}`);

    // Lesiones y condiciones médicas
    const injuries = data.injuries || [];
    if (injuries.length > 0) parts.push(`⚠️ Lesiones/Limitaciones: ${injuries.join(", ")}`);
    const medical = data.medicalConditions || [];
    if (medical.length > 0) parts.push(`⚠️ Condiciones médicas: ${medical.join(", ")}`);

    // --- INTELIGENCIA PROACTIVA (Vivi Insights) ---
    if (viviIntel) {
      parts.push("\n--- INTELIGENCIA Y ESTADO ACTUAL (Vivi) ---");
      parts.push(`Puntuación de Preparación (Readiness): ${viviIntel.readinessScore}/100`);

      if (viviIntel.insights && viviIntel.insights.length > 0) {
        viviIntel.insights.forEach(insight => {
          parts.push(`- [${insight.type.toUpperCase()}] ${insight.title}: ${insight.content}`);
          if (insight.actionable) parts.push(`  Consejo: ${insight.actionable}`);
        });
      }

      if (viviIntel.memories && viviIntel.memories.length > 0) {
        parts.push("\n--- MEMORIA DE CONSEJOS PASADOS ---");
        viviIntel.memories.slice(0, 5).forEach(m => {
          parts.push(`- ${m.content}`);
        });
      }
    }

    // --- MEDIDAS RECIENTES ---
    const sortedMeasurements = measurementsSnap.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);

    if (sortedMeasurements.length > 0) {
      parts.push("\n--- ÚLTIMAS MEDIDAS CORPORALES ---");
      sortedMeasurements.forEach((m, i) => {
        const date = m.date?.toDate ? m.date.toDate().toLocaleDateString("es-ES") : "Fecha desconocida";
        parts.push(`Registro ${i + 1} (${date}): Peso ${m.weight}kg, Grasa ${m.bodyFat || "?"}%, Cintura ${m.waist || "?"}cm`);
      });
    }


    // --- RUTINA ACTIVA ---
    const activeRoutine = routinesSnap.docs.find(doc => doc.data().active === true);
    if (activeRoutine) {
      const routine = activeRoutine.data();
      parts.push(`\n--- RUTINA ACTUAL: ${routine.name} ---`);
      if (routine.schedule) {
        routine.schedule.slice(0, 3).forEach((day: any) => { // Limitado para ahorrar tokens
          const exerciseNames = day.exercises?.map((ex: any) => ex.exerciseName).join(", ");
          parts.push(`- ${day.name}: ${exerciseNames}`);
        });
      }
    }

    // --- HISTORIAL RECIENTE ---
    const completedLogs = logsSnap.docs
      .map(doc => doc.data())
      .filter(log => log.status === "completed")
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    if (completedLogs.length > 0) {
      parts.push("\n--- ÚLTIMOS ENTRENAMIENTOS ---");
      completedLogs.forEach(log => {
        const date = log.date?.toDate ? log.date.toDate().toLocaleDateString("es-ES") : "Fecha desconocida";
        parts.push(`- ${date}: ${log.routineName || "Entrenamiento"} (${log.durationMinutes || "?"} min)`);
      });
    }



    return parts.join("\n");
  } catch (error) {
    console.error("Error fetching athlete context:", error);
    return "Error al recopilar el contexto completo del atleta.";
  }
}


