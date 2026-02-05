import { auth } from "@/lib/auth";
import { getRoutines } from "@/actions/routine-actions";
import { getCoachAthletes } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RoutineCard } from "@/components/routines/routine-card";

export default async function RoutinesPage() {
    const session = await auth();

    // Verificación de autenticación
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "coach") redirect("/dashboard");

    // Cargar datos en paralelo desde el servidor (más rápido que useEffect)
    const [routinesRes, athletesRes] = await Promise.all([
        getRoutines(),
        getCoachAthletes()
    ]);

    const routines = routinesRes.success ? routinesRes.routines || [] : [];
    const athletes = athletesRes.success ? athletesRes.athletes || [] : [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestor de Rutinas</h1>
                    <p className="text-neutral-400">Diseña planes de entrenamiento o deja que la IA lo haga por ti.</p>
                </div>

                <Link href="/routines/new">
                    <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-900/20">
                        <Plus className="w-5 h-5 mr-2" /> Nueva Rutina
                    </Button>
                </Link>
            </div>

            {routines.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/50 rounded-3xl border border-neutral-800">
                    <ClipboardList className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No tienes rutinas creadas</h3>
                    <p className="text-neutral-500 mb-6">Comienza creando tu primera rutina manualmente o con IA.</p>
                    <Link href="/routines/new">
                        <Button variant="outline" className="rounded-full border-neutral-700 text-white hover:bg-neutral-800">
                            Crear Rutina
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routines.map((routine: any) => (
                        <RoutineCard key={routine.id} routine={routine} athletes={athletes} />
                    ))}
                </div>
            )}
        </div>
    );
}
