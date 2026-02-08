"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { createExercise, updateExercise } from "@/actions/exercise-actions";
import { generateExerciseDetails } from "@/actions/ai-actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/ui/media-upload";
import { Loader2, Dumbbell, Tag, ImagePlay, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Schema for form (same logic as server input)
const FormSchema = ExerciseSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true,
    description: true
});

type FormInput = z.infer<typeof FormSchema>;

const MUSCLE_GROUPS = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas", "Abdominales", "Cardio", "Full Body"
];

const SPECIFIC_MUSCLES_BY_GROUP: Record<string, string[]> = {
    "Pecho": ["Pectoral Mayor", "Pectoral Menor", "Serrato Anterior"],
    "Espalda": ["Dorsal Ancho", "Trapecio", "Romboides", "Redondo Mayor", "Redondo Menor", "Erector de la Columna", "Lumbar"],
    "Hombros": ["Deltoides Anterior", "Deltoides Medio", "Deltoides Posterior", "Manguito Rotador"],
    "Bíceps": ["Bíceps Braquial", "Braquial", "Braquiorradial"],
    "Tríceps": ["Tríceps Braquial (Cabeza Larga)", "Tríceps Braquial (Cabeza Lateral)", "Tríceps Braquial (Cabeza Medial)"],
    "Cuádriceps": ["Recto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermedio"],
    "Isquiotibiales": ["Bíceps Femoral", "Semitendinoso", "Semimembranoso"],
    "Glúteos": ["Glúteo Mayor", "Glúteo Medio", "Glúteo Menor"],
    "Pantorrillas": ["Gastrocnemio", "Sóleo"],
    "Abdominales": ["Recto Abdominal", "Oblicuos", "Transverso del Abdomen"],
    "Cardio": ["Corazón", "Resistencia General"],
    "Full Body": ["Cuerpo Completo"]
};

interface ExerciseFormDialogProps {
    exercise?: any; // If present, edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ExerciseFormDialog({ exercise, trigger, open, onOpenChange }: ExerciseFormDialogProps) {
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    // Controlado externa o internamente
    const isOpen = open !== undefined ? open : isInternalOpen;
    const setOpen = onOpenChange || setIsInternalOpen;

    const form = useForm<FormInput>({
        resolver: zodResolver(FormSchema),
        defaultValues: exercise ? {
            name: exercise.name,
            muscleGroups: exercise.muscleGroups || [],
            specificMuscles: exercise.specificMuscles || [],
            videoUrl: exercise.videoUrl
        } : {
            name: "",
            muscleGroups: [],
            specificMuscles: [],
            videoUrl: ""
        },
    });

    const { register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = form;
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

    const handleSearch = async () => {
        const name = getValues("name");
        if (!name || name.trim().length < 3) {
            toast.error("Ingresa un nombre de ejercicio válido para buscar");
            return;
        }

        setIsSearching(true);
        try {
            const result = await generateExerciseDetails(name);
            if (result.success && result.data) {
                // Actualizar campos
                if (result.data.muscleGroups && Array.isArray(result.data.muscleGroups)) {
                    setValue("muscleGroups", result.data.muscleGroups);
                }
                if (result.data.specificMuscles && Array.isArray(result.data.specificMuscles)) {
                    setValue("specificMuscles", result.data.specificMuscles);
                }
                toast.success("Datos cargados con IA");
            } else {
                toast.error("No se pudieron encontrar detalles para este ejercicio");
            }
        } catch (error) {
            toast.error("Error al buscar detalles");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[650px] bg-neutral-950 border-neutral-800 text-white p-0 gap-0 rounded-3xl shadow-2xl shadow-black/50 max-h-[95vh] flex flex-col">

                {/* Header Estilizado */}
                <div className="bg-linear-to-br from-neutral-900 to-neutral-950 p-8 border-b border-white/5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white">
                            <div className="h-10 w-10 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/20">
                                <Dumbbell className="h-5 w-5 text-red-600" />
                            </div>
                            {exercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400 text-base mt-2">
                            Define los parámetros técnicos para potenciar el motor de IA.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-h-[65vh]">
                        <div className="space-y-6">
                            {/* Nombre */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombre Técnico</Label>
                                <div className="flex gap-2">
                                    <Input
                                        {...register("name")}
                                        placeholder="Ej: Press de Banca Plano con Barra"
                                        className="bg-neutral-900/50 border-neutral-800 text-white h-14 rounded-xl px-4 text-lg font-bold focus-visible:ring-red-600/50 focus-visible:border-red-600 transition-all placeholder:text-neutral-600 flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={isSearching || isSubmitting}
                                        className="h-14 w-14 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-neutral-600 transition-all"
                                    >
                                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    </Button>
                                </div>
                                {errors.name && <p className="text-red-500 text-xs font-medium ml-1">{errors.name.message}</p>}
                            </div>



                            {/* Tags Muscles */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Grupos Musculares Principales
                                </Label>
                                <div className="flex flex-wrap gap-2 p-4 bg-neutral-900/30 rounded-2xl border border-white/5">
                                    {MUSCLE_GROUPS.map(group => {
                                        const isSelected = selectedGroups?.includes(group);
                                        return (
                                            <div
                                                key={group}
                                                onClick={() => toggleMuscleGroup(group)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border select-none",
                                                    isSelected
                                                        ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20"
                                                        : "bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700 hover:text-white"
                                                )}
                                            >
                                                {group}
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.muscleGroups && <p className="text-red-500 text-xs font-medium ml-1">{errors.muscleGroups.message}</p>}
                            </div>

                            {/* Músculos Específicos */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Músculos Específicos</Label>
                                {selectedGroups && selectedGroups.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 p-4 bg-neutral-900/30 rounded-2xl border border-white/5">
                                        {Array.from(new Set(selectedGroups.flatMap(group => SPECIFIC_MUSCLES_BY_GROUP[group] || []))).map(muscle => {
                                            const isSelected = watch("specificMuscles")?.includes(muscle);
                                            return (
                                                <div
                                                    key={muscle}
                                                    onClick={() => {
                                                        const current = watch("specificMuscles") || [];
                                                        if (current.includes(muscle)) {
                                                            setValue("specificMuscles", current.filter(m => m !== muscle));
                                                        } else {
                                                            setValue("specificMuscles", [...current, muscle]);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border select-none",
                                                        isSelected
                                                            ? "bg-red-600/20 text-red-500 border-red-500/50"
                                                            : "bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700 hover:text-white"
                                                    )}
                                                >
                                                    {muscle}
                                                </div>
                                            );
                                        })}
                                        {Array.from(new Set(selectedGroups.flatMap(group => SPECIFIC_MUSCLES_BY_GROUP[group] || []))).length === 0 && (
                                            <p className="text-neutral-500 text-sm">No hay músculos específicos definidos para los grupos seleccionados.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-neutral-900/10 rounded-2xl border border-white/5 border-dashed flex items-center justify-center text-neutral-600 text-sm">
                                        Selecciona un grupo muscular para ver los músculos específicos.
                                    </div>
                                )}
                            </div>

                            {/* Multimedia - Subida de archivos */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
                                    <ImagePlay className="w-3 h-3" /> Multimedia de Referencia (Opcional)
                                </Label>

                                {/* Componente de subida */}
                                <MediaUpload
                                    value={watch("videoUrl") || ""}
                                    onChange={(url) => setValue("videoUrl", url)}
                                    onClear={() => setValue("videoUrl", "")}
                                    disabled={isSubmitting}
                                />

                                {/* Input para URL manual */}
                                <Input
                                    {...register("videoUrl")}
                                    placeholder="O pega una URL de imagen/video..."
                                    className="bg-neutral-900/50 border-neutral-800 text-white h-12 rounded-xl px-4 focus-visible:ring-red-600/50 focus-visible:border-red-600 transition-all placeholder:text-neutral-600"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-white/5 gap-3 bg-neutral-950">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 font-medium px-6">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-xl shadow-red-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {exercise ? "Guardar Cambios" : "Crear Ejercicio"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
