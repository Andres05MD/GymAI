"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell, Loader2, CalendarDays, ArrowLeft, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { assignRoutineDay, assignRoutineWeek } from "@/actions/schedule-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoutineDay {
    id: string;
    name: string;
}

interface Routine {
    id: string;
    name?: string;
    description?: string;
    schedule?: RoutineDay[];
    createdAt?: string;
    updatedAt?: string;
}

interface AssignRoutineModalProps {
    athleteId: string;
    athleteName: string;
    routines: Routine[];
    className?: string;
}

export function AssignRoutineModal({ athleteId, athleteName, routines = [], className }: AssignRoutineModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Routine, 2: Configure, 3: Confirm Conflict
    const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // Assignment State
    const [mode, setMode] = useState<"daily" | "weekly">("daily");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedDayId, setSelectedDayId] = useState<string>("");
    const [conflictData, setConflictData] = useState<{ message: string, conflict: boolean } | null>(null);

    const router = useRouter();

    const filteredRoutines = routines.filter(routine =>
        routine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectRoutine = (routine: Routine) => {
        setSelectedRoutine(routine);
        // We will now force the coach to select the specific day
        setSelectedDayId("");
        setStep(2);
        setConflictData(null);
    };

    const handleBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) {
            setStep(1);
            setSelectedRoutine(null);
        }
    };

    const handleAssign = async (confirmReplace = false) => {
        if (!selectedRoutine || !date) return;

        setLoading(true);
        try {
            let result;

            if (mode === "daily") {
                if (!selectedDayId) {
                    toast.error("Debes seleccionar un día de la rutina");
                    setLoading(false);
                    return;
                }
                const dateStr = format(date, "yyyy-MM-dd");
                result = await assignRoutineDay({
                    athleteId,
                    routineId: selectedRoutine.id,
                    dayId: selectedDayId,
                    date: dateStr
                }, confirmReplace);
            } else {
                // Weekly
                if (!selectedRoutine.schedule || selectedRoutine.schedule.length === 0) {
                    toast.error("Esta rutina no tiene días programados");
                    setLoading(false);
                    return;
                }

                const days = selectedRoutine.schedule.map((day, index) => ({
                    dayId: day.id,
                    date: format(addDays(date, index), "yyyy-MM-dd")
                }));

                result = await assignRoutineWeek({
                    athleteId,
                    routineId: selectedRoutine.id,
                    startDate: format(date, "yyyy-MM-dd"),
                    days
                }, confirmReplace);
            }

            if (result.success) {
                toast.success(`Rutina asignada a ${athleteName}`);
                setOpen(false);
                setStep(1);
                router.refresh();
            } else if (result.requiresConfirmation) {
                setConflictData({ message: result.message || "Conflicto detectado", conflict: true });
                setStep(3);
            } else {
                toast.error(result.error || "Error al asignar");
            }
        } catch (_error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const reset = (openState: boolean) => {
        setOpen(openState);
        if (!openState) {
            setTimeout(() => {
                setStep(1);
                setSelectedRoutine(null);
                setConflictData(null);
                setDate(new Date());
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogTrigger asChild>
                <Button className={cn("bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-red-900/20 transition-all hover:scale-105", className)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Rutina
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[600px] p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-neutral-800 flex items-center gap-2">
                    {step > 1 && (
                        <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2 mr-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <DialogTitle className="text-xl font-bold">
                            {step === 1 ? `Asignar Rutina a ${athleteName}` :
                                step === 2 ? "Configurar Asignación" : "Conflictos Detectados"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            {step === 1 ? "Selecciona una plantilla." :
                                step === 2 ? `Asignando: ${selectedRoutine?.name}` : "Revisa los conflictos antes de continuar."}
                        </DialogDescription>
                    </div>
                </div>

                {/* Content Step 1: List Routines */}
                {step === 1 && (
                    <>
                        <div className="px-6 pt-4 pb-2 relative">
                            <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                placeholder="Buscar rutinas..."
                                className="bg-neutral-950/50 border-neutral-800 pl-10 h-10 text-sm focus-visible:ring-red-500 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[400px]">
                            <div className="p-4 space-y-3">
                                {filteredRoutines.map((routine) => (
                                    <div
                                        key={routine.id}
                                        onClick={() => handleSelectRoutine(routine)}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950/30 border border-neutral-800 hover:border-red-500/30 hover:bg-neutral-800/30 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-red-500 transition-colors">
                                                <Dumbbell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm md:text-base group-hover:text-red-500 transition-colors">
                                                    {routine.name || "Sin nombre"}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {routine.schedule?.length || 0} Días
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </>
                )}

                {/* Content Step 2: Configure */}
                {step === 2 && selectedRoutine && (
                    <div className="p-6">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-neutral-950 mb-6">
                                <TabsTrigger value="daily">Día Específico</TabsTrigger>
                                <TabsTrigger value="weekly">Semana Completa</TabsTrigger>
                            </TabsList>

                            <TabsContent value="daily" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Día de la Rutina</label>
                                    <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                                        <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                            <SelectValue placeholder="Selecciona un día" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                            {selectedRoutine.schedule?.map((day: any) => (
                                                <SelectItem key={day.id} value={day.id} className="focus:bg-neutral-800 focus:text-white">
                                                    {day.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Fecha de Asignación</label>
                                    <div className="flex justify-center p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            locale={es}
                                            className="rounded-md"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="weekly" className="space-y-4">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-sm mb-4">
                                    Se asignarán los {selectedRoutine.schedule?.length} días de la rutina consecutivamente a partir de la fecha seleccionada.
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Fecha de Inicio</label>
                                    <div className="flex justify-center p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            locale={es}
                                            className="rounded-md"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={() => handleAssign(false)}
                                disabled={loading || !date || (mode === "daily" && !selectedDayId)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold w-full"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Asignar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content Step 3: Conflict */}
                {step === 3 && (
                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Confirmar Reemplazo</h3>
                        <p className="text-neutral-400 text-sm mb-6">
                            {conflictData?.message} <br />
                            ¿Deseas reemplazar las rutinas existentes?
                        </p>
                        <div className="flex w-full gap-3">
                            <Button variant="outline" className="flex-1 border-neutral-700 hover:bg-neutral-800 text-white" onClick={() => setStep(2)}>
                                Cancelar
                            </Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleAssign(true)} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Sí, Reemplazar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
