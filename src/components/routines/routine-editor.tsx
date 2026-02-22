"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { createRoutine, updateRoutine, generateRoutineWithAI } from "@/actions/routine-actions";
import { generateRoutineDescription } from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Wand2, Sparkles, Save, ArrowLeft, Check, ChevronsUpDown, Dumbbell, CalendarDays, Clock, Copy, Activity } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoutineSafetyCheck } from "@/components/routines/routine-safety-check";
import { ExerciseSelector } from "@/components/routines/exercise-selector";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES ---

interface ExerciseSet {
    type?: string;
    reps?: string | number;
    rpeTarget?: number;
    restSeconds?: number;
}

interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: ExerciseSet[];
    order?: number;
    variantIds?: string[];
}

interface ScheduleDay {
    name: string;
    exercises: ScheduleExercise[];
}

interface AIRoutine {
    name: string;
    description?: string;
    type?: string;
    schedule: ScheduleDay[];
}

interface RoutineFormData {
    id?: string;
    name: string;
    description?: string;
    type: string;
    schedule: ScheduleDay[];
}

interface AvailableExercise {
    id: string;
    name: string;
}

// --- Constantes ---
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// --- AI Generator Component ---
function AIGenerator({ onGenerate, currentType }: { onGenerate: (routine: AIRoutine) => void, currentType: "weekly" | "daily" }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [criteria, setCriteria] = useState({
        goal: "hypertrophy",
        daysPerWeek: 3,
        experienceLevel: "intermediate",
        injuries: "",
        focus: "",
        userPrompt: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const injuriesArray = criteria.injuries.split(",").map(s => s.trim()).filter(Boolean);
            const res = await generateRoutineWithAI({
                athleteId: "generic",
                goal: criteria.goal,
                daysPerWeek: Number(criteria.daysPerWeek),
                experienceLevel: criteria.experienceLevel,
                injuries: injuriesArray,
                focus: criteria.focus,
                routineType: currentType,
                userPrompt: criteria.userPrompt
            });

            if (res.success && res.routine) {
                onGenerate(res.routine);
                setOpen(false);
                toast.success("¡Protocolo generado por IA!");
            } else {
                toast.error(res.error || "Error al generar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative h-12 px-8 rounded-full border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-white font-black uppercase italic tracking-widest text-[10px] transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Activar Generador IA</span>
                    <span className="relative z-10 sm:hidden">IA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 backdrop-blur-3xl border border-white/10 text-white sm:max-w-[550px] p-0 rounded-4xl overflow-hidden shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)]">
                <div className="absolute inset-0 bg-linear-to-b from-red-600/3 to-transparent pointer-events-none" />
                <div className="p-8 md:p-10 relative z-10">
                    <DialogHeader className="mb-10 text-center md:text-left">
                        <DialogTitle className="flex items-center justify-center md:justify-start gap-4 text-3xl font-black uppercase italic tracking-tighter leading-none">
                            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shadow-xl">
                                <Wand2 className="w-6 h-6 text-red-500" />
                            </div>
                            <span>Inteligencia <span className="text-neutral-500">Generativa</span></span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mt-4 italic">
                            Configuración Técnica de Parámetros de Entrenamiento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">
                            <div className="space-y-3">
                                <Label className="ml-1 opacity-70">Objetivo Estratégico</Label>
                                <Select value={criteria.goal} onValueChange={(v) => setCriteria({ ...criteria, goal: v })}>
                                    <SelectTrigger className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 hover:bg-neutral-900 uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/5 text-white rounded-2xl shadow-2xl">
                                        <SelectItem value="hypertrophy" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Hipertrofia</SelectItem>
                                        <SelectItem value="strength" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Fuerza</SelectItem>
                                        <SelectItem value="weight_loss" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Pérdida Peso</SelectItem>
                                        <SelectItem value="endurance" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Resistencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="ml-1 opacity-70">Frecuencia (D/S)</Label>
                                <Input
                                    type="number"
                                    min={1} max={7}
                                    value={criteria.daysPerWeek}
                                    onChange={(e) => setCriteria({ ...criteria, daysPerWeek: Number(e.target.value) })}
                                    className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Nivel de Competencia</Label>
                            <Select value={criteria.experienceLevel} onValueChange={(v) => setCriteria({ ...criteria, experienceLevel: v })}>
                                <SelectTrigger className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 hover:bg-neutral-900 uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/5 text-white rounded-2xl shadow-2xl">
                                    <SelectItem value="beginner" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Principiante</SelectItem>
                                    <SelectItem value="intermediate" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Intermedio</SelectItem>
                                    <SelectItem value="advanced" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Avanzado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Restricciones Físicas</Label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                                <Input
                                    placeholder="LESIONES O LIMITACIONES..."
                                    value={criteria.injuries}
                                    onChange={(e) => setCriteria({ ...criteria, injuries: e.target.value })}
                                    className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 pl-12 pr-4 text-[10px] font-black text-white transition-all focus:ring-1 focus:ring-red-500/50 uppercase placeholder:text-neutral-700 italic tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Prompt de Misión (Opcional)</Label>
                            <Textarea
                                placeholder="DESCRIBE TU ENFOQUE PERSONALIZADO..."
                                value={criteria.userPrompt}
                                onChange={(e) => setCriteria({ ...criteria, userPrompt: e.target.value })}
                                className="bg-neutral-900/50 border border-white/5 rounded-[2rem] min-h-[120px] p-6 text-[10px] font-black text-white focus:ring-1 focus:ring-red-500/50 transition-all resize-none uppercase placeholder:text-neutral-700 italic tracking-[0.2em] leading-relaxed"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-16 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl transition-all shadow-white/5 hover:-translate-y-1"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                            Iniciar Generación de Datos
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Routine Importer Component ---
function RoutineImporter({ routines = [], onImport }: { routines: any[], onImport: (routine: any) => void }) {
    const [open, setOpen] = useState(false);

    // Deduplicar rutinas por ID para evitar el error "Children with the same key"
    const uniqueRoutines = Array.from(new Map(routines.map(r => [r.id, r])).values());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 gap-2 transition-all rounded-full px-4 sm:px-6 h-12 text-xs font-bold tracking-wide">
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">IMPORTAR</span>
                    <span className="sm:hidden">IMPORTAR</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[450px] p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Copiar de Existente</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Selecciona una rutina para copiar su estructura y ejercicios.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <Command className="bg-transparent text-white">
                        <CommandInput placeholder="Buscar rutina..." className="border-none focus:ring-0 text-white" />
                        <CommandList className="max-h-[300px] mt-2">
                            <CommandEmpty className="py-4 text-center text-neutral-500">No se encontraron rutinas.</CommandEmpty>
                            <CommandGroup>
                                {uniqueRoutines.map((r) => (
                                    <CommandItem
                                        key={r.id}
                                        onSelect={() => {
                                            onImport(r);
                                            setOpen(false);
                                            toast.success(`Datos importados de: ${r.name}`);
                                        }}
                                        className="hover:bg-white/5 cursor-pointer rounded-lg p-3 aria-selected:bg-white/10"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-500 text-sm uppercase">{r.name}</span>
                                            <span className="text-xs text-neutral-400 line-clamp-1">{r.description || "Sin descripción"}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.type === 'daily' ? '1 Día' : `${r.schedule?.length || 0} Días`}
                                                </span>
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.schedule?.reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0)} Ejercicios
                                                </span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Editor Component ---

// Tipos para props - Usamos tipos amplios debido a la naturaleza dinámica del editor
// TODO: Tipar estrictamente cuando se refactorice el manejo de formularios
interface RoutineEditorProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    isEditing?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableExercises?: any[];
    athleteId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableRoutines?: any[];
}

export function RoutineEditor({ initialData, isEditing = false, availableExercises = [], athleteId, availableRoutines = [] }: RoutineEditorProps) {
    const sortedExercises = useMemo(() => {
        return [...availableExercises].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [availableExercises]);

    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    const DRAFT_KEY = "gymia-routine-draft";

    const form = useForm({
        defaultValues: initialData || {
            name: "",
            description: "",
            type: "weekly",
            schedule: [
                { name: "Día 1", exercises: [] }
            ]
        }
    });

    const { register, control, handleSubmit, setValue, watch, reset } = form;
    const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
        control,
        name: "schedule"
    });

    const formData = watch();
    const schedule = watch("schedule");
    const routineType = watch("type");

    // --- LOGICA DE PERSISTENCIA (LocalStorage) ---

    // Cargar borrador al montar (solo si no estamos editando una existente)
    useEffect(() => {
        if (!isEditing) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    // Solo restaurar si tiene contenido (nombre o al menos un ejercicio)
                    const hasContent = parsedDraft.name || (parsedDraft.schedule[0]?.exercises?.length > 0);

                    if (hasContent) {
                        reset(parsedDraft);
                        toast.info("Se ha restaurado el borrador anterior", {
                            description: "No perderás tu progreso aunque se reinicie la página.",
                            action: {
                                label: "Descartar",
                                onClick: () => {
                                    localStorage.removeItem(DRAFT_KEY);
                                    reset({
                                        name: "",
                                        description: "",
                                        type: "weekly",
                                        schedule: [{ name: "Día 1", exercises: [] }]
                                    });
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error al cargar borrador:", e);
                }
            }
        }
    }, [isEditing, reset]);

    // Guardar automáticamente al cambiar
    useEffect(() => {
        if (!isEditing) {
            // Guardamos con un pequeño retraso para no saturar el localStorage
            const timer = setTimeout(() => {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, isEditing]);

    const addExerciseToDay = (dayIndex: number) => {
        const currentExercises = schedule[dayIndex].exercises || [];
        const newExercise = {
            exerciseId: "",
            exerciseName: "Nuevo Ejercicio",
            sets: [
                { type: "working", reps: "10-12", rpeTarget: 8, restSeconds: 60 }
            ],
            order: currentExercises.length + 1,
            variantIds: []
        };
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].exercises.push(newExercise);
        setValue("schedule", updatedSchedule);
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].exercises.splice(exIndex, 1);
        setValue("schedule", updatedSchedule);
    };

    const updateExerciseField = (dayIndex: number, exIndex: number, field: string, value: string | ExerciseSet[]) => {
        const updatedSchedule = [...schedule];
        // If updating name via Combobox, we might find the matching exercise ID
        if (field === 'exerciseName') {
            const found = availableExercises.find(ex => ex.name === value);
            if (found) {
                updatedSchedule[dayIndex].exercises[exIndex].exerciseId = found.id;
            }
        }

        updatedSchedule[dayIndex].exercises[exIndex] = {
            ...updatedSchedule[dayIndex].exercises[exIndex],
            [field]: value
        };
        setValue("schedule", updatedSchedule);
    };

    const handleGenerateDescription = async () => {
        setIsGeneratingDescription(true);
        try {
            const res = await generateRoutineDescription(schedule);
            if (res.success && res.description) {
                setValue("description", res.description);
                toast.success("Descripción generada");
            } else {
                toast.error("No se pudo generar la descripción");
            }
        } catch (error) {
            toast.error("Error al conectar con IA");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const onAIResult = (aiRoutine: AIRoutine) => {
        reset({
            name: aiRoutine.name,
            description: aiRoutine.description,
            type: aiRoutine.type || "weekly",
            schedule: aiRoutine.schedule
        });
        toast.success("Rutina aplicada al editor");
    };

    const onSubmit = async (data: RoutineFormData) => {
        setIsSaving(true);
        try {
            const res = isEditing && initialData?.id
                ? await updateRoutine(initialData.id, data as unknown as Parameters<typeof updateRoutine>[1])
                : await createRoutine(data as unknown as Parameters<typeof createRoutine>[0]);

            if (res.success) {
                toast.success(isEditing ? "Rutina actualizada" : "Rutina creada");

                // Limpiar borrador al guardar con éxito
                if (!isEditing) {
                    localStorage.removeItem(DRAFT_KEY);
                }

                if (athleteId) {
                    router.push(`/athletes/${athleteId}`);
                } else {
                    router.push("/routines");
                }
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Error guardando rutina");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for Exercise Selector Modal (Mobile Optimized)
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorContext, setSelectorContext] = useState<{ dayIndex: number; exIndex: number } | null>(null);

    const openExerciseSelector = (dayIndex: number, exIndex: number) => {
        setSelectorContext({ dayIndex, exIndex });
        setSelectorOpen(true);
    };

    const handleExerciseSelect = (exercise: { id?: string; name: string }) => {
        if (selectorContext) {
            const { dayIndex, exIndex } = selectorContext;
            if (isVariantMode) {
                // Agregar variante
                if (exercise.id) {
                    const updatedSchedule = [...schedule];
                    const currentVariants = updatedSchedule[dayIndex].exercises[exIndex].variantIds || [];
                    if (!currentVariants.includes(exercise.id)) {
                        updatedSchedule[dayIndex].exercises[exIndex].variantIds = [...currentVariants, exercise.id];
                        setValue("schedule", updatedSchedule);
                        toast.success("Variante añadida");
                    }
                }
            } else {
                // Seleccionar ejercicio principal
                updateExerciseField(dayIndex, exIndex, "exerciseName", exercise.name);
                if (exercise.id) {
                    const updatedSchedule = [...schedule];
                    updatedSchedule[dayIndex].exercises[exIndex].exerciseId = exercise.id;
                    setValue("schedule", updatedSchedule);
                }
            }
        }
        setSelectorOpen(false);
        setSelectorContext(null);
        setIsVariantMode(false);
    };

    // Corregir error de tipo en handleVariantSelect
    const removeVariant = (dayIndex: number, exIndex: number, variantId: string) => {
        const updatedSchedule = [...schedule];
        const currentVariants = updatedSchedule[dayIndex].exercises[exIndex].variantIds || [];
        updatedSchedule[dayIndex].exercises[exIndex].variantIds = currentVariants.filter((id: string) => id !== variantId);
        setValue("schedule", updatedSchedule);
    };

    const [isVariantMode, setIsVariantMode] = useState(false);

    return (
        <div className="container mx-auto max-w-7xl pb-40 px-4 md:px-6 relative">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 pt-10">
                <div className="flex items-center gap-6">
                    <Button
                        variant="link"
                        onClick={() => router.back()}
                        className="h-14 w-14 rounded-2xl bg-neutral-900/40 backdrop-blur-3xl border border-white/5 text-neutral-500 hover:text-white hover:border-white/10 transition-all flex items-center justify-center p-0"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] italic">Routine_OS v2.0</span>
                            <div className="h-px w-8 bg-white/10" />
                            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] italic">Constructor Mode</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                            {isEditing ? "Optimizar" : "Construir"} <span className="text-neutral-500">Plan Técnico</span>
                        </h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <RoutineSafetyCheck routine={watch()} athleteId={athleteId} />
                    <RoutineImporter routines={availableRoutines} onImport={onAIResult} />
                    <AIGenerator onGenerate={onAIResult} currentType={watch("type") as "weekly" | "daily"} />
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSaving}
                        className="h-14 px-10 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-2xl transition-all shadow-white/5 hover:-translate-y-1"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3" />}
                        Sincronizar Datos
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Column: Metadata & Day Selection (4 cols) */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Basic Info Card */}
                    <ClientMotionDiv
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-neutral-900/30 backdrop-blur-3xl border border-white/5 rounded-4xl p-10 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-4">
                                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Identificador de Misión</Label>
                                <Input
                                    {...register("name")}
                                    placeholder="NOMBRE DEL PROTOCOLO..."
                                    className="bg-neutral-950/50 border border-white/5 h-16 rounded-2xl px-6 text-sm font-black text-white placeholder:text-neutral-800 transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 uppercase italic tracking-widest"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Arquitectura del Ciclo</Label>
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-neutral-950/80 rounded-2xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setValue("type", "weekly")}
                                        className={cn(
                                            "flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                                            routineType === "weekly" ? "bg-white text-black shadow-xl scale-105" : "text-neutral-600 hover:text-neutral-400"
                                        )}
                                    >
                                        <CalendarDays className="w-4 h-4" /> Semanal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setValue("type", "daily");
                                            if (schedule.length > 1) setValue("schedule", [schedule[0]]);
                                            setActiveDayIndex(0);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                                            routineType === "daily" ? "bg-white text-black shadow-xl scale-105" : "text-neutral-600 hover:text-neutral-400"
                                        )}
                                    >
                                        <Clock className="w-4 h-4" /> Diario
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Resumen Operativo</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleGenerateDescription}
                                        disabled={isGeneratingDescription}
                                        className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-[9px] font-black uppercase italic tracking-widest transition-all border border-red-500/20"
                                    >
                                        <Sparkles className="w-3 h-3 mr-2" /> Optimizar IA
                                    </Button>
                                </div>
                                <Textarea
                                    {...register("description")}
                                    placeholder="DETALLES TÉCNICOS Y OBJETIVOS..."
                                    className="bg-neutral-950/50 border border-white/5 rounded-3xl min-h-[160px] p-6 text-[10px] font-black text-white placeholder:text-neutral-800 transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 resize-none uppercase italic leading-relaxed tracking-widest shadow-inner overflow-y-auto"
                                />
                            </div>
                        </div>
                    </ClientMotionDiv>

                    {/* Week Structure / Day Management */}
                    {(routineType === "weekly" || (routineType !== "daily" && schedule.length > 1)) && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] italic">Timeline</span>
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Estructura Semanal</Label>
                                <span className="text-xs text-neutral-600 font-mono bg-neutral-900 px-2 py-1 rounded-md">{schedule.length} Días</span>
                            </div>

                            <div className="space-y-4">
                                {dayFields.map((field, index) => (
                                    <motion.div
                                        key={field.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setActiveDayIndex(index)}
                                        className={cn(
                                            "group relative p-6 rounded-3xl cursor-pointer flex justify-between items-center transition-all duration-500 overflow-hidden",
                                            activeDayIndex === index
                                                ? "bg-white text-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] scale-[1.02] border-transparent"
                                                : "bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 text-neutral-500 hover:text-neutral-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black border transition-all duration-500",
                                                activeDayIndex === index
                                                    ? "bg-black border-black/10 text-white rotate-12"
                                                    : "bg-neutral-950 border-white/5 text-neutral-600 group-hover:rotate-6 group-hover:text-red-500"
                                            )}>
                                                {String(index + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-[8px] font-black uppercase tracking-[0.4em] mb-1 italic transition-colors",
                                                    activeDayIndex === index ? "text-black/40" : "text-neutral-600"
                                                )}>
                                                    {WEEKDAYS[index] || `DAY_SEQUENCE_${index + 1}`}
                                                </p>
                                                <h3 className={cn(
                                                    "font-black text-sm uppercase italic tracking-wider transition-colors",
                                                    activeDayIndex === index ? "text-black" : "text-neutral-400 group-hover:text-white"
                                                )}>
                                                    {schedule[index]?.name || `DATA_NODE_${index + 1}`}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className={cn("h-1 w-1 rounded-full", activeDayIndex === index ? "bg-black/20" : "bg-red-500/40")} />
                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest", activeDayIndex === index ? "text-black/60" : "text-neutral-600")}>
                                                        {schedule[index]?.exercises?.length || 0} MODULES
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 relative z-10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-xl transition-all",
                                                    activeDayIndex === index
                                                        ? "text-black/20 hover:text-red-600 hover:bg-black/5"
                                                        : "text-neutral-800 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                )}
                                                onClick={(e) => { e.stopPropagation(); removeDay(index); }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {activeDayIndex === index && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                        )}
                                    </motion.div>
                                ))}

                                {dayFields.length < 5 && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-16 border border-dashed border-white/5 bg-transparent text-neutral-600 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-3xl transition-all font-black uppercase italic tracking-[0.3em] text-[10px]"
                                        onClick={() => appendDay({ name: WEEKDAYS[dayFields.length] || `Día ${dayFields.length + 1}`, exercises: [] })}
                                    >
                                        <Plus className="w-5 h-5 mr-3" /> Añadir Protocolo Diario
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8">
                    {schedule[activeDayIndex] ? (
                        <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-1.5 overflow-hidden min-h-[700px] shadow-2xl relative">
                            <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-red-600/[0.03] to-transparent pointer-events-none" />

                            {/* Header Day */}
                            <div className="bg-neutral-950/80 backdrop-blur-2xl border-b border-white/5 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-t-[2.8rem] relative z-10">
                                <div className="space-y-2 flex-1 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 italic">
                                            {routineType === 'daily' ? 'OPERATIONAL_SESSION_01' : `SEQUENCE_NODE_0${activeDayIndex + 1}`}
                                        </Label>
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            value={schedule[activeDayIndex].name}
                                            onChange={(e) => {
                                                const newSched = [...schedule];
                                                newSched[activeDayIndex].name = e.target.value;
                                                setValue("schedule", newSched);
                                            }}
                                            className="text-4xl md:text-5xl font-black bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0 placeholder:text-neutral-800 w-full uppercase italic tracking-tighter"
                                            placeholder="IDENTIFICADOR DEL DÍA..."
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-px bg-red-600 group-hover:w-full transition-all duration-700" />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => addExerciseToDay(activeDayIndex)}
                                    className="w-full md:w-auto h-14 px-8 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[10px] shadow-xl transition-all hover:-translate-y-1"
                                >
                                    <Plus className="w-5 h-5 mr-3" /> Inyectar Ejercicio
                                </Button>
                            </div>

                            <div className="p-6 md:p-8 space-y-8 relative z-10">
                                {schedule[activeDayIndex].exercises?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
                                        <div className="w-24 h-24 bg-neutral-950 border border-white/5 rounded-full flex items-center justify-center text-neutral-700 shadow-inner">
                                            <Dumbbell className="w-10 h-10 animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-white font-black uppercase italic tracking-widest text-lg">Sesión en estado nulo</p>
                                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em]">Inyecta módulos para comenzar el protocolo</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {schedule[activeDayIndex].exercises?.map((exercise: ScheduleExercise, exIndex: number) => (
                                            <motion.div
                                                key={exIndex}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-neutral-950/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group/ex relative"
                                            >
                                                <div className="absolute inset-0 bg-linear-to-b from-white/1 to-transparent pointer-events-none" />

                                                {/* Exercise Header */}
                                                <div className="p-5 md:p-6 bg-white/2 border-b border-white/5 flex flex-row gap-4 justify-between items-center relative z-10">
                                                    <div className="flex-1 min-w-0 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-red-500 text-xs font-black shadow-inner">
                                                            {String(exIndex + 1).padStart(2, '0')}
                                                        </div>
                                                        <div className="flex-1 min-w-0 relative">
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between items-center text-left text-lg md:text-xl font-black text-white hover:bg-white/5 hover:text-white px-3 h-auto py-3 rounded-2xl transition-all uppercase italic tracking-tighter"
                                                                onClick={() => openExerciseSelector(activeDayIndex, exIndex)}
                                                            >
                                                                <span className="mr-4 leading-none truncate">
                                                                    {exercise.exerciseName || "SISTEMA_NO_IDENTIFICADO"}
                                                                </span>
                                                                <ChevronsUpDown className="ml-auto h-5 w-5 shrink-0 text-neutral-600" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeExercise(activeDayIndex, exIndex)}
                                                        className="h-10 w-10 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                <div className="p-6 md:p-8 space-y-8 relative z-10">
                                                    <div className="relative group/note">
                                                        <div className="flex items-center gap-2 mb-2 opacity-40">
                                                            <Activity className="w-3 h-3 text-red-500" />
                                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white italic">Notas Técnicas</span>
                                                        </div>
                                                        <Input
                                                            value={exercise.notes || ""}
                                                            onChange={(e) => updateExerciseField(activeDayIndex, exIndex, "notes", e.target.value)}
                                                            placeholder="ESPECIFICACIONES DE EJECUCIÓN..."
                                                            className="bg-neutral-950/60 border border-white/5 rounded-2xl px-5 h-12 text-xs font-black text-white placeholder:text-neutral-800 focus-visible:ring-1 focus-visible:ring-red-500/40 uppercase italic tracking-widest shadow-inner transition-all w-full"
                                                        />
                                                    </div>

                                                    {/* Variantes Section */}
                                                    <div className="space-y-4 bg-black/20 p-6 rounded-3xl border border-white/2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-1 w-5 bg-red-600 rounded-full" />
                                                                <span className="text-[9px] uppercase font-black text-neutral-500 tracking-[0.3em] italic">Alternativas de Seguridad</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-[9px] font-black text-red-500 hover:text-white hover:bg-red-500/10 rounded-full px-4 border border-red-500/10 uppercase italic tracking-widest transition-all"
                                                                onClick={() => {
                                                                    setIsVariantMode(true);
                                                                    openExerciseSelector(activeDayIndex, exIndex);
                                                                }}
                                                            >
                                                                <Plus className="w-3 h-3 mr-2" /> Añadir Variante
                                                            </Button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 min-h-[40px]">
                                                            {exercise.variantIds && exercise.variantIds.length > 0 ? (
                                                                exercise.variantIds.map((vId: string) => {
                                                                    const vEx = availableExercises.find(ex => ex.id === vId);
                                                                    return (
                                                                        <motion.div
                                                                            layout
                                                                            initial={{ scale: 0.9, opacity: 0 }}
                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                            key={vId}
                                                                            className="bg-neutral-900/80 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-4 group/var transition-all hover:bg-neutral-800"
                                                                        >
                                                                            <span className="text-[10px] text-neutral-300 font-black uppercase italic tracking-wider">{vEx?.name || "CARGANDO..."}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeVariant(activeDayIndex, exIndex, vId)}
                                                                                className="text-neutral-600 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </motion.div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="w-full py-4 border border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-20">
                                                                    <p className="text-[8px] text-white font-black uppercase tracking-[0.4em] italic">Protocolo redundante no definido</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sets Area */}
                                                    <div className="space-y-4">
                                                        {/* Table Header */}
                                                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-[8px] font-black uppercase tracking-[0.5em] text-neutral-600 italic">
                                                            <div className="col-span-1">#</div>
                                                            <div className="col-span-3">Categoría</div>
                                                            <div className="col-span-3 px-2">Carga_Reps</div>
                                                            <div className="col-span-2 text-center">Intensidad</div>
                                                            <div className="col-span-2 text-center">Cronos</div>
                                                            <div className="col-span-1"></div>
                                                        </div>

                                                        <div className="space-y-4 md:space-y-2">
                                                            <AnimatePresence mode="popLayout">
                                                                {exercise.sets?.map((set: ExerciseSet, setIndex: number) => (
                                                                    <motion.div
                                                                        key={setIndex}
                                                                        layout
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        className="relative bg-neutral-900/40 backdrop-blur-3xl p-5 md:p-3 rounded-2xl md:rounded-3xl flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-4 items-center group/set border border-white/5 shadow-inner"
                                                                    >
                                                                        {/* Mobile Header */}
                                                                        <div className="flex md:hidden w-full justify-between items-center">
                                                                            <div className="w-8 h-8 rounded-lg bg-black border border-white/5 flex items-center justify-center text-[10px] font-black text-red-500">
                                                                                {String(setIndex + 1).padStart(2, '0')}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-9 w-9 text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl"
                                                                                    onClick={() => {
                                                                                        const newSets = [...exercise.sets];
                                                                                        newSets.splice(setIndex + 1, 0, { ...set });
                                                                                        updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                    }}
                                                                                >
                                                                                    <Copy className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-9 w-9 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                                                    onClick={() => {
                                                                                        const newSets = [...exercise.sets];
                                                                                        newSets.splice(setIndex, 1);
                                                                                        updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Desktop Index */}
                                                                        <div className="hidden md:flex col-span-1 justify-center">
                                                                            <div className="w-1 h-3 bg-red-600/30 rounded-full" />
                                                                        </div>

                                                                        {/* Type Selector */}
                                                                        <div className="col-span-3 w-full">
                                                                            <Select
                                                                                value={set.type}
                                                                                onValueChange={(v) => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets[setIndex].type = v;
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-12 md:h-10 text-[10px] font-black uppercase italic tracking-widest bg-black border-white/5 text-white hover:border-white/20 px-4 rounded-xl md:rounded-2xl transition-all">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-2xl p-2">
                                                                                    <SelectItem value="warmup" className="rounded-xl p-3 focus:bg-red-600 text-[10px] font-black uppercase italic tracking-widest">Calentamiento</SelectItem>
                                                                                    <SelectItem value="working" className="rounded-xl p-3 focus:bg-red-600 text-[10px] font-black uppercase italic tracking-widest">Efectiva</SelectItem>
                                                                                    <SelectItem value="failure" className="rounded-xl p-3 focus:bg-red-600 text-[10px] font-black uppercase italic tracking-widest">Al Fallo</SelectItem>
                                                                                    <SelectItem value="drop" className="rounded-xl p-3 focus:bg-red-600 text-[10px] font-black uppercase italic tracking-widest">Drop Set</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        {/* Inputs Grid */}
                                                                        <div className="grid grid-cols-3 md:contents gap-4 w-full">
                                                                            {/* Reps */}
                                                                            <div className="col-span-1 md:col-span-3 relative flex flex-col gap-1.5">
                                                                                <span className="md:hidden text-[7px] font-black uppercase tracking-[0.4em] text-neutral-600 italic text-center">Reps</span>
                                                                                <Input
                                                                                    value={set.reps}
                                                                                    onChange={(e) => {
                                                                                        const newSets = [...exercise.sets];
                                                                                        newSets[setIndex].reps = e.target.value;
                                                                                        updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                    }}
                                                                                    className="h-12 md:h-10 text-xs bg-black border-white/5 text-center text-white font-black italic focus:ring-1 focus:ring-red-500/40 rounded-xl md:rounded-2xl shadow-inner placeholder:text-neutral-800"
                                                                                    placeholder="10-12"
                                                                                />
                                                                            </div>

                                                                            {/* RPE */}
                                                                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                                                                                <span className="md:hidden text-[7px] font-black uppercase tracking-[0.4em] text-neutral-600 italic text-center">Rpe</span>
                                                                                <Select
                                                                                    value={set.rpeTarget?.toString() || ""}
                                                                                    onValueChange={(val) => {
                                                                                        const newSets = [...exercise.sets];
                                                                                        newSets[setIndex].rpeTarget = Number(val);
                                                                                        updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-12 md:h-10 w-full justify-center text-xs bg-black border-white/5 text-white font-black italic focus:ring-1 focus:ring-red-500/40 rounded-xl md:rounded-2xl shadow-inner px-0 [&>svg]:hidden">
                                                                                        <SelectValue placeholder="8" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white min-w-[60px] rounded-2xl">
                                                                                        {[10, 9, 8, 7, 6, 5].map((val) => (
                                                                                            <SelectItem key={val} value={val.toString()} className="justify-center focus:bg-red-600 rounded-xl">
                                                                                                {val}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            {/* Rest */}
                                                                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                                                                                <span className="md:hidden text-[7px] font-black uppercase tracking-[0.4em] text-neutral-600 italic text-center">Rest</span>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={set.restSeconds}
                                                                                        onChange={(e) => {
                                                                                            const newSets = [...exercise.sets];
                                                                                            newSets[setIndex].restSeconds = Number(e.target.value);
                                                                                            updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                        }}
                                                                                        className="h-12 md:h-10 text-xs bg-black border-white/5 text-center text-white font-black italic focus:ring-1 focus:ring-red-500/40 rounded-xl md:rounded-2xl shadow-inner pr-6"
                                                                                        placeholder="90"
                                                                                    />
                                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-neutral-700">S</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Desktop Actions */}
                                                                        <div className="hidden md:flex col-span-1 justify-center gap-1 opacity-0 group-hover/set:opacity-100 transition-opacity">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl"
                                                                                onClick={() => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets.splice(setIndex + 1, 0, { ...set });
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                                                onClick={() => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets.splice(setIndex, 1);
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full h-12 text-[10px] font-black uppercase italic tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl border border-dashed border-white/5 transition-all mt-4"
                                                            onClick={() => {
                                                                const newSets = [...exercise.sets, { type: "working", reps: "8-12", rpeTarget: 8, restSeconds: 90 }];
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-3" /> Integrar Nueva Serie
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {schedule[activeDayIndex].exercises?.length > 0 && (
                                    <Button
                                        onClick={() => addExerciseToDay(activeDayIndex)}
                                        variant="outline"
                                        className="w-full h-20 border border-white/5 bg-neutral-900/40 backdrop-blur-3xl text-neutral-500 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-[2.5rem] transition-all group mt-8 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-red-600/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Plus className="w-6 h-6 mr-4 group-hover:scale-110 transition-transform relative z-10" />
                                        <span className="text-sm font-black uppercase tracking-[0.3em] italic relative z-10">Expandir Módulos de Entrenamiento</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] border border-dashed border-white/5 bg-neutral-950/20 rounded-[3rem] opacity-30 shadow-inner">
                            <Label className="text-2xl font-black uppercase tracking-[0.6em] text-neutral-800 italic grayscale mb-4">Módulo de Edición_Inactivo</Label>
                            <div className="w-12 h-px bg-neutral-800 mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 italic">Desbloquee una secuencia lateral para iniciar el protocolo</p>
                        </div>
                    )}
                </div>
            </div >

            <ExerciseSelector
                open={selectorOpen}
                onOpenChange={(op) => {
                    setSelectorOpen(op);
                    if (!op) setIsVariantMode(false);
                }}
                onSelect={handleExerciseSelect}
                availableExercises={sortedExercises}
                isVariantSelector={isVariantMode}
                title={isVariantMode ? "NODO_VARIANTE" : "NODO_PRINCIPAL"}
            />
        </div >
    );
}
