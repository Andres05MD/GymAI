"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Check } from "lucide-react";
import { assignRoutineToAthlete } from "@/actions/training-actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Athlete {
    id: string;
    name?: string;
    email?: string;
    // otros campos opcionales
}

export function AssignRoutineDialog({ routineId, athletes }: { routineId: string, athletes: Athlete[] }) {
    const [open, setOpen] = useState(false);
    const [selectedAthlete, setSelectedAthlete] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        if (!selectedAthlete) return;
        setLoading(true);
        try {
            const res = await assignRoutineToAthlete(routineId, selectedAthlete);
            if (res.success) {
                toast.success("Rutina asignada correctamente");
                setOpen(false);
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-neutral-400 hover:text-white border-neutral-800">
                    <Users className="w-4 h-4" /> Asignar
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>Asignar Rutina a Atleta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-neutral-400">
                        Se creará una copia de esta rutina para el atleta seleccionado. Su rutina activa actual será desactivada.
                    </p>
                    <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                        <SelectTrigger className="bg-black border-neutral-800">
                            <SelectValue placeholder="Seleccionar Atleta" />
                        </SelectTrigger>
                        <SelectContent>
                            {athletes?.map((athlete) => (
                                <SelectItem key={athlete.id} value={athlete.id}>
                                    {athlete.name} ({athlete.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedAthlete}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        {loading ? "Asignando..." : "Confirmar Asignación"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
