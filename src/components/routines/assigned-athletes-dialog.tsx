"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import { getAssignedAthletes } from "@/actions/routine-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Athlete {
    id: string;
    name: string;
    image: string | null;
    email: string;
}

export function AssignedAthletesDialog({ routineId, routineName }: { routineId: string, routineName: string }) {
    const [open, setOpen] = useState(false);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(false);

    const handleOpen = async (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && athletes.length === 0) {
            setLoading(true);
            const res = await getAssignedAthletes(routineId);
            if (res.success) {
                setAthletes(res.athletes as Athlete[]);
            }
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-bold bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all"
                >
                    <Users className="w-3 h-3 mr-1" />
                    {loading ? "..." : "VER ATLETAS"}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[400px] p-0 overflow-hidden">
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-500" />
                            Atletas Asignados
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Usuarios que tienen activa la rutina <span className="text-white font-medium">{routineName}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[300px] mt-6 pr-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-neutral-700" />
                                <p className="text-sm text-neutral-500">Cargando atletas...</p>
                            </div>
                        ) : athletes.length > 0 ? (
                            <div className="space-y-3">
                                {athletes.map((athlete) => (
                                    <div key={athlete.id} className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-2xl">
                                        <Avatar className="h-10 w-10 border border-neutral-800">
                                            <AvatarImage src={athlete.image || undefined} />
                                            <AvatarFallback className="bg-neutral-800 text-xs font-bold text-neutral-400">
                                                {athlete.name?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate">{athlete.name}</h4>
                                            <p className="text-xs text-neutral-500 truncate">{athlete.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                                <p className="text-sm text-neutral-600 italic">No hay atletas con esta rutina activa actualmente.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
