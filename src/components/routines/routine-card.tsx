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

interface RoutineCardProps {
    routine: any;
    athletes: any[];
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

    return (
        <Card className="group bg-neutral-900/50 border-neutral-800 hover:border-red-600/50 transition-all rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-red-900/10">
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
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
