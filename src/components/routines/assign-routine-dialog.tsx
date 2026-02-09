"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Search, Loader2 } from "lucide-react";
import { assignRoutineToAthlete } from "@/actions/training-actions";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState<string | null>(null); // storing id of athlete being assigned

    const filteredAthletes = athletes.filter(athlete =>
        athlete.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = async (athleteId: string, athleteName: string) => {
        setLoading(athleteId);
        try {
            const res = await assignRoutineToAthlete(routineId, athleteId);
            if (res.success) {
                toast.success(`Rutina asignada a ${athleteName}`);
                setOpen(false);
            } else {
                toast.error(res.error || "Error al asignar");
            }
        } catch (_error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-neutral-800 text-white hover:bg-neutral-700/80 rounded-xl font-bold h-10 shadow-sm transition-all hover:scale-[1.02]">
                    <Users className="w-4 h-4 mr-2" /> ASIGNAR
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <div className="p-6 pb-4 border-b border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Asignar Rutina</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Selecciona un atleta para asignarle esta rutina.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Buscar atleta..."
                            className="bg-neutral-950/50 border-neutral-800 pl-10 h-10 text-sm focus-visible:ring-red-500 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="h-[350px]">
                    <div className="p-2 space-y-1">
                        {filteredAthletes.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-sm text-neutral-500">
                                    {searchTerm ? "No se encontraron atletas." : "No tienes atletas asignados."}
                                </p>
                            </div>
                        ) : (
                            filteredAthletes.map((athlete) => (
                                <div
                                    key={athlete.id}
                                    className="group flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Avatar className="h-10 w-10 border border-neutral-800">
                                            <AvatarImage src={athlete.image} />
                                            <AvatarFallback className="bg-neutral-800 text-xs font-bold">
                                                {athlete.name?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <h4 className="font-bold text-white text-sm truncate">
                                                {athlete.name || "Sin nombre"}
                                            </h4>
                                            <p className="text-xs text-neutral-500 truncate">
                                                {athlete.email}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => handleAssign(athlete.id, athlete.name || "Atleta")}
                                        disabled={loading !== null}
                                        className={cn(
                                            "shrink-0 font-bold h-8 px-3 text-xs",
                                            loading === athlete.id
                                                ? "bg-neutral-800 text-neutral-400"
                                                : "bg-white text-black hover:bg-red-600 hover:text-white"
                                        )}
                                    >
                                        {loading === athlete.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin py-0.5" />
                                        ) : (
                                            "Asignar"
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-center">
                    <p className="text-[10px] text-neutral-600">
                        La asignación reemplazará cualquier rutina activa previa del atleta.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
