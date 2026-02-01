"use client";

import { useQuery } from "@tanstack/react-query";
import { getAthleteHistory } from "@/actions/training-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Dumbbell } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EmptyState } from "@/components/ui/empty-state";

export default function HistoryPage() {
    const { data: historyResult, isLoading } = useQuery({
        queryKey: ["athlete-history"],
        queryFn: async () => await getAthleteHistory(),
    });

    const history = historyResult?.history || [];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
                <p className="text-muted-foreground">Tus sesiones de entrenamiento pasadas.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimas Sesiones</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Cargando historial...</div>
                    ) : history.length === 0 ? (
                        <EmptyState
                            icon={Dumbbell}
                            title="No hay historial"
                            description="Completa tu primer entrenamiento para ver tu progreso aquí."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Rutina</TableHead>
                                    <TableHead>Día</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {log.endTime ? format(log.endTime, "PPP", { locale: es }) : "Sin fecha"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                                {log.routineName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{log.dayName}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/workout/summary/${log.id}`}>
                                                    Ver Detalles <ChevronRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
