"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clock, Trophy, Info, Loader2, Play, Dumbbell, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logWorkoutSession, getLastSessionExerciseData, WorkoutSessionData } from "@/actions/training-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AIAssistantDialog } from "@/components/training/ai-assistant-dialog";
import { ProgressionTip } from "@/components/training/progression-tip";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { SessionFeedbackDialog } from "@/components/training/session-feedback-dialog";

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
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    // Form state structure matching schema
    // We map the active day exercises to a local state for logging
    const [sessionLog, setSessionLog] = useState<SessionExercise[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const { saveLogLocally } = useOfflineSync();

    const activeDay = routine.schedule[0]; // TODO: Logic to select day if multiple are available
    // Estado para guardar el historial de la última sesión
    const [historySets, setHistorySets] = useState<any[]>([]);

    // Translate/Clean names for UI

    // Translate/Clean names for UI
    const cleanRoutineName = routine.name.replace(/\(assigned\)/i, '').trim();
    const cleanDayName = activeDay
        ? new Date().toLocaleDateString('es-ES', { weekday: 'long' })
        : "";

    // 1. Initialize State (Load from Storage or Create New)
    useEffect(() => {
        if (!activeDay) return;

        const storageKey = `gymia_session_${routine.id}_${activeDay.name}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Validate if stored data matches current routine structure length roughly
                if (data.sessionLog && data.sessionLog.length === activeDay.exercises.length) {
                    setSessionLog(data.sessionLog);
                    setElapsedTime(data.elapsedTime || 0);
                    setIsStarted(data.isStarted || false);
                    setCurrentExerciseIndex(data.currentExerciseIndex || 0);
                    // Optional: Resume timer if started? The other effect covers it.
                    return;
                }
            } catch (e) {
                console.error("Error loading session:", e);
                localStorage.removeItem(storageKey);
            }
        }

        // Default Initialization
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
    }, [activeDay, routine.id]);

    // 2. Persistence Effect (Save on Change)
    useEffect(() => {
        if (!activeDay || sessionLog.length === 0) return;

        const storageKey = `gymia_session_${routine.id}_${activeDay.name}`;
        const state = {
            sessionLog,
            elapsedTime,
            isStarted,
            currentExerciseIndex,
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [sessionLog, elapsedTime, isStarted, currentExerciseIndex, routine.id, activeDay]);

    // 3. Effect: Load history for current exercise when index changes
    useEffect(() => {
        const currentEx = activeDay?.exercises[currentExerciseIndex];
        if (currentEx?.exerciseId && currentEx.exerciseId !== "temp-id") {
            getLastSessionExerciseData(currentEx.exerciseId)
                .then(res => {
                    if (res.success && res.sets) {
                        setHistorySets(res.sets);
                    } else {
                        setHistorySets([]);
                    }
                })
                .catch(() => setHistorySets([]));
        } else {
            setHistorySets([]);
        }
    }, [currentExerciseIndex, activeDay]);

    useEffect(() => {
        if (!isStarted) return;
        const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [isStarted]);

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

    const handleFinishClick = () => {
        setShowFeedback(true);
    };

    const handleCompleteSession = async (sessionRpe: number, sessionNotes: string) => {
        setIsSubmitting(true);

        // Transform data to fit Schema
        const logData = {
            routineId: routine.id,
            dayId: activeDay.id || activeDay.name, // Fallback if no specific ID
            durationMinutes: Math.round(elapsedTime / 60),
            sessionRpe,
            sessionNotes,
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

        try {
            const res = await logWorkoutSession(logData);
            if (res.success) {
                toast.success("¡Entrenamiento guardado!", {
                    description: "Gran trabajo. Sigue así."
                });
                // Clear storage on success
                localStorage.removeItem(`gymia_session_${routine.id}_${activeDay.name}`);
                router.push("/dashboard");
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            console.error("Error al guardar", error);
            const saved = saveLogLocally(logData as WorkoutSessionData);
            if (saved) {
                toast.warning("Guardado localmente (Offline)", {
                    description: "Se sincronizará automáticamente cuando recuperes la conexión."
                });
                // Clear storage as it is now in offline queue
                localStorage.removeItem(`gymia_session_${routine.id}_${activeDay.name}`);
                router.push("/dashboard");
            } else {
                toast.error("Error crítico: No se pudo guardar el entrenamiento.");
            }
        } finally {
            setIsSubmitting(false);
            setShowFeedback(false);
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < activeDay.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            handleFinishClick();
        }
    };

    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!activeDay) return <div className="p-10 text-center">No hay día activo seleccionado.</div>;

    if (!isStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 space-y-8 pb-24 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        {cleanRoutineName}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-red-500 uppercase tracking-widest">
                        {cleanDayName}
                    </p>
                </div>

                <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">
                        <Dumbbell className="w-4 h-4" />
                        Resumen de la Sesión
                    </div>
                    <div className="space-y-3">
                        {activeDay.exercises.map((ex, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="bg-neutral-800 text-neutral-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <span className="text-neutral-300 font-medium text-sm leading-tight">
                                    {ex.exerciseName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md pt-4">
                    <Button
                        onClick={() => setIsStarted(true)}
                        className="w-full h-16 text-xl font-black italic bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Play className="w-6 h-6 mr-2 fill-black" />
                        INICIAR
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="w-full mt-4 text-neutral-500 hover:text-white cursor-pointer"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    // Get current exercise data
    const currentExercise = activeDay.exercises[currentExerciseIndex];
    const currentLogExercise = sessionLog[currentExerciseIndex];

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-6">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-3xl md:mx-0 shadow-2xl shadow-black/50">
                <div className="flex justify-between items-center max-w-3xl mx-auto gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                            Ej. {currentExerciseIndex + 1}/{activeDay.exercises.length}
                        </h2>
                        <div className="flex items-center text-red-500 font-mono text-xs sm:text-sm font-bold tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md w-fit mt-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                    <div className="flex gap-2 items-center shrink-0">
                        <AIAssistantDialog
                            muscleGroups={[currentExercise?.exerciseName || "General"]}
                            availableExercises={[currentExercise?.exerciseName]}
                        />
                        <Button
                            onClick={handleFinishClick}
                            disabled={isSubmitting}
                            variant="ghost"
                            className="hidden lg:flex rounded-full text-white font-bold hover:bg-neutral-800"
                        >
                            Terminar
                        </Button>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                    <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${((currentExerciseIndex + 1) / activeDay.exercises.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current Exercise Card */}
            <div className="space-y-6 min-h-[50vh]">
                {currentExercise && currentLogExercise && (
                    <div className="bg-neutral-900 rounded-4xl border border-neutral-800 overflow-hidden shadow-xl animate-in slide-in-from-right-8 duration-300 key={currentExerciseIndex}">
                        <div className="bg-neutral-900 border-b border-neutral-800/50 p-5 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-white">{currentExercise.exerciseName}</h3>
                                {currentExercise.notes && (
                                    <div className="text-neutral-500 hover:text-white transition-colors cursor-help" title={currentExercise.notes}>
                                        <Info className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <ProgressionTip exerciseId={currentExercise.exerciseId || ""} />
                            {currentExercise.notes && <p className="text-sm text-neutral-400 line-clamp-2">{currentExercise.notes}</p>}
                        </div>

                        <div className="p-2 md:p-4">
                            <div className="grid grid-cols-12 gap-1 md:gap-2 mb-3 px-2 text-[10px] md:text-xs font-bold text-neutral-500 text-center uppercase tracking-widest bg-neutral-900/50 py-2 rounded-lg">
                                <div className="hidden md:block md:col-span-1">#</div>
                                <div className="col-span-2 md:col-span-3">Meta</div>
                                <div className="col-span-3 md:col-span-2">Kg</div>
                                <div className="col-span-3 md:col-span-2">Reps</div>
                                <div className="col-span-2">RPE</div>
                                <div className="col-span-2 md:col-span-2">Ok</div>
                            </div>

                            <div className="space-y-3">
                                {currentExercise.sets.map((set: RoutineSet, setIndex: number) => {
                                    const logSet = currentLogExercise.sets[setIndex];
                                    const isCompleted = logSet?.completed;
                                    // Buscar set correspondiente en el historial (asumimos orden secuencial por index)
                                    // Si hay más sets en historial que en rutina actual, se mostrarán hasta donde coincidan
                                    const historySet = historySets[setIndex];

                                    return (
                                        <div
                                            key={setIndex}
                                            className={cn(
                                                "grid grid-cols-12 gap-1 md:gap-2 p-1.5 md:p-2 rounded-xl items-center transition-all duration-300 relative overflow-hidden group",
                                                isCompleted
                                                    ? "bg-green-500/10 border border-green-500/20 shadow-[0_0_20px_-10px_rgba(34,197,94,0.3)]"
                                                    : "bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
                                            )}
                                        >
                                            {/* Background decoration for completed */}
                                            {isCompleted && <div className="absolute inset-0 bg-linear-to-r from-green-500/5 to-transparent pointer-events-none" />}

                                            <div className="hidden md:flex md:col-span-1 justify-center z-10">
                                                <span className={cn(
                                                    "text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border",
                                                    set.type === 'warmup' ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                                                        set.type === 'failure' ? "text-red-500 bg-red-500/10 border-red-500/20" :
                                                            "text-neutral-400 bg-neutral-800 border-neutral-700"
                                                )}>
                                                    {setIndex + 1}
                                                </span>
                                            </div>
                                            <div className="col-span-2 md:col-span-3 text-center z-10">
                                                <div className="text-white font-bold text-sm md:text-base">{set.reps}</div>
                                                {set.rpeTarget && <div className="text-[10px] text-neutral-500 font-mono">RPE {set.rpeTarget}</div>}
                                            </div>
                                            <div className="col-span-3 md:col-span-2 relative z-10">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    placeholder={historySet ? `${historySet.weight}` : "-"}
                                                    value={logSet?.weight}
                                                    onChange={(e) => updateSet(currentExerciseIndex, setIndex, "weight", e.target.value)}
                                                    className={cn(
                                                        "h-12 md:h-14 px-0 text-center text-lg md:text-xl font-black border-0 bg-neutral-800 rounded-xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                        isCompleted && "text-green-400 bg-green-900/20 ring-1 ring-green-500/30"
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-3 md:col-span-2 relative z-10">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    placeholder={historySet ? `${historySet.reps}` : "-"}
                                                    value={logSet?.reps}
                                                    onChange={(e) => updateSet(currentExerciseIndex, setIndex, "reps", e.target.value)}
                                                    className={cn(
                                                        "h-12 md:h-14 px-0 text-center text-lg md:text-xl font-black border-0 bg-neutral-800 rounded-xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-neutral-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                        isCompleted && "text-green-400 bg-green-900/20 ring-1 ring-green-500/30"
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-2 relative z-10">
                                                <Select
                                                    value={logSet?.rpe?.toString() || ""}
                                                    onValueChange={(val) => updateSet(currentExerciseIndex, setIndex, "rpe", val)}
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            "h-12 md:h-14 w-full px-0 justify-center text-center text-lg md:text-xl font-black border-0 bg-neutral-800 rounded-xl focus:ring-2 focus:ring-white/20 transition-all text-white [&>svg]:hidden", // Hide chevron for clean look like input
                                                            isCompleted && "text-green-400 bg-green-900/20 ring-1 ring-green-500/30"
                                                        )}
                                                    >
                                                        <SelectValue placeholder={historySet ? `${historySet.rpe}` : "-"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white min-w-[60px]">
                                                        {[10, 9, 8, 7, 6, 5].map((val) => (
                                                            <SelectItem
                                                                key={val}
                                                                value={val.toString()}
                                                                className="justify-center focus:bg-neutral-800 focus:text-white"
                                                            >
                                                                {val}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2 md:col-span-2 flex justify-center z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleSetComplete(currentExerciseIndex, setIndex)}
                                                    className={cn(
                                                        "h-12 w-12 md:h-14 md:w-14 rounded-xl transition-all duration-300",
                                                        isCompleted
                                                            ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105"
                                                            : "bg-neutral-800 text-neutral-600 hover:bg-neutral-700 hover:text-white"
                                                    )}
                                                >
                                                    <Check className={cn("w-6 h-6 md:w-7 md:h-7 transition-transform", isCompleted ? "scale-110" : "scale-100")} />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 px-2">
                                <Input
                                    placeholder="Notas de la serie (opcional)..."
                                    value={currentLogExercise.feedback}
                                    onChange={(e) => {
                                        const newLog = [...sessionLog];
                                        newLog[currentExerciseIndex].feedback = e.target.value;
                                        setSessionLog(newLog);
                                    }}
                                    className="bg-transparent border-0 border-b border-neutral-800 rounded-none px-0 text-sm text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-500 placeholder:text-neutral-700 transition-colors py-2"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-between items-center gap-4 z-60 animate-in slide-in-from-bottom-full duration-500">
                <Button
                    onClick={handlePrevExercise}
                    disabled={currentExerciseIndex === 0}
                    className="h-14 w-20 rounded-2xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 shadow-lg"
                >
                    <ChevronLeft className="w-8 h-8" />
                </Button>

                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-[0.2em]">Ejercicio</span>
                    <span className="text-xl font-black text-white tracking-widest leading-none">
                        <span className="text-red-500">{currentExerciseIndex + 1}</span> / {activeDay.exercises.length}
                    </span>
                </div>

                <Button
                    onClick={handleNextExercise}
                    className={cn(
                        "h-14 w-24 rounded-2xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95",
                        currentExerciseIndex === activeDay.exercises.length - 1
                            ? "bg-red-600 text-white hover:bg-red-500 shadow-red-900/30"
                            : "bg-white text-black hover:bg-neutral-200 shadow-white/10"
                    )}
                >
                    {currentExerciseIndex === activeDay.exercises.length - 1 ? (
                        <Trophy className="w-6 h-6" />
                    ) : (
                        <ChevronRight className="w-8 h-8" />
                    )}
                </Button>
            </div>


            <SessionFeedbackDialog
                open={showFeedback}
                onOpenChange={setShowFeedback}
                onConfirm={handleCompleteSession}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
