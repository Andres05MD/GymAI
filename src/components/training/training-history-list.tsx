"use client";

import { ChevronDown, ChevronUp, Clock, Dumbbell, Flame, MessageSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- INTERFACES ---

interface TrainingSet {
    weight?: number;
    reps?: number;
    rpe?: number;
    completed?: boolean;
}

interface TrainingExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: TrainingSet[];
    feedback?: string;
}

interface TrainingLog {
    id: string;
    date: string;
    routineId?: string;
    routineName?: string;
    durationMinutes?: number;
    sessionFeedback?: string;
    exercises?: TrainingExercise[];
}

interface TrainingHistoryListProps {
    logs: TrainingLog[];
}

function WorkoutLogItem({ log }: { log: TrainingLog }) {
    const [expanded, setExpanded] = useState(false);

    // Calculate summary stats
    const totalVolume = log.exercises?.reduce((acc: number, ex: TrainingExercise) => {
        return acc + ex.sets.reduce((sAcc: number, s: TrainingSet) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0);
    }, 0) || 0;

    const totalSets = log.exercises?.reduce((acc: number, ex: TrainingExercise) => acc + ex.sets.length, 0) || 0;
    const completedSets = log.exercises?.reduce((acc: number, ex: TrainingExercise) =>
        acc + ex.sets.filter((s: TrainingSet) => s.completed).length, 0) || 0;

    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    return (
        <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-[2rem] overflow-hidden hover:border-neutral-700 transition-all group shadow-sm hover:shadow-md">
            {/* Header - Clickable */}
            <div
                className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors relative"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Date Circle */}
                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-red-600 to-red-900 text-white flex flex-col items-center justify-center shadow-lg shadow-red-900/30 border border-white/10 shrink-0">
                        <span className="text-xl font-black leading-none tracking-tight">
                            {new Date(log.date).getDate()}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest opacity-90 font-bold mt-1">
                            {new Date(log.date).toLocaleDateString('es', { month: 'short' }).slice(0, 3)}
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-white text-lg tracking-tight">
                                {log.routineName || "Sesión de Entrenamiento"}
                            </h4>
                            {log.routineId && (
                                <span className="bg-linear-to-r from-red-500/10 to-transparent text-red-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-red-500/20">
                                    Rutina
                                </span>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-3 text-xs text-neutral-400 font-medium">
                            <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <Dumbbell className="w-3.5 h-3.5 text-neutral-500" />
                                {log.exercises?.length || 0}
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                {Math.round(totalVolume).toLocaleString()} <span className="text-[10px] uppercase text-neutral-600">kg</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {log.durationMinutes || 0} <span className="text-[10px] uppercase text-neutral-600">min</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side - Completion & Expand */}
                <div className="flex items-center gap-4 pl-2">
                    {/* Completion Ring */}
                    <div className="hidden sm:flex flex-col items-end">
                        <div className={cn(
                            "text-xl font-black tabular-nums",
                            completionRate >= 90 ? "text-emerald-500" : completionRate >= 50 ? "text-yellow-500" : "text-red-500"
                        )}>
                            {completionRate}%
                        </div>
                        <span className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">Completado</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-transform active:scale-95"
                    >
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-neutral-800/50 bg-black/20 p-5 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Session Feedback */}
                    {log.sessionFeedback && (
                        <div className="flex gap-3 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                            <MessageSquare className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-neutral-300 italic">&quot;{log.sessionFeedback}&quot;</p>
                        </div>
                    )}

                    {/* Exercises List */}
                    <div className="space-y-4">
                        {log.exercises?.map((ex: TrainingExercise, i: number) => (
                            <div key={i} className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800/50">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <h5 className="font-bold text-white">{ex.exerciseName}</h5>
                                    </div>
                                    <span className="text-xs text-neutral-500">{ex.sets.length} series</span>
                                </div>

                                {/* Sets Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {ex.sets.map((set: TrainingSet, j: number) => (
                                        <div
                                            key={j}
                                            className={cn(
                                                "p-3 rounded-xl text-center border transition-colors",
                                                set.completed
                                                    ? "bg-green-500/5 border-green-500/20"
                                                    : "bg-neutral-800/30 border-neutral-800"
                                            )}
                                        >
                                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">
                                                Set {j + 1}
                                            </p>
                                            <p className={cn(
                                                "font-bold text-sm",
                                                set.completed ? "text-white" : "text-neutral-400"
                                            )}>
                                                {set.weight}<span className="text-neutral-500 text-xs">kg</span> × {set.reps}
                                            </p>
                                            {set.completed && (
                                                <span className="text-green-500 text-xs">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {ex.feedback && (
                                    <p className="text-xs text-neutral-500 mt-3 pl-2 border-l-2 border-neutral-700 italic">
                                        {ex.feedback}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function TrainingHistoryList({ logs }: TrainingHistoryListProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800">
                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <Dumbbell className="w-10 h-10 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin entrenamientos</h3>
                <p className="text-neutral-500 max-w-md">
                    Aún no hay sesiones de entrenamiento registradas. ¡Comienza tu primer workout!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <WorkoutLogItem key={log.id} log={log} />
            ))}
        </div>
    );
}
