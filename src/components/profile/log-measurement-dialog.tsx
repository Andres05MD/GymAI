"use client";

import { useState } from "react";
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
    biceps: z.coerce.number().optional(),
    quads: z.coerce.number().optional(),
    notes: z.string().optional(),
});

export function LogMeasurementDialog({ onLogSuccess }: { onLogSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof LogSchema>>({
        resolver: zodResolver(LogSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
        }
    });

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
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Registrar Medidas
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Progreso Corporal</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input type="date" {...form.register("date")} className="bg-black border-neutral-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Peso (kg)</Label>
                            <Input type="number" step="0.1" {...form.register("weight")} className="bg-black border-neutral-800" placeholder="0.0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Pecho (cm)</Label>
                            <Input type="number" step="0.1" {...form.register("chest")} className="bg-black border-neutral-800" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Cintura (cm)</Label>
                            <Input type="number" step="0.1" {...form.register("waist")} className="bg-black border-neutral-800" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Cadera (cm)</Label>
                            <Input type="number" step="0.1" {...form.register("hips")} className="bg-black border-neutral-800" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bíceps (cm)</Label>
                            <Input type="number" step="0.1" {...form.register("biceps")} className="bg-black border-neutral-800" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Cuádriceps (cm)</Label>
                            <Input type="number" step="0.1" {...form.register("quads")} className="bg-black border-neutral-800" placeholder="0" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Notas (Opcional)</Label>
                        <Input {...form.register("notes")} className="bg-black border-neutral-800" placeholder="Ej: En ayunas" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-neutral-200">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Registro"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
