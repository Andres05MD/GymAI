"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getAthleteRoutines, startWorkout } from "@/actions/training-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function AthleteDashboard() {
    const router = useRouter();

    const { data: routinesResult, isLoading } = useQuery({
        queryKey: ["athlete-routines"],
        queryFn: async () => await getAthleteRoutines(),
    });

    const startMutation = useMutation({
        mutationFn: startWorkout,
        onSuccess: (result) => {
            if (result.success && result.workoutId) {
                toast.success("¡Entrenamiento iniciado!");
                router.push(`/workout/live/${result.workoutId}`);
            } else {
                toast.error(result.error);
            }
        },
        onError: () => toast.error("Error al iniciar sesión")
    });

    const routines = routinesResult?.routines || [];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Hola, Atleta</h1>
                <p className="text-muted-foreground">¿Listo para entrenar hoy?</p>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Tus Rutinas</h3>
                {isLoading ? (
                    <div>Cargando planes...</div>
                ) : routines.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="Sin Rutinas Asignadas"
                        description="Tu entrenador aún no ha creado un plan para ti. ¡Pídele que te asigne uno!"
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {routines.map((routine: any) => (
                            <Card key={routine.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 p-4">
                                    <Play className="h-12 w-12 text-primary/10" />
                                </div>
                                <CardHeader>
                                    <CardTitle>{routine.name}</CardTitle>
                                    <CardDescription>{routine.description || "Plan de entrenamiento"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mb-2">
                                        <Badge variant="secondary">
                                            {(routine.schedule?.length || 0) + " Días"}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        onClick={() => startMutation.mutate(routine.id)}
                                        disabled={startMutation.isPending}
                                    >
                                        {startMutation.isPending ? "Iniciando..." :
                                            <><Play className="mr-2 h-4 w-4" /> Iniciar Entrenamiento</>
                                        }
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
