"use client";

import { useState } from "react";
import { RetroactiveWorkoutLogger } from "./retroactive-workout-logger";
import { cn } from "@/lib/utils";
import { Calendar, Lock, Dumbbell, ChevronRight } from "lucide-react";

// --- Interfaces ---

interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: Array<{ reps?: number | string; rpeTarget?: number }>;
}

interface ScheduleDay {
    id?: string;
    name: string;
    exercises: ScheduleExercise[];
}

interface WeeklyRoutineViewProps {
    schedule: ScheduleDay[];
    routineId?: string;
    routineName?: string;
    routineType?: string; // "daily" | "weekly"
}

// --- Constantes ---

const WEEKDAYS = [
    { name: "Lunes", short: "LUN" },
    { name: "Martes", short: "MAR" },
    { name: "Miércoles", short: "MIÉ" },
    { name: "Jueves", short: "JUE" },
    { name: "Viernes", short: "VIE" },
];

// --- Helpers ---

function cleanName(name?: string): string {
    return (name || "").replace(/\s*\(Assigned\)/gi, "").trim();
}

function getTodayWeekdayIndex(): number {
    const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sáb
    return dayOfWeek - 1; // -1=Dom, 0=Lun, ..., 4=Vie, 5=Sáb
}

function getDateForWeekday(dayIndex: number): string {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const targetDayOfWeek = dayIndex + 1;
    const diff = currentDayOfWeek - targetDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - diff);
    return targetDate.toISOString().split("T")[0];
}

// --- Componente Principal ---

export function WeeklyRoutineView({ schedule, routineId, routineName, routineType }: WeeklyRoutineViewProps) {
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const todayIndex = getTodayWeekdayIndex();

    const displayName = cleanName(routineName);
    const isDaily = routineType === "daily" || schedule.length === 1;

    const isDayAccessible = (dayIndex: number) => {
        if (todayIndex < 0 || todayIndex > 4) return true; // Fin de semana
        return dayIndex <= todayIndex;
    };

    // --- Vista del Logger para el día seleccionado ---
    if (selectedDayIndex !== null) {
        const day = schedule[selectedDayIndex];
        if (!day) {
            setSelectedDayIndex(null);
            return null;
        }

        const defaultDate = getDateForWeekday(selectedDayIndex);
        const loggerName = isDaily
            ? displayName
            : `${displayName} - ${day.name}`;

        return (
            <RetroactiveWorkoutLogger
                routineDay={day}
                routineId={routineId}
                routineName={loggerName}
                defaultDate={defaultDate}
                onBack={() => setSelectedDayIndex(null)}
            />
        );
    }

    // --- Vista Semanal ---
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Semana Actual
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isDaily ? "Rutina Compuesta" : displayName || "Rutina Semanal"}
                </h1>
                <p className="text-sm text-neutral-500">
                    Selecciona un día para registrar tu entrenamiento
                </p>
            </div>

            {/* Lista de Días */}
            <div className="space-y-2.5">
                {WEEKDAYS.map((weekday, index) => {
                    const day = schedule[index];
                    const hasRoutine = !!day;
                    const accessible = isDayAccessible(index) && hasRoutine;
                    const isToday = index === todayIndex;
                    const isFuture = !isDayAccessible(index);

                    return (
                        <button
                            key={index}
                            disabled={!accessible}
                            onClick={() => accessible && setSelectedDayIndex(index)}
                            className={cn(
                                "w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 text-left flex items-center gap-4 group",
                                accessible
                                    ? "bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700 cursor-pointer active:scale-[0.98]"
                                    : "bg-neutral-950/30 border-neutral-900/50 cursor-not-allowed",
                                isToday && accessible && "border-red-500/40 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]"
                            )}
                        >
                            {/* Badge del día */}
                            <div
                                className={cn(
                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors",
                                    isToday && accessible
                                        ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                                        : accessible
                                            ? "bg-neutral-800 text-neutral-300 group-hover:bg-neutral-700"
                                            : "bg-neutral-900/50 text-neutral-700"
                                )}
                            >
                                <span className="text-[10px] sm:text-xs font-black uppercase leading-none tracking-wider">
                                    {weekday.short}
                                </span>
                            </div>

                            {/* Info del día */}
                            <div className="flex-1 min-w-0">
                                {hasRoutine ? (
                                    <>
                                        <p
                                            className={cn(
                                                "font-bold text-base sm:text-lg transition-colors truncate",
                                                accessible ? "text-white" : "text-neutral-700"
                                            )}
                                        >
                                            {isDaily ? displayName : day.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Dumbbell className={cn("w-3 h-3", accessible ? "text-neutral-500" : "text-neutral-800")} />
                                            <span className={cn("text-xs font-medium", accessible ? "text-neutral-500" : "text-neutral-800")}>
                                                {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-base sm:text-lg text-neutral-700 truncate">
                                            Sin asignar
                                        </p>
                                        <p className="text-xs text-neutral-800 mt-0.5">Descanso</p>
                                    </>
                                )}
                            </div>

                            {/* Indicador de estado */}
                            <div className="shrink-0">
                                {!hasRoutine ? null
                                    : isFuture ? (
                                        <Lock className="w-4 h-4 text-neutral-700" />
                                    ) : isToday && accessible ? (
                                        <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                            Hoy
                                        </span>
                                    ) : accessible ? (
                                        <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                                    ) : null}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
