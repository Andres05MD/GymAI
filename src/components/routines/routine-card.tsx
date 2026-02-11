"use client";

import { deleteRoutine } from "@/actions/routine-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trash, Edit } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AssignRoutineDialog } from "@/components/routines/assign-routine-dialog";
import { useState } from "react";

// Interfaces para la tarjeta de rutina
interface RoutineScheduleDay {
    name: string;
    exercises?: unknown[];
}

interface Routine {
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    schedule?: RoutineScheduleDay[];
}

interface Athlete {
    id: string;
    name?: string;
    email?: string;
}

interface RoutineCardProps {
    routine: Routine;
    athletes: Athlete[];
}

export function RoutineCard({ routine, athletes }: RoutineCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirm("¿Eliminar esta rutina? Se perderá la asignación actual.")) {
            setIsDeleting(true);
            const res = await deleteRoutine(routine.id);
            if (res.success) {
                toast.success("Rutina eliminada");
                router.refresh(); // Refresca los datos del servidor
            } else {
                toast.error(res.error);
            }
            setIsDeleting(false);
        }
    };

    // Calcular estadísticas básicas
    const totalExercises = routine.schedule?.reduce((acc: number, day: any) => acc + (day.exercises?.length || 0), 0) || 0;
    const dayCount = routine.schedule?.length || 0;
    const isDaily = (routine as any).type === 'daily';


    return (
        <Card className="group relative bg-neutral-900 border-neutral-800 hover:border-red-600/50 transition-all duration-300 rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-[0_0_30px_-10px_rgba(220,38,38,0.2)] flex flex-col h-full">
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <CardHeader className="p-4 md:p-6 pb-3 relative z-10">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        {isDaily ? (
                            <span className="bg-neutral-800 text-neutral-400 text-[9px] md:text-[10px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider border border-neutral-700">
                                Diaria
                            </span>
                        ) : (
                            <span className="bg-neutral-800 text-neutral-400 text-[9px] md:text-[10px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider border border-neutral-700">
                                Semanal
                            </span>
                        )}
                        {routine.active && (
                            <span className="bg-green-500/10 text-green-500 text-[9px] md:text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-green-500/20 shadow-[0_0_10px_-4px_rgba(34,197,94,0.5)]">
                                Activa
                            </span>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-full h-8 w-8 -mr-1 -mt-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>

                <CardTitle className="text-lg md:text-xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-red-500 transition-colors">
                    {routine.name}
                </CardTitle>
                <p className="text-xs md:text-sm text-neutral-500 line-clamp-2 mt-2 font-medium">
                    {routine.description || "Sin descripción definida."}
                </p>
            </CardHeader>

            <CardContent className="p-4 md:p-6 mt-auto relative z-10">
                <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-neutral-400 bg-neutral-950/50 p-2.5 md:p-3 rounded-xl border border-neutral-800/50">
                        <div className="flex flex-col items-center justify-center p-0.5">
                            <span className="text-white font-bold text-sm md:text-base">{dayCount}</span>
                            <span className="uppercase tracking-wider text-[9px] md:text-[10px]">Días</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-0.5 border-l border-neutral-800">
                            <span className="text-white font-bold text-sm md:text-base">{totalExercises}</span>
                            <span className="uppercase tracking-wider text-[9px] md:text-[10px]">Ejercicios</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <Link href={`/routines/${routine.id}`} className="block w-full">
                                <Button className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl font-bold h-11 sm:h-10 shadow-sm transition-all hover:scale-[1.02]">
                                    <Edit className="w-4 h-4 mr-2" /> EDITAR
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1">
                            <AssignRoutineDialog routineId={routine.id} athletes={athletes} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
