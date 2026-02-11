"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// --- TIPOS LOCALES ---

interface TrainingSet {
    completed?: boolean;
    weight?: number;
    reps?: number;
    rpe?: number;
}

interface TrainingExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: TrainingSet[];
    feedback?: string;
}

// --- HELPERS ---

function getStartOfWeek(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// --- ACTIONS ---

// Función interna cacheada para actividad semanal
const getCachedWeeklyActivity = unstable_cache(
    async (targetUserId: string) => {
        const startOfWeek = getStartOfWeek(new Date());

        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .where("date", ">=", startOfWeek)
            .get();

        const activityMap = new Map<string, number>();
        const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        days.forEach(d => activityMap.set(d, 0));

        logsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = data.date?.toDate?.() || new Date();
            let dayName = DAYS_ES[date.getDay()];
            if (date.getDay() === 0) dayName = "Dom";

            let sessionVolume = 0;
            data.exercises?.forEach((ex: TrainingExercise) => {
                ex.sets?.forEach((s: TrainingSet) => {
                    if (s.completed && s.weight && s.reps) {
                        sessionVolume += (s.weight * s.reps);
                    }
                });
            });

            const current = activityMap.get(dayName) || 0;
            activityMap.set(dayName, current + sessionVolume);
        });

        return days.map(day => ({
            name: day,
            total: Math.round(activityMap.get(day) || 0)
        }));
    },
    ["weekly-activity"],
    { revalidate: 30, tags: ["weekly-activity"] }
);

export async function getWeeklyActivity(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const targetUserId = userId || session.user.id;

    try {
        const data = await getCachedWeeklyActivity(targetUserId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching activity:", error);
        return { success: false, error: "Error al cargar actividad" };
    }
}

export async function getWeeklyProgress(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        const startOfWeek = getStartOfWeek(new Date());

        // 1. Get Completed Sessions Count
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .where("date", ">=", startOfWeek)
            .get();

        const completedCount = logsSnapshot.size;

        // 2. Get Target from User Profile or Routine
        // Fallback to 3 if unknown
        const userDoc = await adminDb.collection("users").doc(targetUserId).get();
        const userData = userDoc.data();

        // Try to get from active routine first, then profile
        let weeklyTarget = userData?.availableDays || 3;

        if (userData?.activeRoutine?.schedule) {
            weeklyTarget = userData.activeRoutine.schedule.length;
        }

        return {
            success: true,
            completed: completedCount,
            target: weeklyTarget
        };

    } catch (error) {
        return { success: false, error: "Error de progreso" };
    }
}

export async function getPersonalRecords(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        // Query recent logs to find max lifts
        // This is expensive if we scan everything.
        // For MVP, scan last 20 logs.
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        const prsMap = new Map(); // Exercise -> { weight, date }

        logsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const dateStr = data.date.toDate().toLocaleDateString("es-ES", { day: 'numeric', month: 'short' });

            if (data.exercises) {
                data.exercises.forEach((ex: TrainingExercise) => {
                    const name = ex.exerciseName;
                    ex.sets.forEach((s: TrainingSet) => {
                        if (s.completed && s.weight && s.weight > 0) {
                            const current = prsMap.get(name);
                            if (!current || s.weight > current.weight) {
                                prsMap.set(name, { weight: s.weight, date: dateStr });
                            }
                        }
                    });
                });
            }
        });

        const prs = Array.from(prsMap.entries()).map(([name, val]) => ({
            exercise: name,
            weight: val.weight,
            date: val.date
        })).sort((a, b) => b.weight - a.weight).slice(0, 3);

        return { success: true, prs };
    } catch (error) {
        console.error("Error fetching PRs:", error);
        return { success: false, error: "Error al cargar PRs" };
    }
}

export async function getStrengthProgress(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        // Obtenemos los últimos 20 logs para tener suficiente data de comparación
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        if (logsSnapshot.empty || logsSnapshot.size < 2) {
            return { success: true, progress: 0 };
        }

        const logs = logsSnapshot.docs.map(doc => doc.data());

        // Dividir en dos mitades: Reciente (0-9) vs Anterior (10-19)
        // Como están ordenados desc (más nuevo primero), los primeros son los recientes.
        const half = Math.ceil(logs.length / 2);
        const recentLogs = logs.slice(0, half);
        const olderLogs = logs.slice(half);

        const calculateAverageE1RM = (periodLogs: any[]) => {
            let totalE1RM = 0;
            let count = 0;

            periodLogs.forEach(log => {
                if (log.exercises) {
                    log.exercises.forEach((ex: TrainingExercise) => {
                        // Calcular Max E1RM de este ejercicio en esta sesión
                        let maxSessionE1RM = 0;
                        ex.sets.forEach((s: TrainingSet) => {
                            if (s.completed && s.weight && s.reps) {
                                // Fórmula E1RM con RPE: Weight * (1 + (Reps + (10 - RPE)) / 30)
                                // Si no hay RPE, asumimos RIR 2 (RPE 8) como estándar seguro
                                const rpe = s.rpe || 8;
                                const e1rm = s.weight * (1 + (s.reps + (10 - rpe)) / 30);
                                if (e1rm > maxSessionE1RM) maxSessionE1RM = e1rm;
                            }
                        });
                        if (maxSessionE1RM > 0) {
                            totalE1RM += maxSessionE1RM;
                            count++;
                        }
                    });
                }
            });
            return count > 0 ? totalE1RM / count : 0;
        };

        const recentAvg = calculateAverageE1RM(recentLogs);
        const olderAvg = calculateAverageE1RM(olderLogs);

        let percentageChange = 0;
        if (olderAvg > 0) {
            percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;
        } else if (recentAvg > 0) {
            percentageChange = 100; // Si antes era 0 y ahora hay algo, es 100% de mejora (o infinito, ponemos 100 por UI)
        }

        return { success: true, progress: parseFloat(percentageChange.toFixed(1)) };

    } catch (error) {
        console.error("Error calculating strength progress:", error);
        return { success: false, error: "Error al calcular progreso" };
    }
}

import { getGroqClient } from "@/lib/ai";

export async function analyzeAthleteProgress(userId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") return { success: false, error: "No autorizado" };

    try {
        // Fetch last 10 training logs to give context to AI
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", userId)
            .orderBy("date", "desc")
            .limit(10)
            .get();

        if (logsSnapshot.empty) {
            return {
                success: true,
                alerts: [],
                suggestions: ["No hay suficientes datos para analizar."]
            };
        }

        // Simplify logs for AI context to save tokens
        const workoutHistory = logsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                date: d.date.toDate().toISOString().split('T')[0],
                exercises: d.exercises.map((e: TrainingExercise) => ({
                    name: e.exerciseName,
                    topSet: e.sets.reduce((max: number, s: TrainingSet) => s.completed && s.weight ? Math.max(max, s.weight) : max, 0),
                    feedback: e.feedback
                }))
            };
        });

        const prompt = `
            Analiza los siguientes últimos 10 entrenamientos de un atleta y detecta patrones.
            
            Historial JSON:
            ${JSON.stringify(workoutHistory)}

            Tu tarea es identificar:
            1. ESTANCAMIENTO: Ejercicios donde el peso (topSet) no ha aumentado en las últimas 3 sesiones.
            2. RECOMENDACIONES: Sugerencia breve de sobrecarga progresiva (ej: "Subir 2.5kg en Banca").

            Responde ÚNICAMENTE con este JSON exacto:
            {
                "alerts": [
                    { "type": "stagnation", "message": "Estancado en [Ejercicio] desde hace 3 sesiones", "severity": "high" }
                ],
                "suggestions": [
                    "Sugerencia 1..."
                ]
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de análisis IA" };

        const result = JSON.parse(content);
        return { success: true, ...result };

    } catch (error) {
        console.error("Analysis Error:", error);
        return {
            success: true,
            alerts: [],
            suggestions: ["Error conectando con el motor de análisis."]
        };
    }
}
