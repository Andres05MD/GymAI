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

// --- INTERFACES ---

interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rpeTarget?: number;
    type?: "warmup" | "working" | "failure";
    rest?: number;
}

interface RoutineExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: RoutineSet[];
}

interface RoutineDay {
    id?: string;
    name: string;
    exercises: RoutineExercise[];
}

interface Routine {
    id: string;
    name: string;
    schedule: RoutineDay[];
}

interface SessionSet {
    reps: string;
    weight: string;
    rpe: string;
    completed: boolean;
    targetReps?: number;
}

interface SessionExercise {
    exerciseId: string;
    exerciseName: string;
    sets: SessionSet[];
    feedback: string;
}

interface WorkoutSessionProps {
    routine: Routine;
}

export function WorkoutSession({ routine }: WorkoutSessionProps) {
    const router = useRouter();
    const [activeDayIndex, setActiveDayIndex] = useState(0); // Default to first day or determine by logic
    const [startTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state structure matching schema
    // We map the active day exercises to a local state for logging
    const [sessionLog, setSessionLog] = useState<SessionExercise[]>([]);

    const activeDay = routine.schedule[activeDayIndex];

    useEffect(() => {
        // Initialize log state when day changes
        if (activeDay) {
            setSessionLog(activeDay.exercises.map((ex: RoutineExercise) => ({
                exerciseId: ex.exerciseId || "temp-id",
                exerciseName: ex.exerciseName,
                sets: ex.sets.map((set: RoutineSet) => ({
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

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SessionSet, value: string | boolean) => {
        const newLog = [...sessionLog];
        (newLog[exerciseIndex].sets[setIndex] as unknown as Record<string, unknown>)[field] = value;
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
                    sets: ex.sets.filter((s: SessionSet) => s.completed || s.weight || s.reps).map((s: SessionSet) => ({
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
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-3xl md:mx-0 shadow-2xl shadow-black/50">
                <div className="flex justify-between items-center max-w-3xl mx-auto">
                    <div>
                        <h2 className="text-lg font-black text-white tracking-tight">{activeDay.name}</h2>
                        <div className="flex items-center text-red-500 font-mono text-sm font-bold tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md w-fit mt-1">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <AIAssistantDialog
                            muscleGroups={activeDay.exercises.map((e: RoutineExercise) => e.exerciseName)}
                            availableExercises={activeDay.exercises.map((e: RoutineExercise) => e.exerciseName)}
                        />
                        <Button
                            onClick={handleFinish}
                            disabled={isSubmitting}
                            className="rounded-full bg-white text-black font-bold hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? "Guardando..." : "Terminar"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
                {activeDay.exercises.map((exercise: RoutineExercise, exIndex: number) => {
                    const logExercise = sessionLog[exIndex];
                    if (!logExercise) return null;

                    return (
                        <div key={exIndex} className="bg-neutral-900 rounded-[2rem] border border-neutral-800 overflow-hidden shadow-xl">
                            <div className="bg-neutral-900 border-b border-neutral-800/50 p-5 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-white">{exercise.exerciseName}</h3>
                                    {exercise.notes && (
                                        <div className="text-neutral-500 hover:text-white transition-colors cursor-help" title={exercise.notes}>
                                            <Info className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                {exercise.notes && <p className="text-sm text-neutral-400 line-clamp-2">{exercise.notes}</p>}
                            </div>

                            <div className="p-2 md:p-4">
                                <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-[10px] md:text-xs font-bold text-neutral-500 text-center uppercase tracking-widest">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-3">Meta</div>
                                    <div className="col-span-3">Kg</div>
                                    <div className="col-span-3">Reps</div>
                                    <div className="col-span-2">Ok</div>
                                </div>

                                <div className="space-y-2">
                                    {exercise.sets.map((set: RoutineSet, setIndex: number) => {
                                        const logSet = logExercise.sets[setIndex];
                                        const isCompleted = logSet?.completed;

                                        return (
                                            <div
                                                key={setIndex}
                                                className={cn(
                                                    "grid grid-cols-12 gap-2 p-2 rounded-xl items-center transition-all duration-300",
                                                    isCompleted ? "bg-green-500/10 border border-green-500/20" : "bg-black/20 border border-transparent"
                                                )}
                                            >
                                                <div className="col-span-1 flex justify-center">
                                                    <span className={cn(
                                                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",
                                                        set.type === 'warmup' ? "text-yellow-500 bg-yellow-500/10" :
                                                            set.type === 'failure' ? "text-red-500 bg-red-500/10" :
                                                                "text-neutral-500 bg-neutral-800"
                                                    )}>
                                                        {setIndex + 1}
                                                    </span>
                                                </div>
                                                <div className="col-span-3 text-center">
                                                    <div className="text-white font-medium text-sm">{set.reps}</div>
                                                    {set.rpeTarget && <div className="text-[10px] text-neutral-500">RPE {set.rpeTarget}</div>}
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        placeholder="-"
                                                        value={logSet?.weight}
                                                        onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                                                        className={cn(
                                                            "h-12 text-center text-lg font-bold border-0 bg-neutral-800/50 rounded-lg focus:ring-1 focus:ring-red-500 transition-all placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                            isCompleted && "text-green-500 bg-green-500/5"
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        placeholder="-"
                                                        value={logSet?.reps}
                                                        onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                                                        className={cn(
                                                            "h-12 text-center text-lg font-bold border-0 bg-neutral-800/50 rounded-lg focus:ring-1 focus:ring-red-500 transition-all placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                            isCompleted && "text-green-500 bg-green-500/5"
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleSetComplete(exIndex, setIndex)}
                                                        className={cn(
                                                            "h-12 w-12 rounded-xl transition-all duration-300",
                                                            isCompleted
                                                                ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                                                : "bg-neutral-800 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-400"
                                                        )}
                                                    >
                                                        <Check className={cn("w-6 h-6 transition-transform", isCompleted ? "scale-110" : "scale-100")} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 px-1">
                                    <Input
                                        placeholder="Notas de la serie..."
                                        value={logExercise.feedback}
                                        onChange={(e) => {
                                            const newLog = [...sessionLog];
                                            newLog[exIndex].feedback = e.target.value;
                                            setSessionLog(newLog);
                                        }}
                                        className="bg-transparent border-0 border-b border-neutral-800 rounded-none px-0 text-sm text-neutral-300 focus-visible:ring-0 focus-visible:border-neutral-500 placeholder:text-neutral-600 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
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
