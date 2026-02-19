"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { getAthleteAssignments, getRecordedWorkoutDays } from "@/actions/schedule-actions";
import { startOfMonth, endOfMonth, format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Dumbbell, CheckCircle2, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Capitaliza la primera letra de cada palabra o de la cadena
 */
const capitalize = (str: string) => {
    if (!str) return str;
    return str
        .split(" ")
        .map((word) => (word.toLowerCase() === "de" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(" ");
};

interface Assignment {
    id: string;
    routineName: string;
    dayName: string;
    date: string; // YYYY-MM-DD
    completed?: boolean;
}

export function ScheduleCalendar({ athleteId, activeRoutine }: { athleteId: string, activeRoutine?: any }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [recordedDays, setRecordedDays] = useState<Date[]>([]);
    const [month, setMonth] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssignments = async () => {
            setLoading(true);
            const start = format(startOfMonth(month), "yyyy-MM-dd");
            const end = format(endOfMonth(month), "yyyy-MM-dd");

            const [assignmentRes, recordedRes] = await Promise.all([
                getAthleteAssignments(athleteId, start, end),
                getRecordedWorkoutDays(athleteId, start, end)
            ]);

            if (assignmentRes.success) {
                const rawAssignments = assignmentRes.assignments as Assignment[];
                const uniqueAssignments = Array.from(new Map(rawAssignments.map(a => [a.id, a])).values());
                setAssignments(uniqueAssignments);
            }

            if (recordedRes?.success && recordedRes.recordedDates) {
                setRecordedDays(recordedRes.recordedDates.map((d: string) => parseISO(d)));
            }

            setLoading(false);
        };

        fetchAssignments();
    }, [athleteId, month]);

    const assignedDays = assignments.map(a => parseISO(a.date));

    // Determinar días de entrenamiento y descanso basados en la rutina activa
    const getDayInfo = (day: Date) => {
        if (!activeRoutine || !activeRoutine.schedule || activeRoutine.schedule.length !== 7) return null;

        const startDate = activeRoutine.startDate ? (typeof activeRoutine.startDate === 'string' ? parseISO(activeRoutine.startDate) : activeRoutine.startDate) : null;
        if (startDate && day < startDate) return null;

        // Mapear getDay (0=Dom, 1=Lun...) a nuestro índice (0=Lun, 6=Dom)
        const routineIdx = (day.getDay() + 6) % 7;
        return activeRoutine.schedule[routineIdx];
    };

    const selectedDayAssignments = date
        ? assignments.filter(a => isSameDay(parseISO(a.date), date))
        : [];

    const selectedDayInfo = date ? getDayInfo(date) : null;
    const selectedDayWeekDay = date?.getDay();
    const isWeekend = selectedDayWeekDay === 0 || selectedDayWeekDay === 6;
    const isRestDay = selectedDayInfo ? selectedDayInfo.isRest : (isWeekend && selectedDayAssignments.length === 0);

    const isRecordedDay = date
        ? recordedDays.some(rd => isSameDay(rd, date))
        : false;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-3 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-3xl">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-red-500" />
                        Calendario
                    </h3>
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
                </div>
                <div className="bg-neutral-950/50 rounded-2xl p-0.5 sm:p-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={month}
                        onMonthChange={setMonth}
                        modifiers={{
                            assigned: assignedDays,
                            recorded: recordedDays,
                            training: (day) => getDayInfo(day)?.isRest === false,
                            rest: (day) => {
                                const info = getDayInfo(day);
                                if (info) return info.isRest === true;
                                const dow = day.getDay();
                                return dow === 0 || dow === 6;
                            }
                        }}
                        modifiersClassNames={{
                            assigned: "bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20",
                            recorded: "bg-green-500/20 text-green-500 font-black hover:bg-green-500/30 border border-green-500/30 scale-105 z-10",
                            training: "after:content-[''] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-red-500 after:rounded-full",
                            rest: "opacity-40 grayscale-[0.5]"
                        }}
                        locale={es}
                        className="w-full"
                        classNames={{
                            month_caption: "flex justify-center pt-1 relative items-center capitalize",
                            month_grid: "w-full border-collapse",
                            weekday: "text-neutral-500 rounded-md w-full font-normal text-[0.7rem] text-center capitalize",
                            day: "h-9 sm:h-12 w-full text-center text-sm p-0 m-0 relative flex items-center justify-center",
                            day_button: "h-8 w-8 sm:h-10 sm:w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-800 rounded-xl transition-all flex items-center justify-center",
                            selected: "bg-white !text-black hover:bg-neutral-200 hover:!text-black shadow-lg",
                            today: "bg-red-500/10 text-red-500 border border-red-500/20 font-bold",
                        }}
                    />
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white first-letter:uppercase">
                        {date ? capitalize(format(date, "EEEE d 'de' MMMM", { locale: es })) : "Selecciona un día"}
                    </h3>
                    {isRecordedDay && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-black font-black uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-md">
                            Completado
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-neutral-500 mb-6">
                    {isRecordedDay
                        ? "Entrenamiento registrado correctamente"
                        : isRestDay
                            ? "Día de descanso programado"
                            : selectedDayAssignments.length > 0
                                ? `${selectedDayAssignments.length} sesiones asignadas`
                                : "Sin asignaciones"}
                </p>

                <div className="space-y-3 overflow-y-auto max-h-[400px] md:max-h-[500px] pr-2">
                    {isRestDay && !isRecordedDay ? (
                        <div className="p-8 text-center bg-neutral-950/40 border border-neutral-800 border-dashed rounded-3xl flex flex-col items-center gap-3">
                            <div className="h-12 w-12 bg-neutral-900 rounded-full flex items-center justify-center">
                                <Moon className="h-6 w-6 text-neutral-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Recuperación</h4>
                                <p className="text-xs text-neutral-500 mt-1">No hay entrenamientos previstos para hoy.</p>
                            </div>
                        </div>
                    ) : selectedDayAssignments.length > 0 ? (
                        selectedDayAssignments.map((assignment) => (
                            <div key={assignment.id} className={cn(
                                "p-4 border rounded-2xl transition-all group",
                                isRecordedDay ? "bg-green-500/10 border-green-500/20" : "bg-neutral-950/80 border-neutral-800 hover:border-red-500/30"
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider",
                                        isRecordedDay ? "border-green-500/20 text-green-500 bg-green-500/10" : "border-red-500/20 text-red-500 bg-red-500/10"
                                    )}>
                                        {isRecordedDay ? "Realizado" : "Asignado"}
                                    </Badge>
                                </div>
                                <h4 className={cn(
                                    "font-bold transition-colors",
                                    isRecordedDay ? "text-white" : "text-white group-hover:text-red-500"
                                )}>
                                    {assignment.routineName}
                                </h4>
                                <p className="text-sm text-neutral-400 mt-1 first-letter:uppercase">
                                    {assignment.dayName}
                                </p>
                            </div>
                        ))
                    ) : isRecordedDay ? (
                        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center gap-2 text-center">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <h4 className="font-bold text-white">Sesión Extra</h4>
                            <p className="text-xs text-neutral-500">Registraste un entrenamiento fuera de lo asignado.</p>
                        </div>
                    ) : (
                        <div className="text-center py-10 border border-dashed border-neutral-800 rounded-2xl">
                            <p className="text-neutral-600 text-sm">No hay rutinas para este día</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
