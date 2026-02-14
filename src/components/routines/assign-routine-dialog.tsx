"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { assignRoutineToAthlete } from "@/actions/routine-actions";
import { Users, Search, Loader2, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Athlete {
    id: string;
    name?: string;
    email?: string;
    image?: string;
}

export function AssignRoutineDialog({ routineId, athletes }: { routineId: string, athletes: Athlete[] }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'athlete' | 'date'>('athlete');
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredAthletes = athletes.filter(athlete =>
        athlete.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAthlete = (athlete: Athlete) => {
        setSelectedAthlete(athlete);
        setStep('date');
    };

    const handleBack = () => {
        setStep('athlete');
        setSelectedAthlete(null);
    };

    const handleConfirmAssign = async () => {
        if (!selectedAthlete) return;

        setIsSubmitting(true);
        try {
            const res = await assignRoutineToAthlete(selectedAthlete.id, routineId);
            if (res.success) {
                toast.success(`Rutina asignada a ${selectedAthlete.name || "Atleta"}`, {
                    description: `Días identificados automáticamente. Inicio: Próximo Lunes.`
                });
                setOpen(false);
                // Reset states
                setStep('athlete');
                setSelectedAthlete(null);
                setSearchTerm("");
            } else {
                toast.error(res.error || "Error al asignar");
            }
        } catch (_error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setTimeout(() => {
                    setStep('athlete');
                    setSelectedAthlete(null);
                    setSearchTerm("");
                }, 300);
            }
        }}>
            <DialogTrigger asChild>
                <Button className="w-full bg-neutral-800 text-white hover:bg-neutral-700/80 rounded-xl font-bold h-11 sm:h-10 shadow-sm transition-all hover:scale-[1.02]">
                    <Users className="w-4 h-4 mr-2" /> ASIGNAR
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[400px] p-0 overflow-hidden gap-0">

                {/* Header Dinámico */}
                <div className="p-4 border-b border-neutral-800 bg-neutral-900">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            {step === 'date' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2 text-neutral-400 hover:text-white" onClick={handleBack}>
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            )}
                            <DialogTitle className="text-lg font-bold">
                                {step === 'athlete' ? 'Asignar Rutina' : 'Confirmar Asignación'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-neutral-400 text-xs">
                            {step === 'athlete'
                                ? 'Selecciona un atleta de tu lista.'
                                : `¿Confirmas la asignación automática para ${selectedAthlete?.name?.split(" ")[0]}?`}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {step === 'athlete' ? (
                    <>
                        <div className="px-4 py-3 bg-neutral-900/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <Input
                                    placeholder="Buscar atleta..."
                                    className="bg-neutral-950 border-neutral-800 pl-10 h-9 text-sm focus-visible:ring-red-500 rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="h-[300px]">
                            <div className="p-2 space-y-1">
                                {filteredAthletes.length === 0 ? (
                                    <div className="text-center py-10 px-4">
                                        <p className="text-sm text-neutral-500">
                                            {searchTerm ? "No se encontraron atletas." : "No tienes atletas asignados."}
                                        </p>
                                    </div>
                                ) : (
                                    filteredAthletes.map((athlete) => (
                                        <button
                                            key={athlete.id}
                                            onClick={() => handleSelectAthlete(athlete)}
                                            className="w-full group flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar className="h-9 w-9 border border-neutral-800">
                                                    <AvatarImage src={athlete.image} />
                                                    <AvatarFallback className="bg-neutral-800 text-[10px] font-bold">
                                                        {athlete.name?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="truncate">
                                                    <h4 className="font-bold text-white text-sm truncate">
                                                        {athlete.name || "Sin nombre"}
                                                    </h4>
                                                    <p className="text-[10px] text-neutral-500 truncate">
                                                        {athlete.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-neutral-600 group-hover:text-white">
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex flex-col">
                        <div className="flex-1 p-6 space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 text-blue-400">
                                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold uppercase tracking-tight">Programación Automática</p>
                                    <p className="text-xs leading-relaxed opacity-80 text-neutral-300">
                                        La rutina se organizará automáticamente de Lunes a Viernes (según el número de días) y comenzará el
                                        <span className="text-blue-400 font-bold"> próximo lunes</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Atleta</span>
                                    <span className="text-white font-bold">{selectedAthlete?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Días de descanso</span>
                                    <span className="text-white font-bold">Sábado y Domingo</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                            <Button
                                className="w-full bg-white text-black hover:bg-neutral-200 font-bold"
                                onClick={handleConfirmAssign}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Asignando...
                                    </>
                                ) : (
                                    "Confirmar Asignación"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
