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
export async function getAthleteContext(userId: string): Promise<string> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) return "Sin perfil de atleta disponible.";

    const data = userDoc.data()!;

    const parts: string[] = [];

    if (data.name) parts.push(`Nombre: ${data.name}`);
    if (data.gender) parts.push(`Sexo: ${data.gender}`);
    if (data.birthDate) {
      const birth = data.birthDate.toDate ? data.birthDate.toDate() : new Date(data.birthDate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Edad: ${age} años`);
    }

    // Datos antropométricos
    if (data.weight) parts.push(`Peso: ${data.weight} kg`);
    if (data.height) parts.push(`Altura: ${data.height} cm`);

    // Objetivo
    if (data.goal) parts.push(`Objetivo: ${data.goal}`);

    // Nivel de experiencia
    if (data.experienceLevel) parts.push(`Nivel: ${data.experienceLevel}`);

    // Lesiones y condiciones médicas (CRÍTICO para seguridad)
    const injuries = data.injuries || [];
    if (injuries.length > 0) {
      parts.push(`⚠️ Lesiones/Limitaciones: ${injuries.join(", ")}`);
    }

    const medical = data.medicalConditions || [];
    if (medical.length > 0) {
      parts.push(`⚠️ Condiciones médicas: ${medical.join(", ")}`);
    }

    if (parts.length === 0) return "Perfil del atleta sin datos detallados.";

    return `--- PERFIL DEL ATLETA ---\n${parts.join("\n")}`;
  } catch (error) {
    console.error("Error fetching athlete context:", error);
    return "Error al obtener perfil del atleta.";
  }
}
