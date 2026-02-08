"use client";

import { useForm, useFieldArray, Control, UseFormRegister, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RoutineSchema } from "@/lib/schemas";
import { createRoutine } from "@/actions/routine-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Asumimos shadcn textarea o usamos input
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ExerciseSelector } from "./exercise-selector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIGeneratorDialog } from "@/components/routines/ai-generator-dialog";

// Modificar schema para formulario local si es necesario, 
// o usar RoutineSchema.omit(...) como base.
const FormSchema = RoutineSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true
});

type FormValues = z.infer<typeof FormSchema>;

// Tipos para los ejercicios del formulario
interface ExerciseField {
    id: string;
    exerciseName: string;
    exerciseId?: string;
    order: number;
    sets: Array<{ type: string; reps: string; rpeTarget?: number; restSeconds?: number }>;
}

// Subcomponente para manejar lógica de ejercicios dentro de un día
// TODO: Tipar correctamente cuando se refactorice el formulario
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DayExercises({ dayIndex, control, register }: { dayIndex: number; control: any; register: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `schedule.${dayIndex}.exercises`
    });

    return (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Ejercicios del día</h4>
                <div className="w-[250px]">
                    <ExerciseSelector onSelect={(exercise) => {
                        append({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            order: fields.length,
                            sets: [{ type: "working", reps: "10", restSeconds: 60 }]
                        })
                    }} />
                </div>
            </div>

            {fields.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    Agrega ejercicios usando el buscador.
                </div>
            )}

            <div className="space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="border rounded-md p-3 bg-card/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <span className="font-semibold">{(item as ExerciseField).exerciseName}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>

                        {/* Aquí iría la gestión de Series (Sets) usando otro useFieldArray anidado */}
                        {/* Simplificación MVP: Input para sets en texto plano o fijo */}
                        {/* Para hacerlo bien, necesitamos otro componente anidado 'ExerciseSets' */}
                        <ExerciseSets
                            nestIndex={`schedule.${dayIndex}.exercises.${index}.sets`}
                            control={control}
                            register={register}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ExerciseSets({ nestIndex, control, register }: { nestIndex: string; control: any; register: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: nestIndex
    });

    return (
        <div className="pl-4 border-l-2 border-muted ml-1 space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-1">
                <div className="col-span-3">Tipo</div>
                <div className="col-span-3">Reps</div>
                <div className="col-span-3">RPE</div>
                <div className="col-span-2">Descanso (s)</div>
                <div className="col-span-1"></div>
            </div>
            {fields.map((item, k) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                        <select {...register(`${nestIndex}.${k}.type`)} className="w-full text-xs p-1 border rounded bg-background">
                            <option value="warmup">Calentamiento</option>
                            <option value="working">Efectiva</option>
                            <option value="failure">Fallo</option>
                            <option value="drop">Drop Set</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <Input {...register(`${nestIndex}.${k}.reps`)} className="h-7 text-xs" placeholder="10" />
                    </div>
                    <div className="col-span-3">
                        <Input {...register(`${nestIndex}.${k}.rpeTarget`, { valueAsNumber: true })} className="h-7 text-xs" placeholder="8" type="number" />
                    </div>
                    <div className="col-span-2">
                        <Input {...register(`${nestIndex}.${k}.restSeconds`, { valueAsNumber: true })} className="h-7 text-xs" placeholder="60" type="number" />
                    </div>
                    <div className="col-span-1 text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(k)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs mt-1"
                onClick={() => append({ type: "working", reps: "10-12", rpeTarget: 8, restSeconds: 60 })}
            >
                <Plus className="h-3 w-3 mr-1" /> Añadir Serie
            </Button>
        </div>
    )
}


export function RoutineForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(FormSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            active: true,
            athleteId: "generic", // TODO: Selector de atleta real
            schedule: [
                { name: "Día 1", exercises: [] }
            ]
        }
    });

    const { fields: dayFields, append: appendDay, remove: removeDay, replace: replaceDay } = useFieldArray({
        control,
        name: "schedule"
    });

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createRoutine(data as unknown as Parameters<typeof createRoutine>[0]);
            if (result.success) {
                toast.success("Rutina creada exitosamente");
                router.push("/routines");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de Rutina</Label>
                    <Input id="name" {...register("name")} placeholder="Ej: Hipertrofia 4 Días" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" {...register("description")} placeholder="Objetivo principal..." />
                </div>
                {/* TODO: Selector de Atleta aquí */}
                <input type="hidden" {...register("athleteId")} value="temp-id" />
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Planificación Semanal</h3>
                    <div className="flex gap-2">
                        <AIGeneratorDialog onGenerate={(schedule) => {
                            // Reemplazamos todos los fields con la data generada (con IDs nuevos para keys de react)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const scheduleWithIds = schedule.map((day: any) => ({
                                ...day,
                                id: crypto.randomUUID(),
                                // Asegurar que exercises tengan estructura correcta si faltara algo
                            }));
                            // replace(scheduleWithIds); // replace no está expuesto por este destructuring, usaremos setValue o modificamos el hook
                            // Como no extrajimos 'replace' de useFieldArray, podemos usar setValue del form
                            // Pero mejor extraigamos replace arriba
                            replaceDay(scheduleWithIds);
                        }} />
                        <Button type="button" onClick={() => appendDay({ id: crypto.randomUUID(), name: `Día ${dayFields.length + 1}`, exercises: [] })} variant="secondary">
                            <Plus className="mr-2 h-4 w-4" /> Añadir Día
                        </Button>
                    </div>
                </div>

                <Accordion type="multiple" className="w-full" defaultValue={dayFields.map(d => d.id)}>
                    {dayFields.map((field, index) => (
                        <AccordionItem key={field.id} value={field.id}>
                            <AccordionTrigger className="hover://no-underline px-4 bg-muted/20 rounded-t-md">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="font-semibold">Día {index + 1}</span>
                                    <Input
                                        {...register(`schedule.${index}.name`)}
                                        className="h-8 w-[200px] bg-background"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="ml-auto mr-4 flex items-center" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => removeDay(index)}
                                        >
                                            Eliminar Día
                                        </Button>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-md">
                                <DayExercises dayIndex={index} control={control as Control<FormValues>} register={register} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Crear Rutina"}
                </Button>
            </div>
        </form>
    );
}
