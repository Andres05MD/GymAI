import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Dumbbell, Play, AlertCircle, ClipboardList, Moon, Info } from "lucide-react";
import Link from "next/link";
import { getRoutines } from "@/actions/routine-actions";
import { differenceInCalendarWeeks } from "date-fns";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

// Interfaces para la rutina
interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: unknown[];
}

interface ScheduleDay {
    name: string;
    exercises?: ScheduleExercise[];
    isRest?: boolean;
}

interface ActiveRoutine {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    startDate?: any;
    schedule: ScheduleDay[];
}

export default async function MyRoutinePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { success, routines } = await getRoutines();

    // Asumimos que la lógica de backend devuelve solo activas para atletas
    const activeRoutine: ActiveRoutine | null = routines && routines.length > 0 ? (routines[0] as unknown as ActiveRoutine) : null;

    if (!activeRoutine) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-24 w-24 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                    <Dumbbell className="h-10 w-10 text-neutral-500" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h2 className="text-3xl font-bold text-white">Sin rutina asignada</h2>
                    <p className="text-neutral-400">
                        Tu entrenador aún no te ha asignado un plan de entrenamiento activo.
                        Contacta con él o espera a que se actualice tu perfil.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    {session.user.role === "coach" && (
                        <Link href="/routines">
                            <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-600/10">
                                Ir a Mis Rutinas
                            </Button>
                        </Link>
                    )}
                    <Link href="/train/log">
                        <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-full gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Registrar Sesión Pasada
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Calcular métricas
    const schedule = activeRoutine.schedule || [];
    const frequency = schedule.length;
    const totalExercises = schedule.reduce((acc: number, day: ScheduleDay) => acc + (day.exercises?.length || 0), 0);

    const startDateRaw = activeRoutine.startDate ? (typeof activeRoutine.startDate === 'string' ? new Date(activeRoutine.startDate) : activeRoutine.startDate) : (activeRoutine.createdAt ? new Date(activeRoutine.createdAt) : new Date());
    const isFuture = startDateRaw > new Date();
    const weeksActive = Math.max(1, differenceInCalendarWeeks(new Date(), startDateRaw));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mi Rutina Actual</h2>
                    <p className="text-neutral-400">Plan de entrenamiento asignado.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/train/log">
                        <Button variant="outline" className="w-full sm:w-auto rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 font-bold h-12 px-6 gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Registrar Sesión Pasada
                        </Button>
                    </Link>
                    <Link href="/train">
                        <Button className="w-full sm:w-auto rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/20 gap-2">
                            <Play className="h-5 w-5 fill-current" />
                            Iniciar Sesión Hoy
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Info Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="h-14 w-14 rounded-2xl bg-neutral-800 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                        {frequency}
                    </div>
                    <div>
                        <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">Frecuencia</p>
                        <p className="text-white font-bold text-lg">Días / Semana</p>
                    </div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="h-14 w-14 rounded-2xl bg-neutral-800 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                        {totalExercises}
                    </div>
                    <div>
                        <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">Volumen</p>
                        <p className="text-white font-bold text-lg">Ejercicios Totales</p>
                    </div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-900/20 text-emerald-500 flex items-center justify-center font-bold text-xl shadow-lg border border-emerald-900/30 group-hover:scale-105 transition-transform">
                        W{weeksActive}
                    </div>
                    <div>
                        <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">Antigüedad</p>
                        <p className="text-white font-bold text-lg">Semana {weeksActive}</p>
                    </div>
                </div>
            </div>

            {/* Banner si comienza en el futuro */}
            {isFuture && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3 text-blue-400">
                    <Info className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Esta rutina está programada para comenzar el <span className="font-bold underline">próximo lunes {startDateRaw.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>. ¡Prepárate!
                    </p>
                </div>
            )}

            {/* Rutina Activa */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">
                            {schedule.length === 1
                                ? "Rutina Compuesta"
                                : activeRoutine.name.replace(/\s*\(Assigned\)/gi, "").trim()}
                        </h3>
                        {activeRoutine.description && (
                            <p className="text-neutral-400 text-sm max-w-2xl leading-relaxed">{activeRoutine.description}</p>
                        )}
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20 self-start md:self-auto">
                        Rutina Activa
                    </span>
                </div>

                <div className="grid gap-4">
                    {schedule.map((day: ScheduleDay, index: number) => (
                        <div
                            key={index}
                            className={cn(
                                "border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between transition-all group relative overflow-hidden",
                                day.isRest
                                    ? "bg-neutral-900/30 border-neutral-800/50 grayscale opacity-70"
                                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                            )}
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 to-white/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                <div className={cn(
                                    "h-16 w-16 border rounded-2xl flex items-center justify-center font-black text-2xl transition-all",
                                    day.isRest
                                        ? "bg-neutral-900 border-neutral-800 text-neutral-700"
                                        : "bg-black border-neutral-800 text-neutral-600 group-hover:text-white group-hover:border-red-900/50 group-hover:bg-red-900/10"
                                )}>
                                    {day.isRest ? <Moon className="h-7 w-7" /> : index + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn(
                                        "font-bold text-lg mb-1 transition-colors",
                                        day.isRest ? "text-neutral-600" : "text-white group-hover:text-red-500"
                                    )}>{day.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                                        {day.isRest ? (
                                            <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-black text-neutral-700">
                                                Día de Descanso
                                            </span>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md">
                                                    <Dumbbell className="h-3.5 w-3.5" /> {day.exercises?.length || 0} Ejercicios
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-neutral-800/50 px-2 py-1 rounded-md">
                                                    <Clock className="h-3.5 w-3.5" /> {(day.exercises?.length || 0) * 4} min
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-0 w-full md:w-auto relative z-10">
                                {!day.isRest && (
                                    <Link href={`/my-routine/day/${index}`} className="block">
                                        <Button variant="outline" className="w-full md:w-auto rounded-xl border-neutral-700 hover:bg-white hover:text-black font-bold transition-all">
                                            Ver Detalles
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}

                    {schedule.length === 0 && (
                        <div className="p-12 text-center text-neutral-500 bg-neutral-900 rounded-4xl border border-neutral-800">
                            Esta rutina no tiene días configurados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
