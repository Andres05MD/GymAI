"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { generateRoutinePlan } from "@/actions/ai-actions";
import { toast } from "sonner";

interface GeneratedScheduleDay {
    name: string;
    exercises: unknown[];
}

interface AIGeneratorDialogProps {
    onGenerate: (schedule: GeneratedScheduleDay[]) => void;
}

export function AIGeneratorDialog({ onGenerate }: AIGeneratorDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        goal: "Hipertrofia",
        level: "Intermedio",
        days: 4,
        equipment: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateRoutinePlan(formData.goal, formData.level, String(formData.days));
            if (result.success && result.exercises) {
                onGenerate(result.exercises);
                setOpen(false);
                toast.success("Rutina generada con éxito");
            } else {
                toast.error(result.error || "Error al generar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                    <Sparkles className="h-4 w-4" />
                    Autocompletar con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generador de Rutinas IA</DialogTitle>
                    <DialogDescription>
                        Describe los objetivos y la IA creará una estructura completa por ti.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Objetivo Principal</Label>
                        <Select
                            value={formData.goal}
                            onValueChange={(v) => setFormData({ ...formData, goal: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Hipertrofia">Hipertrofia (Ganancia Muscular)</SelectItem>
                                <SelectItem value="Fuerza">Fuerza Máxima (Powerlifting)</SelectItem>
                                <SelectItem value="Pérdida de Grasa">Pérdida de Grasa / Definición</SelectItem>
                                <SelectItem value="Resistencia">Resistencia Muscular</SelectItem>
                                <SelectItem value="Salud General">Salud / Mantenimiento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nivel</Label>
                            <Select
                                value={formData.level}
                                onValueChange={(v) => setFormData({ ...formData, level: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Principiante">Principiante</SelectItem>
                                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Días / Semana</Label>
                            <Input
                                type="number"
                                min={1} max={7}
                                value={formData.days}
                                onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Equipamiento (Opcional)</Label>
                        <Input
                            placeholder="Ej: Solo mancuernas, Bandas, Gym completo..."
                            value={formData.equipment}
                            onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                        />
                    </div>
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando plan...
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
