"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Check if badge exists or use generic
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp, Calendar, Clock, Dumbbell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TrainingHistoryListProps {
    logs: any[];
}

function WorkoutLogItem({ log }: { log: any }) {
    const [expanded, setExpanded] = useState(false);

    // Calculate summary stats
    const totalVolume = log.exercises?.reduce((acc: number, ex: any) => {
        return acc + ex.sets.reduce((sAcc: number, s: any) => sAcc + (s.weight * s.reps || 0), 0);
    }, 0) || 0;

    const totalSets = log.exercises?.reduce((acc: number, ex: any) => acc + ex.sets.length, 0) || 0;

    return (
        <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center font-bold">
                        {log.exercises?.length || 0}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm md:text-base">
                            {formatDate(log.date)}
                            {log.routineId && <span className="ml-2 opacity-50 font-normal text-xs">(Rutina)</span>}
                        </h4>
                        <div className="flex gap-3 text-xs text-neutral-500 mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.durationMinutes} min</span>
                            <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {Math.round(totalVolume)} kg vol</span>
                            <span>{totalSets} series</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-neutral-500">
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
            </div>

            {expanded && (
                <div className="border-t border-neutral-800 bg-black/20 p-4 space-y-4 animate-in slide-in-from-top-2">
                    {log.sessionFeedback && (
                        <div className="bg-neutral-900 p-3 rounded-lg text-sm italic text-neutral-400 border border-neutral-800 mb-4">
                            "{log.sessionFeedback}"
                        </div>
                    )}

                    <div className="space-y-4">
                        {log.exercises?.map((ex: any, i: number) => (
                            <div key={i} className="text-sm">
                                <div className="flex justify-between text-white font-medium mb-1">
                                    <span>{ex.exerciseName}</span>
                                </div>
                                <div className="space-y-1">
                                    {ex.sets.map((set: any, j: number) => (
                                        <div key={j} className="flex justify-between text-neutral-500 text-xs pl-2 border-l-2 border-neutral-800">
                                            <span>Set {j + 1}</span>
                                            <div className="font-mono">
                                                {set.weight}kg x {set.reps}
                                                {set.completed && <span className="text-green-500 ml-1">✓</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {ex.feedback && (
                                    <p className="text-xs text-neutral-600 mt-1 ml-2">Nota: {ex.feedback}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}

export function TrainingHistoryList({ logs }: TrainingHistoryListProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-3xl">
                <Dumbbell className="w-10 h-10 mx-auto mb-4 opacity-20" />
                <p>No hay entrenamientos registrados aún.</p>
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
