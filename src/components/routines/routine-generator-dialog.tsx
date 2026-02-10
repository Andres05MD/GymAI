"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { generateRoutinePlan } from "@/actions/ai-actions";
import { toast } from "sonner";

interface GeneratedExercise {
    exerciseName: string;
    sets: string | number;
    reps: string;
    description: string;
}

interface RoutineGeneratorProps {
    onGenerated: (exercises: GeneratedExercise[]) => void;
}

export function RoutineGeneratorDialog({ onGenerated }: RoutineGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [goal, setGoal] = useState("Hipertrofia");
    const [level, setLevel] = useState("Intermedio");
    const [split, setSplit] = useState("Full Body");

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const result = await generateRoutinePlan(split, level, "60");

            if (result.success) {
                toast.success("Rutina generada con IA");
                onGenerated(result.exercises || []);
                setIsOpen(false);
            } else {
                toast.error("Error al generar rutina");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <Sparkles className="mr-2 h-4 w-4" /> Generar con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Asistente de Rutinas IA
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Objetivo Principal</Label>
                        <Select value={goal} onValueChange={setGoal}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="Hipertrofia">Hipertrofia (Masa Muscular)</SelectItem>
                                <SelectItem value="Fuerza">Fuerza Máxima</SelectItem>
                                <SelectItem value="Resistencia">Resistencia / Pérdida de Grasa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Nivel del Atleta</Label>
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="Principiante">Principiante</SelectItem>
                                <SelectItem value="Intermedio">Intermedio</SelectItem>
                                <SelectItem value="Avanzado">Avanzado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Sesión (Split)</Label>
                        <Select value={split} onValueChange={setSplit}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="Full Body">Full Body</SelectItem>
                                <SelectItem value="Torso">Torso (Empuje/Tracción)</SelectItem>
                                <SelectItem value="Pierna">Pierna</SelectItem>
                                <SelectItem value="Push">Empuje (Push)</SelectItem>
                                <SelectItem value="Pull">Tracción (Pull)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-linear-to-r from-primary to-orange-500 text-black font-bold hover:opacity-90"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Diseñando Rutina...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> Generar Rutina
                        </>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
