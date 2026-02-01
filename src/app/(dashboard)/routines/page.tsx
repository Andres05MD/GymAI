"use client";

import { useEffect, useState } from "react";
import { getRoutines, deleteRoutine } from "@/actions/routine-actions";
import { getCoachAthletes } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ClipboardList, Calendar, Trash, Edit, Wand2, Users } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignRoutineDialog } from "@/components/routines/assign-routine-dialog";

export default function RoutinesPage() {
    const [routines, setRoutines] = useState<any[]>([]);
    const [athletes, setAthletes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [routinesRes, athletesRes] = await Promise.all([
            getRoutines(),
            getCoachAthletes()
        ]);

        if (routinesRes.success) setRoutines(routinesRes.routines || []);
        if (athletesRes.success) setAthletes(athletesRes.athletes || []);

        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar esta rutina? Se perderá la asignación actual.")) {
            const res = await deleteRoutine(id);
            if (res.success) {
                toast.success("Rutina eliminada");
                loadData();
            } else {
                toast.error(res.error);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestor de Rutinas</h1>
                    <p className="text-neutral-400">Diseña planes de entrenamiento o deja que la IA lo haga por ti.</p>
                </div>

                <Link href="/routines/new">
                    <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-900/20">
                        <Plus className="w-5 h-5 mr-2" /> Nueva Rutina
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl bg-neutral-900" />)}
                </div>
            ) : routines.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/50 rounded-3xl border border-neutral-800">
                    <ClipboardList className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No tienes rutinas creadas</h3>
                    <p className="text-neutral-500 mb-6">Comienza creando tu primera rutina manualmente o con IA.</p>
                    <Link href="/routines/new">
                        <Button variant="outline" className="rounded-full border-neutral-700 text-white hover:bg-neutral-800">
                            Crear Rutina
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routines.map((routine) => (
                        <Card key={routine.id} className="group bg-neutral-900/50 border-neutral-800 hover:border-red-600/50 transition-all rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-red-900/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex justify-between items-start gap-2">
                                    <span className="text-xl font-bold text-white line-clamp-1">{routine.name}</span>
                                    {routine.active && (
                                        <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 border border-green-500/20">
                                            Activa
                                        </span>
                                    )}
                                </CardTitle>
                                <p className="text-sm text-neutral-400 line-clamp-2 min-h-[40px]">
                                    {routine.description || "Sin descripción"}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {routine.schedule?.length || 0} Días/sem
                                        </div>
                                        {/* Future: Show assigned athlete count or name */}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <div className="flex-1 flex gap-2">
                                            <Link href={`/routines/${routine.id}`} className="flex-1">
                                                <Button variant="secondary" className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl font-bold h-9">
                                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                                </Button>
                                            </Link>
                                            <AssignRoutineDialog routineId={routine.id} athletes={athletes} />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl h-9 w-9"
                                            onClick={() => handleDelete(routine.id)}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
