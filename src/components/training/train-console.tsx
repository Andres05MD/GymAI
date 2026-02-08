"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronLeft, ChevronRight, Clock, Dumbbell, Loader2, RotateCcw } from "lucide-react";
import { logSet, finishWorkoutSession } from "@/actions/training-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WarmupGenerator } from "@/components/training/warmup-generator";
import { AICoachChat } from "@/components/training/ai-coach-chat";
import { ExerciseSwapDialog } from "@/components/training/exercise-swap-dialog";

interface ConsoleExercise {
    id?: string;
    name: string;
    sets?: number | any[];
    reps?: string | number;
    rpe?: number;
    rest?: number;
    notes?: string;
}

interface ConsoleRoutine {
    name: string;
    exercises?: ConsoleExercise[];
}

interface TrainConsoleProps {
    routine: ConsoleRoutine;
}

export function TrainConsole({ routine }: TrainConsoleProps) {
    const router = useRouter();
    const [sessionId, setSessionId] = useState("");
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(90);
    const [completedSets, setCompletedSets] = useState<Record<string, number[]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);

    // Inputs
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState("");

    // Estado local de ejercicios para permitir Swaps
    const [exercisesList, setExercisesList] = useState(routine.exercises || []);

    // Si la rutina cambia externamente (raro en sesión), sincronizar? Por ahora no para no sobrescribir swaps.

    const currentExercise = exercisesList[currentExerciseIndex];

    // Adaptar estructura si viene plana o compleja
    const totalSets = currentExercise?.sets || 3;
    const setsArray = Array.isArray(totalSets) ? totalSets : Array.from({ length: totalSets });

    const currentSet = Array.isArray(totalSets) ? totalSets[currentSetIndex] : { reps: "10-12", rpe: 8 };

    const totalExercises = exercisesList.length;

    useEffect(() => {
        setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        const timer = setInterval(() => setSessionDuration(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSwap = (newName: string) => {
        const updated = [...exercisesList];
        updated[currentExerciseIndex] = { ...updated[currentExerciseIndex], name: newName };
        setExercisesList(updated);
        toast.success(`Ejercicio cambiado a: ${newName}`);
    };

    const handleCompleteSet = async () => {
        if (!weight || !reps) {
            toast.error("Ingresa peso y repeticiones");
            return;
        }

        setIsSaving(true);
        try {
            const result = await logSet({
                exerciseId: currentExercise.id || currentExercise.name, // Fallback ID
                exerciseName: currentExercise.name,
                weight: Number(weight),
                reps: Number(reps),
                rpe: Number(rpe) || 0,
                sessionId: sessionId,
                timestamp: Date.now()
            });

            if (!result.success) throw new Error(result.error);
            toast.success("Set registrado");

            // Update local state
            const exId = currentExercise.id || currentExercise.name;
            setCompletedSets(prev => ({
                ...prev,
                [exId]: [...(prev[exId] || []), currentSetIndex]
            }));

            // Clear inputs
            setWeight("");
            setReps("");
            setRpe("");

            // Advance
            if (currentSetIndex < setsArray.length - 1) {
                setCurrentSetIndex(currentSetIndex + 1);
                setIsResting(true);
                // Set default rest based on exercise if available
                setRestTime(currentExercise.rest || 90);
            } else if (currentExerciseIndex < totalExercises - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSetIndex(0);
                setIsResting(true);
                setRestTime(currentExercise.rest || 90);
            } else {
                await handleFinishSession();
            }

        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinishSession = async () => {
        if (!window.confirm("¿Terminar entrenamiento?")) return;
        setIsSaving(true);
        try {
            await finishWorkoutSession(sessionId, sessionDuration, 0, 0); // TODO: Calc volume real
            toast.success("¡Entrenamiento completado!");
            router.push("/history");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (exercisesList.length === 0) {
        return <div className="text-center p-10 text-white">La rutina no tiene ejercicios asignados.</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Entrenando</h1>
                    <p className="text-sm text-muted-foreground">{routine.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(sessionDuration)}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentExerciseIndex * 100) / totalExercises)}%` }}
                />
            </div>

            <WarmupGenerator />

            {/* Exercise Card */}
            <Card className="glass-card border-primary/20 overflow-hidden">
                <CardHeader className="bg-primary/10 border-b border-primary/20 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs text-primary font-bold uppercase tracking-wider">
                                    Ejercicio {currentExerciseIndex + 1} de {totalExercises}
                                </p>
                                <ExerciseSwapDialog
                                    currentExerciseName={currentExercise.name}
                                    onSwap={handleSwap}
                                />
                            </div>
                            <CardTitle className="text-2xl font-black text-white leading-tight">{currentExercise.name}</CardTitle>
                        </div>
                        <div className="h-14 w-14 bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {currentExercise.notes && (
                        <div className="text-xs bg-yellow-500/10 text-yellow-500 p-2 rounded border border-yellow-500/20">
                            💡 {currentExercise.notes}
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl">
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Serie Actual</p>
                            <p className="text-3xl font-black text-white">
                                {currentSetIndex + 1} <span className="text-zinc-600 text-lg">/ {setsArray.length}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Objetivo</p>
                            <p className="text-xl font-bold text-white">
                                {currentSet?.reps || currentExercise.reps || "10"} reps
                            </p>
                            {(currentSet?.rpe || currentExercise.rpe) && (
                                <p className="text-sm text-primary">RPE {currentSet?.rpe || currentExercise.rpe}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Peso (kg)</label>
                            <Input
                                type="number" inputMode="decimal"
                                value={weight} onChange={(e) => setWeight(e.target.value)}
                                placeholder="0" disabled={isSaving}
                                className="bg-zinc-900 border-zinc-700 text-white text-center text-2xl font-bold h-14"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Reps</label>
                            <Input
                                type="number" inputMode="numeric"
                                value={reps} onChange={(e) => setReps(e.target.value)}
                                placeholder="0" disabled={isSaving}
                                className="bg-zinc-900 border-zinc-700 text-white text-center text-2xl font-bold h-14"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">RPE</label>
                            <Input
                                type="number" inputMode="numeric"
                                value={rpe} onChange={(e) => setRpe(e.target.value)}
                                placeholder="-" min={1} max={10} disabled={isSaving}
                                className="bg-zinc-900 border-zinc-700 text-white text-center text-2xl font-bold h-14"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleCompleteSet}
                        disabled={isSaving}
                        className="w-full h-16 text-lg font-black uppercase tracking-wider bg-primary text-black hover:bg-primary/90"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                        {isSaving ? "Guardando..." : "Completar Serie"}
                    </Button>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    disabled={currentExerciseIndex === 0}
                    onClick={() => {
                        setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
                        setCurrentSetIndex(0);
                    }}
                >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>

                <Button variant="ghost" onClick={handleFinishSession} className="text-red-500 hover:text-red-400">
                    Terminar
                </Button>

                <Button
                    variant="ghost"
                    disabled={currentExerciseIndex === totalExercises - 1}
                    onClick={() => {
                        setCurrentExerciseIndex(Math.min(totalExercises - 1, currentExerciseIndex + 1));
                        setCurrentSetIndex(0);
                    }}
                >
                    Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>

            {isResting && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="glass-card border-white/10 w-full max-w-sm mx-4">
                        <CardContent className="p-8 text-center">
                            <p className="text-xs text-primary uppercase tracking-wider mb-2">Tiempo de Descanso</p>
                            <p className="text-6xl font-black text-white mb-6 tabular-nums">{restTime}s</p>
                            <Button onClick={() => setIsResting(false)} className="w-full bg-white text-black hover:bg-zinc-200">
                                Saltar Descanso
                            </Button>
                            <Button variant="ghost" onClick={() => setRestTime(p => p + 30)} className="mt-4 w-full text-zinc-400">
                                +30 segundos
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <AICoachChat context={currentExercise?.name} />
        </div>
    );
}
