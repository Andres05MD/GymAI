"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainingLog } from "@/actions/training-actions";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function WorkoutSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const logId = params.logId as string;

    const { data: logResult, isLoading } = useQuery({
        queryKey: ["training-log-summary", logId],
        queryFn: async () => await getTrainingLog(logId),
    });

    if (isLoading) return <div className="p-6">Cargando resumen...</div>;
    if (!logResult?.success || !logResult.log) return <div className="p-6">No se encontró la sesión.</div>;

    const log = logResult.log as any;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{log.routineName}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Badge variant="outline">{log.dayName}</Badge>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {log.endTime ? format(log.endTime, "PPP p", { locale: es }) : "Sin fecha"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {log.exercises.map((exercise: any, idx: number) => (
                    <Card key={idx}>
                        <CardHeader className="bg-muted/30 py-3">
                            <CardTitle className="text-lg font-medium">{exercise.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground p-3 border-b bg-muted/10">
                                <div className="col-span-2 text-center">Set</div>
                                <div className="col-span-3 text-center">Kg</div>
                                <div className="col-span-3 text-center">Reps</div>
                                <div className="col-span-2 text-center">RPE</div>
                                <div className="col-span-2 text-center">Estado</div>
                            </div>
                            {exercise.sets.map((set: any, setIdx: number) => (
                                <div key={setIdx} className="grid grid-cols-12 gap-2 items-center p-3 border-b last:border-0">
                                    <div className="col-span-2 text-center">
                                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 rounded-full">
                                            {setIdx + 1}
                                        </Badge>
                                    </div>
                                    <div className="col-span-3 text-center font-mono">
                                        {set.actualWeight || "-"}
                                    </div>
                                    <div className="col-span-3 text-center font-mono">
                                        {set.actualReps || "-"}
                                    </div>
                                    <div className="col-span-2 text-center font-mono">
                                        {set.actualRPE || "-"}
                                    </div>
                                    <div className="col-span-2 text-center">
                                        {set.completed ? (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Hecho</Badge>
                                        ) : (
                                            <Badge variant="destructive">Skip</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
