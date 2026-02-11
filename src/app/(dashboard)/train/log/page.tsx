import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RetroactiveWorkoutLogger } from "@/components/training/retroactive-workout-logger";
import { WeeklyRoutineView } from "@/components/training/weekly-routine-view";
import { getActiveRoutine } from "@/actions/athlete-actions";

// Interfaces para tipar la rutina
interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: Array<{ reps?: number | string; rpeTarget?: number }>;
}

interface ScheduleDay {
    id?: string;
    name: string;
    exercises: ScheduleExercise[];
}

interface ActiveRoutine {
    id: string;
    name: string;
    schedule: ScheduleDay[];
}

export default async function LogWorkoutPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Intentar cargar la rutina activa
    let routine: ActiveRoutine | undefined;

    try {
        const { routine: rawRoutine } = await getActiveRoutine();
        if (rawRoutine) {
            routine = rawRoutine as unknown as ActiveRoutine;
        }
    } catch {
        // Si no hay rutina activa, el formulario estará en blanco
    }

    return (
        <div className="px-4 sm:px-6 pt-4 pb-4">
            {routine && routine.schedule?.length > 0 ? (
                <WeeklyRoutineView
                    schedule={routine.schedule}
                    routineId={routine.id}
                    routineName={routine.name}
                    routineType={routine.schedule.length === 1 ? "daily" : "weekly"}
                />
            ) : (
                <RetroactiveWorkoutLogger />
            )}
        </div>
    );
}
