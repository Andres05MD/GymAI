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

// Tipo inline para compatibilidad con WorkoutSession
type WorkoutRoutine = {
    id: string;
    name: string;
    schedule: Array<{
        id?: string;
        name: string;
        isRest?: boolean;
        exercises: Array<{
            exerciseId?: string;
            exerciseName: string;
            sets: Array<{ reps?: number; weight?: number }>;
        }>;
    }>;
};

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
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="relative space-y-12 max-w-md w-full animate-in fade-in zoom-in duration-700">
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        <AlertCircle className="w-12 h-12 text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                            Frecuencia No Encontrada
                        </h1>
                        <p className="text-neutral-500 font-bold text-sm leading-relaxed">
                            No tienes una rutina de entrenamiento asignada para hoy. Pulsa el botón inferior para volver a la base.
                        </p>
                    </div>

                    <Link href="/dashboard" className="block">
                        <Button className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95">
                            Retorno Seguro
                        </Button>
                    </Link>
                </div>
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
