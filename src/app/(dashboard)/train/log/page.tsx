import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RetroactiveWorkoutLogger } from "@/components/training/retroactive-workout-logger";
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

    // Intentar cargar la rutina activa para pre-rellenar ejercicios (opcional)
    let routineDay: ScheduleDay | undefined;
    let routineId: string | undefined;
    let routineNameFromDB: string | undefined;

    try {
        const { routine } = await getActiveRoutine();
        if (routine) {
            const typedRoutine = routine as unknown as ActiveRoutine;
            routineId = typedRoutine.id;
            routineNameFromDB = typedRoutine.name;
            // Ofrecer el primer día como plantilla (el atleta puede modificar)
            routineDay = typedRoutine.schedule?.[0];
        }
    } catch {
        // Si no hay rutina activa, el formulario estará en blanco
    }

    return (
        <div className="px-4 sm:px-6 pt-4 pb-4">
            <RetroactiveWorkoutLogger
                routineDay={routineDay}
                routineId={routineId}
                routineName={routineNameFromDB}
            />
        </div>
    );
}
