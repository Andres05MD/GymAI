"use client";

import { useState, ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logBodyMeasurements } from "@/actions/measurement-actions";

const LogSchema = z.object({
    date: z.string(),
    weight: z.coerce.number().optional(),
    chest: z.coerce.number().optional(),
    waist: z.coerce.number().optional(),
    hips: z.coerce.number().optional(),
    shoulders: z.coerce.number().optional(),
    glutes: z.coerce.number().optional(),

    bicepsLeft: z.coerce.number().optional(),
    bicepsRight: z.coerce.number().optional(),
    forearmsLeft: z.coerce.number().optional(),
    forearmsRight: z.coerce.number().optional(),
    quadsLeft: z.coerce.number().optional(),
    quadsRight: z.coerce.number().optional(),
    calvesLeft: z.coerce.number().optional(),
    calvesRight: z.coerce.number().optional(),

    notes: z.string().optional(),
});

interface LogMeasurementDialogProps {
    onLogSuccess?: () => void;
    children?: ReactNode;
    initialData?: Record<string, number>;
    initialWeight?: number;
}

export function LogMeasurementDialog({ onLogSuccess, children, initialData, initialWeight }: LogMeasurementDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof LogSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(LogSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            weight: initialWeight,
            ...initialData
        }
    });

    // Update form values when dialog opens to ensure fresh data
    useEffect(() => {
        if (open) {
            form.reset({
                date: new Date().toISOString().split('T')[0],
                weight: initialWeight,
                ...initialData,
                notes: "" // Always reset notes to empty
            });
        }
    }, [open, initialData, initialWeight, form]);

    const onSubmit = async (data: z.infer<typeof LogSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await logBodyMeasurements(data);
            if (result.success) {
                toast.success("Medidas registradas correctamente");
                setOpen(false);
                form.reset();
                if (onLogSuccess) onLogSuccess();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al guardar medidas");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 w-full md:w-auto">
                        <Plus className="w-4 h-4" /> Registrar Medidas
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registrar Progreso Corporal</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-neutral-800">

                    {/* General */}
                    <div className="bg-neutral-950/30 p-5 rounded-2xl border border-neutral-800/50 space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Fecha</Label>
                                <Input type="date" {...form.register("date")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Peso (kg)</Label>
                                <div className="relative">
                                    <Input type="number" step="0.1" {...form.register("weight")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white pl-4 placeholder:text-neutral-500" placeholder="0.0" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 text-sm font-medium">kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Torso */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
                            <div className="w-1 h-5 bg-linear-to-b from-red-500 to-red-800 rounded-full"></div>
                            <h4 className="text-base font-bold text-white uppercase tracking-wider">Torso</h4>
                            <span className="text-xs text-neutral-500 font-normal ml-auto">En centímetros</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">Pecho / Espalda</Label>
                                <Input type="number" step="0.1" {...form.register("chest")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">Hombros</Label>
                                <Input type="number" step="0.1" {...form.register("shoulders")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">Cintura</Label>
                                <Input type="number" step="0.1" {...form.register("waist")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">Cadera</Label>
                                <Input type="number" step="0.1" {...form.register("hips")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">Glúteos</Label>
                                <Input type="number" step="0.1" {...form.register("glutes")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* Extremidades */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
                            <div className="w-1 h-5 bg-linear-to-b from-red-500 to-red-800 rounded-full"></div>
                            <h4 className="text-base font-bold text-white uppercase tracking-wider">Extremidades</h4>
                            <span className="text-xs text-neutral-500 font-normal ml-auto">Izq / Der (cm)</span>
                        </div>

                        <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 text-center px-1">
                                <div className="col-span-4 text-left">Zona Muscular</div>
                                <div className="col-span-4">Izquierda</div>
                                <div className="col-span-4">Derecha</div>
                            </div>

                            <div className="space-y-3">
                                {/* Row Biceps */}
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Bíceps</Label>
                                    <Input type="number" step="0.1" {...form.register("bicepsLeft")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                    <Input type="number" step="0.1" {...form.register("bicepsRight")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                </div>

                                {/* Row Antebrazos */}
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Antebrazos</Label>
                                    <Input type="number" step="0.1" {...form.register("forearmsLeft")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                    <Input type="number" step="0.1" {...form.register("forearmsRight")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                </div>

                                {/* Row Cuádriceps */}
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Cuádriceps</Label>
                                    <Input type="number" step="0.1" {...form.register("quadsLeft")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                    <Input type="number" step="0.1" {...form.register("quadsRight")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                </div>

                                {/* Row Pantorrillas */}
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Pantorrillas</Label>
                                    <Input type="number" step="0.1" {...form.register("calvesLeft")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                    <Input type="number" step="0.1" {...form.register("calvesRight")} className="col-span-4 bg-neutral-950 border-neutral-800 focus:border-red-500 h-10 text-center text-white placeholder:text-neutral-500" placeholder="-" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-neutral-800">
                        <Label className="text-xs font-bold text-neutral-500 uppercase">Notas Adicionales</Label>
                        <Input {...form.register("notes")} className="bg-neutral-950 border-neutral-800 focus:border-red-500 h-11 text-white placeholder:text-neutral-500" placeholder="Ej: En ayunas, post-entreno..." />
                    </div>

                    <div className="flex justify-center pt-4 pb-2">
                        <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-neutral-300 w-full md:w-auto font-black rounded-full px-12 h-12 text-sm uppercase tracking-wide shadow-lg shadow-white/10 hover:scale-105 transition-all">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Registro"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
