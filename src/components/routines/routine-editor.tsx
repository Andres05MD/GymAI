"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { createRoutine, updateRoutine, generateRoutineWithAI } from "@/actions/routine-actions";
import { generateRoutineDescription } from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Wand2, Sparkles, Save, ArrowLeft, Check, ChevronsUpDown, Dumbbell, CalendarDays, Clock, Copy } from "lucide-react";
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
                toast.success("¡Rutina generada por IA!");
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
                <Button variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white gap-2 transition-all rounded-full px-4 sm:px-8 h-12 text-xs sm:text-sm font-bold tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">GENERAR CON IA</span>
                    <span className="sm:hidden">IA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[500px] p-6 rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
                        <Wand2 className="w-6 h-6 text-red-500" /> Generador IA
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Define tus objetivos y deja que la IA cree el plan perfecto.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Objetivo Principal</Label>
                            <Select value={criteria.goal} onValueChange={(v) => setCriteria({ ...criteria, goal: v })}>
                                <SelectTrigger className="bg-neutral-800 border-transparent rounded-xl h-12 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                    <SelectItem value="strength">Fuerza</SelectItem>
                                    <SelectItem value="weight_loss">Pérdida de Peso</SelectItem>
                                    <SelectItem value="endurance">Resistencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Días / Semana</Label>
                            <Input
                                type="number"
                                min={1} max={7}
                                value={criteria.daysPerWeek}
                                onChange={(e) => setCriteria({ ...criteria, daysPerWeek: Number(e.target.value) })}
                                className="bg-neutral-800 border-transparent rounded-xl h-12 text-white focus-visible:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Nivel de Experiencia</Label>
                        <Select value={criteria.experienceLevel} onValueChange={(v) => setCriteria({ ...criteria, experienceLevel: v })}>
                            <SelectTrigger className="bg-neutral-800 border-transparent rounded-xl h-12 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectItem value="beginner">Principiante</SelectItem>
                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                <SelectItem value="advanced">Avanzado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Lesiones (Opcional)</Label>
                        <Input
                            placeholder="Ej: rodilla derecha..."
                            value={criteria.injuries}
                            onChange={(e) => setCriteria({ ...criteria, injuries: e.target.value })}
                            className="bg-neutral-800 border-transparent rounded-xl h-12 text-white focus-visible:ring-red-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">¿Qué necesitas? (Prompt Libre)</Label>
                        <Textarea
                            placeholder="Ej: Quiero una rutina que incluya ejercicios de peso corporal y se enfoque en la fuerza explosiva para atletismo..."
                            value={criteria.userPrompt}
                            onChange={(e) => setCriteria({ ...criteria, userPrompt: e.target.value })}
                            className="bg-neutral-800 border-transparent rounded-xl min-h-[100px] text-white focus-visible:ring-red-500 resize-none"
                        />
                    </div>

                    <Button onClick={handleGenerate} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 rounded-xl uppercase tracking-widest text-sm shadow-lg shadow-red-900/20">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        GENERAR RUTINA
                    </Button>
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
        <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-neutral-400 hover:text-white hover:bg-white/10 shrink-0">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                            {isEditing ? "Editar Rutina" : "Constructor de Rutinas"}
                        </h1>
                        <p className="text-neutral-500 font-medium text-xs sm:text-base mt-1">Diseña cada detalle del plan.</p>
                    </div>
                </div>
                <div className="flex gap-2 sm:gap-3 justify-end">
                    <RoutineSafetyCheck routine={watch()} athleteId={athleteId} />
                    <RoutineImporter routines={availableRoutines} onImport={onAIResult} />
                    <AIGenerator onGenerate={onAIResult} currentType={watch("type") as "weekly" | "daily"} />
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="bg-white text-black hover:bg-neutral-200 font-bold rounded-full px-4 sm:px-8 h-12 tracking-wide transition-all shadow-md hover:shadow-lg text-xs sm:text-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <Save className="w-4 h-4 sm:mr-2" />}
                        <span className="hidden sm:inline">GUARDAR</span>
                        <span className="sm:hidden">GUARDAR</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Metadata & Day Selection (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Basic Info Card */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombre de la Rutina</Label>
                            <Input
                                {...register("name")}
                                placeholder="Ej: Push Pull Legs Avanzado"
                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-xl h-14 px-4 text-lg font-medium focus-visible:ring-red-500 transition-all"
                            />
                        </div>

                        {/* Routine Type Selector */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Tipo de Planificación</Label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setValue("type", "weekly")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                                        routineType === "weekly" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-300"
                                    )}
                                >
                                    <CalendarDays className="w-4 h-4" /> Semanal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setValue("type", "daily");
                                        // Reducir a 1 solo día al cambiar a diaria
                                        if (schedule.length > 1) {
                                            setValue("schedule", [schedule[0]]);
                                        }
                                        setActiveDayIndex(0);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                                        routineType === "daily" ? "bg-neutral-800 text-white shadow-sm border border-neutral-700/50" : "text-neutral-500 hover:text-neutral-300"
                                    )}
                                >
                                    <Clock className="w-4 h-4" /> Diaria
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Descripción</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleGenerateDescription}
                                    disabled={isGeneratingDescription}
                                    className="h-6 text-[10px] uppercase font-bold text-red-500 hover:text-white hover:bg-red-500/10 px-2 rounded-full"
                                >
                                    {isGeneratingDescription ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                    Generar con IA
                                </Button>
                            </div>
                            <Textarea
                                {...register("description")}
                                placeholder="Objetivos principales, duración recomendada, notas..."
                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 rounded-xl min-h-[120px] p-4 font-medium focus-visible:ring-red-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Week Structure */}
                    {(routineType === "weekly" || (routineType !== "daily" && schedule.length > 1)) && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Estructura Semanal</Label>
                                <span className="text-xs text-neutral-600 font-mono bg-neutral-900 px-2 py-1 rounded-md">{schedule.length} Días</span>
                            </div>

                            <div className="space-y-3">
                                {dayFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setActiveDayIndex(index)}
                                        className={cn(
                                            "group relative p-4 rounded-2xl cursor-pointer flex justify-between items-center transition-all duration-300 border-2",
                                            activeDayIndex === index
                                                ? "bg-neutral-900 border-red-600 shadow-[0_0_20px_-5px_var(--color-red-900)]"
                                                : "bg-neutral-900 border-transparent hover:border-neutral-800 hover:bg-neutral-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                                                activeDayIndex === index ? "bg-red-600 border-red-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-500 group-hover:text-white"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-0.5">
                                                    {WEEKDAYS[index] || `Día ${index + 1}`}
                                                </p>
                                                <p className={cn("font-bold text-base transition-colors", activeDayIndex === index ? "text-white" : "text-neutral-400 group-hover:text-white")}>
                                                    {schedule[index]?.name || `Día ${index + 1}`}
                                                </p>
                                                <p className="text-xs text-neutral-600 font-medium">
                                                    {schedule[index]?.exercises?.length || 0} Ejercicios
                                                </p>
                                            </div>
                                        </div>

                                        {activeDayIndex === index && (
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-l-full" />
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => { e.stopPropagation(); removeDay(index); }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                {dayFields.length < 5 && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 border-dashed border-neutral-800 bg-transparent text-neutral-500 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 rounded-2xl transition-all"
                                        onClick={() => appendDay({ name: WEEKDAYS[dayFields.length] || `Día ${dayFields.length + 1}`, exercises: [] })}
                                    >
                                        <Plus className="w-5 h-5 mr-2" /> AÑADIR {WEEKDAYS[dayFields.length]?.toUpperCase() || "DÍA"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Day Editor (8 cols) */}
                <div className="lg:col-span-8">
                    {schedule[activeDayIndex] ? (
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-1 overflow-hidden min-h-[600px]">
                            {/* Header Day */}
                            <div className="bg-neutral-900 border-b border-neutral-800 p-6 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-3xl">
                                <div>
                                    <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1">
                                        {routineType === 'daily' ? 'Sesión Única' : WEEKDAYS[activeDayIndex] || `Día ${activeDayIndex + 1}`}
                                    </Label>
                                    <Input
                                        value={schedule[activeDayIndex].name}
                                        onChange={(e) => {
                                            const newSched = [...schedule];
                                            newSched[activeDayIndex].name = e.target.value;
                                            setValue("schedule", newSched);
                                        }}
                                        className="text-2xl sm:text-3xl font-black bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0 placeholder:text-neutral-700 w-full md:w-[400px]"
                                        placeholder="Nombre del Día..."
                                    />
                                </div>
                                <Button onClick={() => addExerciseToDay(activeDayIndex)} className="w-full sm:w-auto rounded-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-lg shadow-red-900/20">
                                    <Plus className="w-5 h-5 mr-2" /> AGREGAR EJERCICIO
                                </Button>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                {schedule[activeDayIndex].exercises?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                                        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-600">
                                            <Dumbbell className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-neutral-300 font-medium text-lg">Este día está vacío</p>
                                            <p className="text-neutral-500 text-sm">Comienza agregando ejercicios a la sesión.</p>
                                        </div>
                                        <Button variant="link" onClick={() => addExerciseToDay(activeDayIndex)} className="text-red-500 font-bold">
                                            Añadir primer ejercicio
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {schedule[activeDayIndex].exercises?.map((exercise: ScheduleExercise, exIndex: number) => (
                                            <div key={exIndex} className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-sm hover:border-neutral-700 transition-colors group">
                                                {/* Exercise Header */}
                                                <div className="p-3 sm:p-4 bg-neutral-900/50 border-b border-neutral-800 flex flex-row gap-3 justify-between items-center">
                                                    <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 text-[10px] sm:text-xs font-bold shrink-0">
                                                            {exIndex + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0 relative">
                                                            {/* Exercise Selector Trigger */}
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between items-center text-left text-base sm:text-lg font-bold text-white hover:bg-neutral-800 hover:text-white px-2 h-auto py-2 whitespace-normal wrap-break-word"
                                                                onClick={() => openExerciseSelector(activeDayIndex, exIndex)}
                                                            >
                                                                <span className="mr-2 leading-tight">
                                                                    {exercise.exerciseName || "Seleccionar ejercicio..."}
                                                                </span>
                                                                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeExercise(activeDayIndex, exIndex)}
                                                        className="h-8 w-8 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="p-3 sm:p-4 space-y-4">
                                                    <Input
                                                        value={exercise.notes || ""}
                                                        onChange={(e) => updateExerciseField(activeDayIndex, exIndex, "notes", e.target.value)}
                                                        placeholder="Notas técnicas (opcional)..."
                                                        className="bg-transparent border-transparent border-b-neutral-800 rounded-none px-0 h-auto py-2 text-sm text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-600 placeholder:text-neutral-700"
                                                    />

                                                    {/* Variantes Section */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Variantes / Alternativos</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-[10px] text-red-500 hover:text-white hover:bg-red-500/10 rounded-full px-2"
                                                                onClick={() => {
                                                                    setIsVariantMode(true);
                                                                    openExerciseSelector(activeDayIndex, exIndex);
                                                                }}
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" /> AÑADIR VARIANTE
                                                            </Button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 min-h-6">
                                                            {exercise.variantIds && exercise.variantIds.length > 0 ? (
                                                                exercise.variantIds.map((vId: string) => {
                                                                    const vEx = availableExercises.find(ex => ex.id === vId);
                                                                    return (
                                                                        <div key={vId} className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 flex items-center gap-2 group/var">
                                                                            <span className="text-[11px] text-white font-medium">{vEx?.name || "Cargando..."}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeVariant(activeDayIndex, exIndex, vId)}
                                                                                className="text-neutral-600 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <p className="text-[10px] text-neutral-600 italic">No hay variantes seleccionadas</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sets Area - Mobile & Desktop Optimized */}
                                                    <div className="bg-neutral-900 rounded-xl p-2 md:p-1 overflow-hidden mt-2">
                                                        {/* Desktop Header */}
                                                        <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-neutral-500 text-center mb-2 px-2 pt-2">
                                                            <div className="col-span-3 text-left pl-2">Tipo</div>
                                                            <div className="col-span-3">Reps</div>
                                                            <div className="col-span-2">RPE</div>
                                                            <div className="col-span-3">Descanso (s)</div>
                                                            <div className="col-span-1"></div>
                                                        </div>

                                                        <div className="space-y-2 md:space-y-1">
                                                            {exercise.sets?.map((set: ExerciseSet, setIndex: number) => (
                                                                <div key={setIndex} className="relative bg-neutral-800/20 md:bg-transparent p-2.5 md:p-0 rounded-xl md:rounded-none flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-2 items-center group/set border border-white/5 md:border-none">

                                                                    {/* Mobile Row Header: # & Type & Delete */}
                                                                    <div className="flex md:hidden w-full justify-between items-center mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="bg-neutral-800 text-neutral-400 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                                                                {setIndex + 1}
                                                                            </span>
                                                                            <Select
                                                                                value={set.type}
                                                                                onValueChange={(v) => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets[setIndex].type = v;
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-6 w-auto min-w-[100px] text-[10px] uppercase font-bold bg-neutral-800 border-transparent text-white focus:bg-neutral-700 p-0 px-2.5 rounded-md gap-2">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                                                                    <SelectItem value="warmup">Calentamiento</SelectItem>
                                                                                    <SelectItem value="working">Efectiva</SelectItem>
                                                                                    <SelectItem value="failure">Al Fallo</SelectItem>
                                                                                    <SelectItem value="drop">Drop Set</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-neutral-600 hover:text-white"
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
                                                                                className="h-7 w-7 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 -mr-1"
                                                                                onClick={() => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets.splice(setIndex, 1);
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Desktop Type Selector */}
                                                                    <div className="hidden md:block col-span-3">
                                                                        <Select
                                                                            value={set.type}
                                                                            onValueChange={(v) => {
                                                                                const newSets = [...exercise.sets];
                                                                                newSets[setIndex].type = v;
                                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="h-8 text-xs bg-transparent border-transparent text-white focus:bg-neutral-800 p-0 px-2">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                                                                <SelectItem value="warmup">Calentamiento</SelectItem>
                                                                                <SelectItem value="working">Efectiva</SelectItem>
                                                                                <SelectItem value="failure">Al Fallo</SelectItem>
                                                                                <SelectItem value="drop">Drop Set</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Inputs Grid */}
                                                                    <div className="grid grid-cols-3 md:contents gap-2 w-full">
                                                                        <div className="col-span-1 md:col-span-3 space-y-1">
                                                                            <div className="md:hidden flex justify-center">
                                                                                <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">Reps</span>
                                                                            </div>
                                                                            <Input
                                                                                value={set.reps}
                                                                                onChange={(e) => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets[setIndex].reps = e.target.value;
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                                className="h-10 md:h-8 text-sm md:text-xs bg-neutral-950 md:bg-neutral-800 border border-neutral-800 md:border-transparent text-center text-white font-bold focus:ring-1 focus:ring-white/20 rounded-xl md:rounded-md shadow-sm"
                                                                                placeholder="10-12"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1 md:col-span-2 space-y-1">
                                                                            <div className="md:hidden flex justify-center">
                                                                                <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">RPE</span>
                                                                            </div>
                                                                            <Select
                                                                                value={set.rpeTarget?.toString() || ""}
                                                                                onValueChange={(val) => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets[setIndex].rpeTarget = Number(val);
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger
                                                                                    className="h-10 md:h-8 w-full justify-center text-center text-sm md:text-xs bg-neutral-950 md:bg-neutral-800 border border-neutral-800 md:border-transparent text-white font-bold focus:ring-1 focus:ring-white/20 rounded-xl md:rounded-md shadow-sm px-0 [&>svg]:hidden transition-all"
                                                                                >
                                                                                    <SelectValue placeholder="8" />
                                                                                </SelectTrigger>
                                                                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white min-w-[60px]">
                                                                                    {[10, 9, 8, 7, 6, 5].map((val) => (
                                                                                        <SelectItem key={val} value={val.toString()} className="justify-center focus:bg-neutral-800 focus:text-white">
                                                                                            {val}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="col-span-1 md:col-span-3 space-y-1">
                                                                            <div className="md:hidden flex justify-center">
                                                                                <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">Rest(s)</span>
                                                                            </div>
                                                                            <Input
                                                                                type="number"
                                                                                value={set.restSeconds}
                                                                                onChange={(e) => {
                                                                                    const newSets = [...exercise.sets];
                                                                                    newSets[setIndex].restSeconds = Number(e.target.value);
                                                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                                }}
                                                                                className="h-10 md:h-8 text-sm md:text-xs bg-neutral-950 md:bg-neutral-800 border border-neutral-800 md:border-transparent text-center text-white font-bold focus:ring-1 focus:ring-white/20 rounded-xl md:rounded-md shadow-sm"
                                                                                placeholder="90"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Desktop Actions */}
                                                                    <div className="hidden md:flex col-span-1 justify-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-neutral-600 hover:text-white hover:bg-neutral-800 opacity-0 group-hover/set:opacity-100 transition-opacity"
                                                                            onClick={() => {
                                                                                const newSets = [...exercise.sets];
                                                                                newSets.splice(setIndex + 1, 0, { ...set });
                                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                            }}
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover/set:opacity-100 transition-opacity"
                                                                            onClick={() => {
                                                                                const newSets = [...exercise.sets];
                                                                                newSets.splice(setIndex, 1);
                                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 mt-2 h-8 rounded-lg"
                                                            onClick={() => {
                                                                const newSets = [...exercise.sets, { type: "working", reps: "8-12", rpeTarget: 8, restSeconds: 90 }];
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> AÑADIR SERIE
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {schedule[activeDayIndex].exercises?.length > 0 && (
                                    <Button
                                        onClick={() => addExerciseToDay(activeDayIndex)}
                                        variant="outline"
                                        className="w-full h-14 border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 rounded-xl transition-all group mt-4 dashed-border-0 shadow-sm"
                                    >
                                        <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold uppercase tracking-widest">AÑADIR EJERCICIO</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-neutral-500 border-2 border-dashed border-neutral-800 bg-neutral-900/20 rounded-3xl opacity-50">
                            <Label className="text-xl font-bold uppercase tracking-widest text-neutral-700">Nada Seleccionado</Label>
                            <p className="text-sm">Selecciona o crea un día para comenzar a editar.</p>
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
                title={isVariantMode ? "Añadir Variante" : "Seleccionar Ejercicio"}
            />
        </div >
    );
}
