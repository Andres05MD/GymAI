"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { assignRoutineToAthlete, getCoachRoutines } from "@/actions/routine-actions";
import { toast } from "sonner";
import { Loader2, Check, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AssignRoutineDialogProps {
    athleteId: string;
    athleteName: string;
    trigger?: React.ReactNode;
}

export function AssignRoutineDialog({ athleteId, athleteName, trigger }: AssignRoutineDialogProps) {
    const [open, setOpen] = useState(false);
    const [routines, setRoutines] = useState<any[]>([]);
    const [loadingRoutines, setLoadingRoutines] = useState(false);
    const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        if (open) {
            loadRoutines();
        }
    }, [open]);

    const loadRoutines = async () => {
        setLoadingRoutines(true);
        try {
            const result = await getCoachRoutines();
            if (result.success) {
                setRoutines(result.routines || []);
            }
        } catch (error) {
            toast.error("Error al cargar rutinas");
        } finally {
            setLoadingRoutines(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedRoutineId) return;
        setIsAssigning(true);
        try {
            const result = await assignRoutineToAthlete(athleteId, selectedRoutineId);
            if (result.success) {
                toast.success(`Rutina asignada a ${athleteName}`);
                setOpen(false);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al asignar");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Asignar Rutina</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-neutral-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Asignar Rutina</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Selecciona la rutina que deseas activar para {athleteName}.
                        Esto reemplazará su rutina actual.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loadingRoutines ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : routines.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-neutral-800 rounded-lg">
                            <p className="text-neutral-500 mb-2">No tienes rutinas creadas.</p>
                            <Button variant="link" className="text-primary">Crear nueva rutina</Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {routines.map((routine) => (
                                    <div
                                        key={routine.id}
                                        onClick={() => setSelectedRoutineId(routine.id)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between
                                            ${selectedRoutineId === routine.id
                                                ? "bg-primary/10 border-primary shadow-[0_0_15px_-5px_var(--primary)]"
                                                : "bg-neutral-900/50 border-white/5 hover:border-white/20"}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                h-10 w-10 rounded-lg flex items-center justify-center
                                                ${selectedRoutineId === routine.id ? "bg-primary text-black" : "bg-neutral-800 text-neutral-400"}
                                            `}>
                                                <Dumbbell className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{routine.name}</h4>
                                                <p className="text-xs text-neutral-500">
                                                    {(routine.schedule?.length || 0) === 1 ? "Diaria" : `Semanal · ${routine.schedule?.length || 0} días`}
                                                    {" · "}
                                                    {routine.schedule?.reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0) || 0} ejercicios
                                                </p>
                                            </div>
                                        </div>
                                        {selectedRoutineId === routine.id && (
                                            <Check className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedRoutineId || isAssigning}
                        className="bg-primary text-black hover:bg-primary/90 font-bold"
                    >
                        {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmar Asignación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
