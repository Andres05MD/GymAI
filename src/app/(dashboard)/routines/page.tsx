import { auth } from "@/lib/auth";
import { getRoutines } from "@/actions/routine-actions";
import { getAllAthletes } from "@/actions/coach-actions";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RoutineCard } from "@/components/routines/routine-card";

export default async function RoutinesPage() {
    const session = await auth();

    // Verificación de autenticación
    if (!session?.user?.id) redirect("/login");
    const role = session.user.role as string;
    if (role !== "coach" && role !== "advanced_athlete") redirect("/dashboard");

    // Cargar datos en paralelo desde el servidor
    const [routinesRes, athletesRes] = await Promise.all([
        getRoutines(),
        role === "coach" ? getAllAthletes() : Promise.resolve({ success: true, athletes: [] })
    ]);

    const routinesRaw = routinesRes.success ? routinesRes.routines || [] : [];
    const athletesRaw = athletesRes.success ? athletesRes.athletes || [] : [];

    // Asegurar que no haya duplicados por ID y minimizar serialización enviada a Client Components (server-serialization)
    const routines = Array.from(new Map(routinesRaw.map(r => [r.id, r])).values());
    const athletes = Array.from(new Map(athletesRaw.map(a => [
        a.id,
        { id: a.id, name: a.name, email: a.email, image: a.image } // Solo campos usados por el diálogo
    ])).values());

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">Gestor de Rutinas</h1>
                    <p className="text-xs sm:text-base text-neutral-400">Diseña planes de entrenamiento o deja que la IA lo haga por ti.</p>
                </div>

                <Link href="/routines/new">
                    <Button className="h-9 px-4 text-xs md:h-11 md:px-6 md:text-sm bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-900/20">
                        <Plus className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-2" /> Nueva Rutina
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
                <div className="space-y-12">
                    {/* Weekly Routines Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Planificación Semanal</h2>
                            <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-mono">
                                {routines.filter((r: any) => r.type !== 'daily').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {routines
                                .filter((r: any) => r.type !== 'daily')
                                .map((routine: any) => (
                                    <RoutineCard key={routine.id} routine={routine} athletes={athletes || []} />
                                ))}
                            {routines.filter((r: any) => r.type !== 'daily').length === 0 && (
                                <div className="col-span-full py-8 text-center text-neutral-500 text-sm italic border border-dashed border-neutral-800 rounded-xl">
                                    No hay rutinas semanales
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Routines Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Sesiones Diarias</h2>
                            <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-mono">
                                {routines.filter((r: any) => r.type === 'daily').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {routines
                                .filter((r: any) => r.type === 'daily')
                                .map((routine: any) => (
                                    <RoutineCard key={routine.id} routine={routine} athletes={athletes || []} />
                                ))}
                            {routines.filter((r: any) => r.type === 'daily').length === 0 && (
                                <div className="col-span-full py-8 text-center text-neutral-500 text-sm italic border border-dashed border-neutral-800 rounded-xl">
                                    No hay sesiones diarias sueltas
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
