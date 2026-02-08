"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getTrainingLog, completeWorkout } from "@/actions/training-actions";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Timer, ChevronLeft, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interfaces para el workout
interface WorkoutSet {
    reps?: string | number;
    rpeTarget?: number;
    actualWeight?: number;
    actualReps?: string | number;
    actualRPE?: number;
    completed?: boolean;
}

interface WorkoutExercise {
    exerciseId: string;
    name: string;
    sets: WorkoutSet[];
}

interface WorkoutData {
    routineName: string;
    dayName: string;
    exercises: WorkoutExercise[];
}

export default function LiveWorkoutPage() {
    const params = useParams();
    const router = useRouter();
    const logId = params.logId as string;

    const { data: logResult, isLoading } = useQuery({
        queryKey: ["training-log", logId],
        queryFn: async () => await getTrainingLog(logId),
        refetchOnWindowFocus: false, // Evitar recargas accidentales
    });

    const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);

    useEffect(() => {
        if (logResult?.success && logResult.log) {
            // Inicializamos estado local si no existe, o actualizamos si es la primera carga
            if (!workoutData) {
                setWorkoutData(JSON.parse(JSON.stringify(logResult.log)));
            }
        }
    }, [logResult, workoutData]);

    const completeMutation = useMutation({
        mutationFn: async () => await completeWorkout(logId),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("¡Entrenamiento finalizado!");
                router.push("/athlete");
            } else {
                toast.error("Error al finalizar");
            }
        }
    });

    if (isLoading || !workoutData) return <div className="p-6">Cargando sesión...</div>;

    const handleSetChange = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string | number | boolean) => {
        const newData = { ...workoutData };
        (newData.exercises[exerciseIndex].sets[setIndex] as unknown as Record<string, unknown>)[field] = value;
        setWorkoutData(newData);
    };

    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const current = workoutData.exercises[exerciseIndex].sets[setIndex].completed;
        handleSetChange(exerciseIndex, setIndex, "completed", !current);
    };

    return (
        <div className="pb-20 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
                    <ChevronLeft className="mr-1 h-5 w-5" /> Salir
                </Button>
                <div className="text-right">
                    <h2 className="text-sm font-semibold">{workoutData.routineName}</h2>
                    <p className="text-xs text-muted-foreground">{workoutData.dayName}</p>
                </div>
            </div>

            <div className="space-y-6">
                {workoutData.exercises.map((exercise: WorkoutExercise, exIdx: number) => (
                    <Card key={exercise.exerciseId + exIdx} className="overflow-hidden border-white/5 bg-black/40">
                        <CardHeader className="bg-white/5 py-3 border-b border-white/5">
                            <CardTitle className="text-lg font-medium">{exercise.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground p-3 border-b border-white/5 bg-white/5">
                                <div className="col-span-2 text-center">Set</div>
                                <div className="col-span-3 text-center">Kg</div>
                                <div className="col-span-3 text-center">Reps</div>
                                <div className="col-span-2 text-center">RPE</div>
                                <div className="col-span-2 text-center">Listo</div>
                            </div>
                            {exercise.sets.map((set: WorkoutSet, setIdx: number) => (
                                <div
                                    key={setIdx}
                                    className={cn(
                                        "grid grid-cols-12 gap-2 items-center p-3 border-b border-white/5 last:border-0 transition-colors",
                                        set.completed ? "bg-primary/10" : ""
                                    )}
                                >
                                    <div className="col-span-2 text-center">
                                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 rounded-full border-white/20">
                                            {setIdx + 1}
                                        </Badge>
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            className="h-9 text-center bg-black/20 border-white/10"
                                            placeholder="-"
                                            value={set.actualWeight || ""}
                                            onChange={(e) => handleSetChange(exIdx, setIdx, "actualWeight", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            className="h-9 text-center bg-black/20 border-white/10"
                                            placeholder={String(set.reps ?? "")}
                                            value={set.actualReps || ""}
                                            onChange={(e) => handleSetChange(exIdx, setIdx, "actualReps", e.target.value)} // String para rango ej "10-12"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            className="h-9 text-center px-1 bg-black/20 border-white/10"
                                            placeholder={String(set.rpeTarget ?? "")}
                                            value={set.actualRPE || ""}
                                            onChange={(e) => handleSetChange(exIdx, setIdx, "actualRPE", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <Checkbox
                                            checked={set.completed}
                                            onCheckedChange={() => toggleSetComplete(exIdx, setIdx)}
                                            className="h-6 w-6 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-white/10">
                <div className="max-w-2xl mx-auto flex gap-4">
                    <div className="flex-1 flex items-center justify-center gap-2 text-primary font-mono text-lg font-bold bg-secondary/50 rounded-md">
                        <Timer className="h-5 w-5" /> 00:00
                        {/* TODO: Timer real */}
                    </div>
                    <Button
                        size="lg"
                        className="flex-1 font-bold text-md"
                        onClick={() => {
                            if (confirm("¿Finalizar entrenamiento y guardar?")) {
                                completeMutation.mutate();
                            }
                        }}
                        disabled={completeMutation.isPending}
                    >
                        <Save className="mr-2 h-5 w-5" /> Finalizar
                    </Button>
                </div>
            </div>
        </div>
    );
}
