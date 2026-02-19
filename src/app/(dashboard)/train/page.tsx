import { getActiveRoutine } from "@/actions/athlete-actions";
import { getTodayAssignment } from "@/actions/schedule-actions";
import { getRoutine } from "@/actions/routine-actions";
import { WorkoutSession } from "@/components/training/workout-session";
import { RestDayView } from "@/components/training/rest-day-view";
import { WorkoutCompletedView } from "@/components/training/workout-completed-view";
import { checkCompletedWorkoutToday } from "@/actions/training-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Tipo local para compatibilidad con WorkoutSession
interface WorkoutRoutine {
    id: string;
    name: string;
    schedule: Array<{
        id?: string;
        name: string;
        exercises: Array<{
            exerciseId?: string;
            exerciseName: string;
            sets: Array<{
                reps?: number;
                weight?: number;
            }>;
        }>;
    }>;
}

export default async function TrainPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Detect if today is a weekend day (Saturday = 6, Sunday = 0)
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rawDayName = todayDate.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);

    // 0. Check if there's a completed session for today
    const { completed } = await checkCompletedWorkoutToday();
    if (completed) {
        return <WorkoutCompletedView />;
    }

    // 1. Check for a specific assignment for TODAY
    const todayISO = todayDate.toISOString().split('T')[0];
    const { assignment } = await getTodayAssignment(session.user.id, todayISO);

    // If it's a weekend and there's no coach assignment, it's a rest day
    if (isWeekend && !assignment) {
        return <RestDayView dayName={dayName} />;
    }

    let routine;
    let activeDayId: string | undefined;

    if (assignment) {
        // Cast via unknown to bypass "no overlap" error
        const assigned = assignment as unknown as { routineId: string; dayId: string };
        // Load the assigned routine
        const routineRes = await getRoutine(assigned.routineId);
        if (routineRes.success && routineRes.routine) {
            routine = routineRes.routine;
            activeDayId = assigned.dayId;
        }
    } else {
        // Fallback: Check general active routine (legacy/simple mode)
        const { routine: activeRoutine } = await getActiveRoutine();
        routine = activeRoutine;
    }

    if (!routine) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-16 w-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-white">Sin entrenamiento programado para hoy</h1>
                <p className="text-neutral-400 max-w-md">
                    No tienes una sesión asignada para esta fecha ni una rutina activa general.
                </p>
                <Link href="/dashboard">
                    <Button variant="outline" className="rounded-full border-neutral-700 text-white hover:bg-neutral-800">
                        Volver al inicio
                    </Button>
                </Link>
            </div>
        );
    }

    // Filter the routine to only show the relevant day
    let workoutRoutine = routine as unknown as WorkoutRoutine;
    let selectedDay;

    if (activeDayId) {
        selectedDay = workoutRoutine.schedule.find(d => d.id === activeDayId);
    } else {
        // Try to find a day that matches current weekday (case insensitive)
        selectedDay = workoutRoutine.schedule.find(d =>
            d.name.toLowerCase().trim() === dayName.toLowerCase().trim()
        );

        // If not found by name, fallback to schedule[0] (existing behavior) but at least we tried
        if (!selectedDay) {
            selectedDay = workoutRoutine.schedule[0];
        }
    }

    if (selectedDay) {
        // If the selected day is a rest day, show rest view
        if ((selectedDay as any).isRest) {
            return <RestDayView dayName={dayName} />;
        }

        workoutRoutine = {
            ...workoutRoutine,
            schedule: [selectedDay as any]
        };
    }

    return <WorkoutSession routine={workoutRoutine} />;
}
