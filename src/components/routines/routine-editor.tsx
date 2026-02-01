"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RoutineSchema, RoutineDaySchema, RoutineExerciseSchema, RoutineSetSchema } from "@/lib/schemas";
import { createRoutine, updateRoutine, generateRoutineWithAI } from "@/actions/routine-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash, GripVertical, Wand2, Sparkles, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// We need a slightly looser schema for the form to allow temporary empty states or UI-specific fields
// but ideally we map to the RoutineSchema on submit.

// AI Generator Component
function AIGenerator({ onGenerate }: { onGenerate: (routine: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [criteria, setCriteria] = useState({
        goal: "hypertrophy",
        daysPerWeek: 3,
        experienceLevel: "intermediate",
        injuries: "",
        focus: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const injuriesArray = criteria.injuries.split(",").map(s => s.trim()).filter(Boolean);
            const res = await generateRoutineWithAI({
                athleteId: "generic", // In this context we are generating a template or specific routine
                goal: criteria.goal,
                daysPerWeek: Number(criteria.daysPerWeek),
                experienceLevel: criteria.experienceLevel,
                injuries: injuriesArray,
                focus: criteria.focus
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
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-500 gap-2">
                    <Sparkles className="w-4 h-4" /> Generar con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-red-500" /> Generador de Rutinas IA
                    </DialogTitle>
                    <DialogDescription>
                        Define los parámetros y deja que la IA estructure el plan ideal.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Objetivo</Label>
                            <Select value={criteria.goal} onValueChange={(v) => setCriteria({ ...criteria, goal: v })}>
                                <SelectTrigger className="bg-black/50 border-neutral-800"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                    <SelectItem value="strength">Fuerza</SelectItem>
                                    <SelectItem value="weight_loss">Pérdida de Peso</SelectItem>
                                    <SelectItem value="endurance">Resistencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Días/Semana</Label>
                            <Input
                                type="number"
                                min={1} max={7}
                                value={criteria.daysPerWeek}
                                onChange={(e) => setCriteria({ ...criteria, daysPerWeek: Number(e.target.value) })}
                                className="bg-black/50 border-neutral-800"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Nivel</Label>
                        <Select value={criteria.experienceLevel} onValueChange={(v) => setCriteria({ ...criteria, experienceLevel: v })}>
                            <SelectTrigger className="bg-black/50 border-neutral-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Principiante</SelectItem>
                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                <SelectItem value="advanced">Avanzado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Lesiones (separadas por coma)</Label>
                        <Input
                            placeholder="Ej: rodilla derecha, hombro izquierdo"
                            value={criteria.injuries}
                            onChange={(e) => setCriteria({ ...criteria, injuries: e.target.value })}
                            className="bg-black/50 border-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Enfoque Extra (Opcional)</Label>
                        <Input
                            placeholder="Ej: Priorizar glúteos, brazos..."
                            value={criteria.focus}
                            onChange={(e) => setCriteria({ ...criteria, focus: e.target.value })}
                            className="bg-black/50 border-neutral-800"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generar Rutina
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface RoutineEditorProps {
    initialData?: any; // If editing
    isEditing?: boolean;
    availableExercises?: any[];
}

export function RoutineEditor({ initialData, isEditing = false, availableExercises = [] }: RoutineEditorProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    const form = useForm({
        defaultValues: initialData || {
            name: "",
            description: "",
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

    // We need a helper to manage exercises for the ACTIVE day
    // This is tricky with useFieldArray nested. simpler to watch entire schedule and mutate?
    // Or use nested useFieldArray components. For simplicity in a single file, let's watch schedule.
    const schedule = watch("schedule");

    const addExerciseToDay = (dayIndex: number) => {
        const currentExercises = schedule[dayIndex].exercises || [];
        const newExercise = {
            exerciseId: "", // user will select
            exerciseName: "Nuevo Ejercicio",
            sets: [
                { type: "working", reps: "10-12", rpeTarget: 8, restSeconds: 60 }
            ],
            order: currentExercises.length + 1
        };

        // Update form value
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].exercises.push(newExercise);
        setValue("schedule", updatedSchedule);
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].exercises.splice(exIndex, 1);
        setValue("schedule", updatedSchedule);
    };

    const updateExerciseField = (dayIndex: number, exIndex: number, field: string, value: any) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].exercises[exIndex] = {
            ...updatedSchedule[dayIndex].exercises[exIndex],
            [field]: value
        };
        setValue("schedule", updatedSchedule);
    };

    const onAIResult = (aiRoutine: any) => {
        // Map AI result to form structure if needed
        // Assuming AI returns compatible structure
        reset({
            name: aiRoutine.name,
            description: aiRoutine.description,
            schedule: aiRoutine.schedule
        });
        toast.success("Rutina aplicada al editor. ¡Revisa y ajusta!");
    };

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            const res = isEditing
                ? await updateRoutine(initialData.id, data)
                : await createRoutine(data);

            if (res.success) {
                toast.success(isEditing ? "Rutina actualizada" : "Rutina creada");
                router.push("/routines");
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

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase">
                        {isEditing ? "Editar Rutina" : "Constructor de Rutinas"}
                    </h1>
                    <p className="text-neutral-400 text-sm">Diseña cada detalle del plan de entrenamiento.</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <AIGenerator onGenerate={onAIResult} />
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="bg-white text-black hover:bg-neutral-200 font-bold rounded-full">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <datalist id="exercises-list">
                    {availableExercises?.map((ex: any) => (
                        <option key={ex.id} value={ex.name}>{ex.muscleGroups?.join(", ")}</option>
                    ))}
                </datalist>

                {/* Left: Metadata & Day Nav */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="bg-neutral-900/50 border-neutral-800">
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre de la Rutina</Label>
                                <Input {...register("name")} placeholder="Ej: PPL Avanzado" className="bg-black/50 border-neutral-800 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea {...register("description")} placeholder="Objetivos, detalles..." className="bg-black/50 border-neutral-800 text-white min-h-[100px]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/50 border-neutral-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase text-neutral-500 font-bold">Estructura Semanal</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-2">
                            {dayFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    onClick={() => setActiveDayIndex(index)}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all border",
                                        activeDayIndex === index
                                            ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/20"
                                            : "bg-black/40 text-neutral-400 border-transparent hover:bg-neutral-800"
                                    )}
                                >
                                    <div className="font-bold">
                                        <span className="opacity-50 text-xs mr-2">Día {index + 1}</span>
                                        {schedule[index]?.name || `Día ${index + 1}`}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-white/50 hover:text-white"
                                        onClick={(e) => { e.stopPropagation(); removeDay(index); }}
                                    >
                                        <Trash className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500"
                                onClick={() => appendDay({ name: `Día ${dayFields.length + 1}`, exercises: [] })}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Agregar Día
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Day Content Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {schedule[activeDayIndex] ? (
                        <Card className="bg-neutral-900 border-neutral-800 min-h-[600px]">
                            <CardHeader className="border-b border-neutral-800 pb-4">
                                <div className="flex justify-between items-center">
                                    <Input
                                        value={schedule[activeDayIndex].name}
                                        onChange={(e) => {
                                            const newSched = [...schedule];
                                            newSched[activeDayIndex].name = e.target.value;
                                            setValue("schedule", newSched);
                                        }}
                                        className="text-xl font-bold bg-transparent border-none text-white focus-visible:ring-0 p-0 h-auto w-auto"
                                    />
                                    <Button size="sm" onClick={() => addExerciseToDay(activeDayIndex)} className="rounded-full bg-white text-black hover:bg-neutral-200">
                                        <Plus className="w-4 h-4 mr-1" /> Ejercicio
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {schedule[activeDayIndex].exercises?.length === 0 && (
                                    <div className="text-center py-10 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-2xl">
                                        <p>No hay ejercicios en este día.</p>
                                        <Button variant="link" onClick={() => addExerciseToDay(activeDayIndex)} className="text-red-500">
                                            Añadir el primero
                                        </Button>
                                    </div>
                                )}

                                {schedule[activeDayIndex].exercises?.map((exercise: any, exIndex: number) => (
                                    <div key={exIndex} className="bg-black/50 rounded-2xl p-4 border border-neutral-800 group hover:border-neutral-700 transition-colors">
                                        <div className="flex justify-between items-start mb-3 gap-4">
                                            <div className="flex-1">
                                                <Input
                                                    value={exercise.exerciseName}
                                                    onChange={(e) => updateExerciseField(activeDayIndex, exIndex, "exerciseName", e.target.value)}
                                                    placeholder="Nombre del Ejercicio"
                                                    list="exercises-list"
                                                    className="font-bold text-lg bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-white placeholder:text-neutral-600"
                                                />
                                                <Input
                                                    value={exercise.notes || ""}
                                                    onChange={(e) => updateExerciseField(activeDayIndex, exIndex, "notes", e.target.value)}
                                                    placeholder="Notas (técnica, tempo...)"
                                                    className="text-sm text-neutral-400 bg-transparent border-none p-0 h-auto focus-visible:ring-0 placeholder:text-neutral-700"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeExercise(activeDayIndex, exIndex)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-500"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Sets Table */}
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-10 gap-2 text-xs uppercase font-bold text-neutral-500 text-center mb-1">
                                                <div className="col-span-2">Tipo</div>
                                                <div className="col-span-3">Reps</div>
                                                <div className="col-span-2">RPE</div>
                                                <div className="col-span-2">Descanso</div>
                                                <div className="col-span-1"></div>
                                            </div>

                                            {exercise.sets?.map((set: any, setIndex: number) => (
                                                <div key={setIndex} className="grid grid-cols-10 gap-2 items-center">
                                                    <div className="col-span-2">
                                                        <Select
                                                            value={set.type}
                                                            onValueChange={(v) => {
                                                                const newSets = [...exercise.sets];
                                                                newSets[setIndex].type = v;
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="warmup">Calentamiento</SelectItem>
                                                                <SelectItem value="working">Efectiva</SelectItem>
                                                                <SelectItem value="failure">Al Fallo</SelectItem>
                                                                <SelectItem value="drop">Drop Set</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Input
                                                            value={set.reps}
                                                            onChange={(e) => {
                                                                const newSets = [...exercise.sets];
                                                                newSets[setIndex].reps = e.target.value;
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                            className="h-8 text-xs bg-neutral-900 border-neutral-800 text-center"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={set.rpeTarget}
                                                            onChange={(e) => {
                                                                const newSets = [...exercise.sets];
                                                                newSets[setIndex].rpeTarget = Number(e.target.value);
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                            className="h-8 text-xs bg-neutral-900 border-neutral-800 text-center"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={set.restSeconds}
                                                            onChange={(e) => {
                                                                const newSets = [...exercise.sets];
                                                                newSets[setIndex].restSeconds = Number(e.target.value);
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                            className="h-8 text-xs bg-neutral-900 border-neutral-800 text-center"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-neutral-600 hover:text-red-500"
                                                            onClick={() => {
                                                                const newSets = [...exercise.sets];
                                                                newSets.splice(setIndex, 1);
                                                                updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                            }}
                                                        >
                                                            <Trash className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs text-neutral-500 hover:text-white mt-1 h-6"
                                                onClick={() => {
                                                    const newSets = [...exercise.sets, { type: "working", reps: "8-12", rpeTarget: 8, restSeconds: 90 }];
                                                    updateExerciseField(activeDayIndex, exIndex, "sets", newSets);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Agregar Serie
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[400px] text-neutral-500 border-2 border-dashed border-neutral-800 rounded-3xl">
                            Selecciona o crea un día para editar su contenido
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
