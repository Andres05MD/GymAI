"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export async function getCoachStats() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Count Athletes
        // Assuming athletes are users with role 'athlete'. 
        // If there's a specific assignment, we should query by 'coachId'. 
        // For MVP, we'll count ALL athletes if no 'coachId' field exists on users, 
        // OR filtering by coachId if users have it. 
        // Let's assume for now we might filter by a 'coachId' field on the user profile if it exists,
        // otherwise we just count all for this demo or return 0.
        // BETTER MVP: Query 'users' where role == 'athlete'. 
        // If you strictly want *assigned* athletes, we'd need that relation. 
        // Let's assume we query all athletes for now as the app seems single-coach or open.

        const athletesSnapshot = await adminDb.collection("users")
            .where("role", "==", "athlete")
            // .where("coachId", "==", session.user.id) // Uncomment if relationship exists
            .count()
            .get();

        const totalAthletes = athletesSnapshot.data().count;

        // 2. Count Routines
        const routinesSnapshot = await adminDb.collection("routines")
            .where("coachId", "==", session.user.id)
            .count()
            .get();

        const totalRoutines = routinesSnapshot.data().count;

        // 3. Count Exercises (Library)
        const exercisesSnapshot = await adminDb.collection("exercises")
            .count()
            .get();

        const totalExercises = exercisesSnapshot.data().count;

        // 4. Calculate Global Activity (Total Volume this week)
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
        startOfWeek.setHours(0, 0, 0, 0);

        const globalLogs = await adminDb.collection("training_logs")
            .where("date", ">=", startOfWeek)
            .get();

        let weeklyVolume = 0;
        globalLogs.docs.forEach(doc => {
            const data = doc.data();
            data.exercises?.forEach((ex: any) => {
                ex.sets?.forEach((s: any) => {
                    if (s.completed && s.weight && s.reps) {
                        weeklyVolume += (s.weight * s.reps);
                    }
                });
            });
        });

        // Weekly activity chart data (simplified)
        const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        const activityMap = new Map();
        days.forEach(d => activityMap.set(d, 0));

        const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        globalLogs.docs.forEach(doc => {
            const date = doc.data().date.toDate();
            let dayName = DAYS_ES[date.getDay()];
            if (date.getDay() === 0) dayName = "Dom";

            let sessionVol = 0;
            doc.data().exercises?.forEach((ex: any) => {
                ex.sets?.forEach((s: any) => {
                    if (s.completed && s.weight && s.reps) sessionVol += (s.weight * s.reps);
                });
            });
            activityMap.set(dayName, (activityMap.get(dayName) || 0) + sessionVol);
        });

        const weeklyChartData = days.map(d => ({ name: d, total: activityMap.get(d) }));

        return {
            success: true,
            stats: {
                totalAthletes,
                totalRoutines,
                totalExercises,
                weeklyVolume,
                weeklyChartData
            }
        };

    } catch (error) {
        console.error("Error fetching coach stats:", error);
        return {
            success: false,
            stats: {
                totalAthletes: 0,
                totalRoutines: 0,
                totalExercises: 0
            }
        };
    }
}

export async function getRecentActivity() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("training_logs")
            .orderBy("date", "desc")
            .limit(5)
            .get();

        const activities = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Fetch athlete details
            let athleteName = "Atleta Desconocido";
            let athleteImage = null;

            // Check for userId or athleteId
            const uid = data.userId || data.athleteId; // Fallback support

            if (uid) {
                const userDoc = await adminDb.collection("users").doc(uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    athleteName = userData?.name || "Atleta";
                    athleteImage = userData?.image || null;
                }
            }

            // Calculate Volume
            let sessionVol = 0;
            data.exercises?.forEach((ex: any) => {
                ex.sets?.forEach((s: any) => {
                    if (s.completed && s.weight && s.reps) sessionVol += (s.weight * s.reps);
                });
            });

            return {
                id: doc.id,
                athleteName,
                athleteImage,
                routineName: data.routineName || "Entrenamiento Libre",
                date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(), // Return ISO string for client
                volume: sessionVol,
                exercisesCount: data.exercises?.length || 0
            };
        }));

        return { success: true, activities };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return { success: false, activities: [] };
    }
}
