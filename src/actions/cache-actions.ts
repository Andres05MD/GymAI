"use server";

import { revalidateTag } from "next/cache";

/**
 * Etiquetas de caché disponibles para revalidación.
 * Usar estas constantes para mantener consistencia.
 */
export const CACHE_TAGS = {
    // Coach
    COACH_STATS: "coach-stats",
    COACH_NOTIFICATIONS: "coach-notifications",

    // Athletes
    ATHLETES: "athletes",
    ATHLETE_DETAILS: "athlete-details",
    ATHLETE_NOTIFICATIONS: "athlete-notifications",

    // Routines
    ROUTINES: "routines",

    // Exercises
    EXERCISES: "exercises",

    // Training
    TRAINING_LOGS: "training-logs",

    // Notifications
    NOTIFICATIONS: "notifications",
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

/**
 * Revalida una o más etiquetas de caché.
 * Usar después de mutaciones para actualizar datos cacheados.
 * 
 * @example
 * ```ts
 * // Después de crear una rutina
 * await revalidateCacheTags(["routines", "coach-stats"]);
 * ```
 */
export async function revalidateCacheTags(tags: CacheTag[]) {
    // Next.js 16 requiere un profile como segundo argumento
    // "default" usa la configuración de caché por defecto
    tags.forEach(tag => revalidateTag(tag, "default"));
}

/**
 * Revalida todos los datos del coach (stats, atletas, rutinas).
 * Usar cuando hay cambios que afectan múltiples secciones.
 */
export async function revalidateCoachData() {
    await revalidateCacheTags([
        CACHE_TAGS.COACH_STATS,
        CACHE_TAGS.ATHLETES,
        CACHE_TAGS.ROUTINES,
        CACHE_TAGS.EXERCISES,
    ]);
}

/**
 * Revalida datos del atleta después de un entrenamiento.
 */
export async function revalidateAthleteData() {
    await revalidateCacheTags([
        CACHE_TAGS.TRAINING_LOGS,
        CACHE_TAGS.ATHLETE_NOTIFICATIONS,
        CACHE_TAGS.COACH_STATS, // Para que el coach vea la actividad
    ]);
}
