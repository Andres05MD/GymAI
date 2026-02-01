"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Clock, Save, ArrowLeft, Trophy, Info } from "lucide-react";
import { logWorkoutSession } from "@/actions/training-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AIAssistantDialog } from "@/components/training/ai-assistant-dialog";

interface WorkoutSessionProps {
    routine: any;
}

export function WorkoutSession({ routine }: WorkoutSessionProps) {
    const router = useRouter();
    const [activeDayIndex, setActiveDayIndex] = useState(0); // Default to first day or determine by logic
    const [startTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state structure matching schema
    // We map the active day exercises to a local state for logging
    const [sessionLog, setSessionLog] = useState<any[]>([]);

    const activeDay = routine.schedule[activeDayIndex];

    useEffect(() => {
        // Initialize log state when day changes
        if (activeDay) {
            setSessionLog(activeDay.exercises.map((ex: any) => ({
                exerciseId: ex.exerciseId || "temp-id",
                exerciseName: ex.exerciseName,
                sets: ex.sets.map((set: any) => ({
                    reps: "",
                    weight: "",
                    rpe: "",
                    completed: false,
                    targetReps: set.reps, // Keep reference to target
                })),
                feedback: ""
            })));
        }
    }, [activeDay]);

    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
        const newLog = [...sessionLog];
        newLog[exerciseIndex].sets[setIndex][field] = value;
        setSessionLog(newLog);
    };

    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const current = sessionLog[exerciseIndex].sets[setIndex].completed;
        updateSet(exerciseIndex, setIndex, "completed", !current);
    };

    const handleFinish = async () => {
        if (!confirm("¿Terminar entrenamiento? Asegúrate de haber completado las series.")) return;

        setIsSubmitting(true);
        try {
            // Transform data to fit Schema
            const logData = {
                routineId: routine.id,
                dayId: activeDay.id || activeDay.name, // Fallback if no specific ID
                durationMinutes: Math.round(elapsedTime / 60),
                exercises: sessionLog.map(ex => ({
                    exerciseName: ex.exerciseName,
                    exerciseId: ex.exerciseId,
                    feedback: ex.feedback,
                    sets: ex.sets.filter((s: any) => s.completed || s.weight || s.reps).map((s: any) => ({
                        weight: Number(s.weight) || 0,
                        reps: Number(s.reps) || 0,
                        rpe: Number(s.rpe) || undefined,
                        completed: s.completed
                    }))
                }))
            };

            const res = await logWorkoutSession(logData);
            if (res.success) {
                toast.success("¡Entrenamiento guardado!", {
                    description: "Gran trabajo. Sigue así."
                });
                router.push("/");
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeDay) return <div className="p-10 text-center">No hay día activo seleccionado.</div>;

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-6">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-neutral-800 p-4 -mx-4 md:rounded-b-3xl md:mx-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-white">{activeDay.name}</h2>
                        <div className="flex items-center text-red-500 font-mono text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <AIAssistantDialog
                            muscleGroups={activeDay.exercises.map((e: any) => e.exerciseName)} // Naive mapping, improving later
                            availableExercises={activeDay.exercises.map((e: any) => e.exerciseName)}
                        />
                        <Button onClick={handleFinish} disabled={isSubmitting} className="rounded-full bg-white text-black font-bold hover:bg-neutral-200">
                            {isSubmitting ? "Guardando..." : "Terminar"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
                {activeDay.exercises.map((exercise: any, exIndex: number) => {
                    const logExercise = sessionLog[exIndex];
                    if (!logExercise) return null;

                    return (
                        <Card key={exIndex} className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
                            <CardHeader className="bg-neutral-900 border-b border-neutral-800 py-3">
                                <CardTitle className="text-lg text-white flex justify-between items-start">
                                    <span>{exercise.exerciseName}</span>
                                    {exercise.notes && (
                                        <div className="text-neutral-500 hover:text-white cursor-help" title={exercise.notes}>
                                            <Info className="w-5 h-5" />
                                        </div>
                                    )}
                                </CardTitle>
                                {exercise.notes && <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{exercise.notes}</p>}
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-neutral-800">
                                    <div className="grid grid-cols-12 gap-2 p-2 px-4 text-xs font-bold text-neutral-500 text-center uppercase">
                                        <div className="col-span-1">Set</div>
                                        <div className="col-span-3">Target</div>
                                        <div className="col-span-3">Kg</div>
                                        <div className="col-span-3">Reps</div>
                                        <div className="col-span-2">Done</div>
                                    </div>
                                    {exercise.sets.map((set: any, setIndex: number) => {
                                        const logSet = logExercise.sets[setIndex];
                                        const isCompleted = logSet?.completed;

                                        return (
                                            <div
                                                key={setIndex}
                                                className={cn(
                                                    "grid grid-cols-12 gap-2 p-3 items-center transition-colors",
                                                    isCompleted ? "bg-green-900/10" : "hover:bg-neutral-800/30"
                                                )}
                                            >
                                                <div className="col-span-1 flex flex-col items-center justify-center">
                                                    <span className={cn(
                                                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border",
                                                        set.type === 'warmup' ? "border-yellow-600/50 text-yellow-600" :
                                                            set.type === 'failure' ? "border-red-600/50 text-red-600" :
                                                                "border-neutral-700 text-neutral-400"
                                                    )}>
                                                        {setIndex + 1}
                                                    </span>
                                                </div>
                                                <div className="col-span-3 text-center text-sm text-neutral-400">
                                                    <div>{set.reps} reps</div>
                                                    {set.rpeTarget && <div className="text-[10px] opacity-70">RPE {set.rpeTarget}</div>}
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={logSet?.weight}
                                                        onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                                                        className={cn(
                                                            "h-9 text-center font-mono font-bold border-neutral-800 bg-black/50 focus:border-red-500 transition-all",
                                                            isCompleted && "text-green-500 border-green-900/50"
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={logSet?.reps}
                                                        onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                                                        className={cn(
                                                            "h-9 text-center font-mono font-bold border-neutral-800 bg-black/50 focus:border-red-500 transition-all",
                                                            isCompleted && "text-green-500 border-green-900/50"
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleSetComplete(exIndex, setIndex)}
                                                        className={cn(
                                                            "h-9 w-9 rounded-xl transition-all",
                                                            isCompleted
                                                                ? "bg-green-500 text-black hover:bg-green-600"
                                                                : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"
                                                        )}
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-3">
                                    <Input
                                        placeholder="Notas o sensaciones..."
                                        value={logExercise.feedback}
                                        onChange={(e) => {
                                            const newLog = [...sessionLog];
                                            newLog[exIndex].feedback = e.target.value;
                                            setSessionLog(newLog);
                                        }}
                                        className="bg-transparent border-none text-sm text-neutral-400 focus-visible:ring-0 placeholder:text-neutral-700 h-auto py-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="text-center pt-8 text-neutral-500 text-sm">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Termina fuerte. Cada repetición cuenta.</p>
            </div>
        </div>
    );
}
