"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { createExercise, updateExercise } from "@/actions/exercise-actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Schema for form (same logic as server input)
const FormSchema = ExerciseSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true
});

type FormInput = z.infer<typeof FormSchema>;

const MUSCLE_GROUPS = [
    "Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body"
];

interface ExerciseFormDialogProps {
    exercise?: any; // If present, edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ExerciseFormDialog({ exercise, trigger, open, onOpenChange }: ExerciseFormDialogProps) {
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Controlado externa o internamente
    const isOpen = open !== undefined ? open : isInternalOpen;
    const setOpen = onOpenChange || setIsInternalOpen;

    const form = useForm<FormInput>({
        resolver: zodResolver(FormSchema),
        defaultValues: exercise ? {
            name: exercise.name,
            description: exercise.description,
            muscleGroups: exercise.muscleGroups || [],
            specificMuscles: exercise.specificMuscles || [],
            videoUrl: exercise.videoUrl
        } : {
            name: "",
            description: "",
            muscleGroups: [],
            specificMuscles: [],
            videoUrl: ""
        },
    });

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = form;
    const selectedGroups = watch("muscleGroups");

    const onSubmit = async (data: FormInput) => {
        setIsSubmitting(true);
        try {
            let result;
            if (exercise) {
                result = await updateExercise(exercise.id, data);
            } else {
                result = await createExercise(data);
            }

            if (result.success) {
                toast.success(exercise ? "Ejercicio actualizado" : "Ejercicio creado");
                setOpen(false);
                router.refresh();
                if (!exercise) reset();
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMuscleGroup = (group: string) => {
        const current = selectedGroups || [];
        if (current.includes(group)) {
            setValue("muscleGroups", current.filter(g => g !== group));
        } else {
            setValue("muscleGroups", [...current, group]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
                        <Dumbbell className="h-5 w-5 text-red-600" />
                        {exercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Añade los detalles técnicos para que la IA pueda usar este ejercicio.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-neutral-300">Nombre del Ejercicio</Label>
                            <Input {...register("name")} placeholder="Ej: Press de Banca Plano" className="bg-black/50 border-neutral-800 text-white" />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-300">Descripción / Técnica</Label>
                            <Textarea
                                {...register("description")}
                                placeholder="Describe la ejecución correcta..."
                                className="bg-black/50 border-neutral-800 min-h-[100px] text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-300">Grupos Musculares (Tags)</Label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(group => {
                                    const isSelected = selectedGroups?.includes(group);
                                    return (
                                        <div
                                            key={group}
                                            onClick={() => toggleMuscleGroup(group)}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all border",
                                                isSelected
                                                    ? "bg-red-600/20 border-red-600 text-red-500"
                                                    : "bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                                            )}
                                        >
                                            {group}
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.muscleGroups && <p className="text-red-500 text-xs">{errors.muscleGroups.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-300">Músculos Específicos (Separados por coma)</Label>
                            <Input
                                placeholder="Ej: Pectoral mayor, Deltoides anterior"
                                className="bg-black/50 border-neutral-800 text-white"
                                onChange={(e) => {
                                    // Simple split logic for visualization/storage
                                    const val = e.target.value;
                                    setValue("specificMuscles", val.split(",").map(s => s.trim()).filter(Boolean));
                                }}
                                defaultValue={exercise?.specificMuscles?.join(", ")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-300">URL del Video (Youtube/Vimeo)</Label>
                            <Input {...register("videoUrl")} placeholder="https://..." className="bg-black/50 border-neutral-800 text-white" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full">
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {exercise ? "Guardar Cambios" : "Crear Ejercicio"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
