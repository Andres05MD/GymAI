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

        return {
            success: true,
            stats: {
                totalAthletes,
                totalRoutines,
                totalExercises
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
