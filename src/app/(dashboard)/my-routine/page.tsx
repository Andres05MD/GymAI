import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Dumbbell, Play, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getRoutines } from "@/actions/routine-actions";
import { differenceInCalendarWeeks } from "date-fns";
import { redirect } from "next/navigation";

export default async function MyRoutinePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { success, routines } = await getRoutines();

    // Asumimos que la lógica de backend devuelve solo activas para atletas
    const activeRoutine: any = routines && routines.length > 0 ? routines[0] : null;

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
                {session.user.role === "coach" && (
                    <Link href="/routines">
                        <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-600/10">
                            Ir a Mis Rutinas
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    // Calcular métricas
    const schedule = activeRoutine.schedule || [];
    const frequency = schedule.length;
    const totalExercises = schedule.reduce((acc: number, day: any) => acc + (day.exercises?.length || 0), 0);

    // Calcular semanas activo (aproximado)
    const startDate = activeRoutine.createdAt ? new Date(activeRoutine.createdAt) : new Date();
    const weeksActive = Math.max(1, differenceInCalendarWeeks(new Date(), startDate));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mi Rutina Actual</h2>
                    <p className="text-neutral-400">Plan de entrenamiento asignado.</p>
                </div>
                <Link href="/train">
                    <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/20 gap-2">
                        <Play className="h-5 w-5 fill-current" />
                        Iniciar Sesión Hoy
                    </Button>
                </Link>
            </div>

            {/* Info Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xl">
                        {frequency}
                    </div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Frecuencia</p>
                        <p className="text-white font-bold">Días / Semana</p>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xl">
                        {totalExercises}
                    </div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Volumen</p>
                        <p className="text-white font-bold">Ejercicios Totales</p>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center font-bold text-xl">
                        W{weeksActive}
                    </div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Antigüedad</p>
                        <p className="text-white font-bold">Semana {weeksActive}</p>
                    </div>
                </div>
            </div>

            {/* Rutina Activa */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-white">{activeRoutine.name}</h3>
                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                                Activa
                            </span>
                        </div>
                        {activeRoutine.description && (
                            <p className="text-neutral-400 text-sm max-w-2xl">{activeRoutine.description}</p>
                        )}
                    </div>
                </div>

                <div className="divide-y divide-neutral-800">
                    {schedule.map((day: any, index: number) => (
                        <div
                            key={index}
                            className="p-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 bg-black border border-neutral-800 rounded-2xl flex items-center justify-center font-black text-neutral-500 group-hover:border-red-500 group-hover:text-white transition-all">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">{day.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                                        <span className="flex items-center gap-1.5">
                                            <Dumbbell className="h-3.5 w-3.5" /> {day.exercises?.length || 0} ejercicios
                                        </span>
                                        {/* La duración es un estimado, podríamos calcularla basado en sets * 3 min */}
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> {day.exercises?.length * 4} - {day.exercises?.length * 6} min (est.)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Link href={`/my-routine/day/${index}`}>
                                <Button variant="ghost" className="rounded-full hover:bg-white hover:text-black">
                                    Ver Detalles
                                </Button>
                            </Link>
                        </div>
                    ))}

                    {schedule.length === 0 && (
                        <div className="p-12 text-center text-neutral-500">
                            Esta rutina no tiene días configurados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
