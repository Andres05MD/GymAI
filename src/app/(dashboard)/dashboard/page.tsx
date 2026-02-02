import { auth } from "@/lib/auth";
import { Users, Dumbbell, CalendarDays, TrendingUp, Activity, PlayCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { getPersonalRecords, getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getCoachStats } from "@/actions/coach-stats-actions";
import { getActiveRoutine } from "@/actions/athlete-actions";
import Link from "next/link";

async function CoachDashboard() {
    const { stats } = await getCoachStats();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Entrenador</h2>
                    <p className="text-neutral-400">Gestiona tus atletas y rutinas desde aquí.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/athletes">
                        <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 h-10">
                            Ver Atletas
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Atletas Totales"
                    value={stats?.totalAthletes?.toString() || "0"}
                    label="Registrados"
                    trend="neutral"
                    icon={Users}
                    color="red"
                />
                <StatCard
                    title="Rutinas Creadas"
                    value={stats?.totalRoutines?.toString() || "0"}
                    label="En biblioteca"
                    trend="neutral"
                    icon={CalendarDays}
                />
                <StatCard
                    title="Ejercicios"
                    value={stats?.totalExercises?.toString() || "0"}
                    label="Disponibles"
                    trend="neutral"
                    icon={Dumbbell}
                />
                <StatCard
                    title="Volumen Global"
                    value={`${Math.round((stats?.weeklyVolume || 0) / 1000)}k`}
                    label="Kg esta semana"
                    trend={(stats?.weeklyVolume || 0) > 0 ? "up" : "neutral"}
                    icon={Activity}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Analytics Chart - Spans 2 cols */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Actividad de Atletas</h3>
                        <p className="text-sm text-neutral-500">Volumen combinado semanal</p>
                    </div>
                    <ActivityChart data={stats?.weeklyChartData || []} />
                </div>

                {/* General Progress */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Estado del Gym</h3>
                    <div className="flex-1 flex items-center justify-center w-full">
                        <ProgressChart completed={(stats?.totalAthletes || 0) > 0 ? 100 : 0} target={100} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-4">Atletas activos vs inactivos (Simulado)</p>
                </div>
            </div>
        </div>
    );
}

async function AthleteDashboard({ user }: { user: any }) {
    const { prs } = await getPersonalRecords(user.id);
    const { routine } = await getActiveRoutine();
    const { data: activityData } = await getWeeklyActivity(user.id);
    const { completed: weeklyCompleted, target: weeklyTarget } = await getWeeklyProgress(user.id);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
                    <p className="text-neutral-400">Bienvenido de nuevo, {user?.name?.split(' ')[0]}</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/history">
                        <Button variant="outline" className="rounded-full border-neutral-700 hover:bg-neutral-800 text-white h-12 px-6">
                            Ver Historial
                        </Button>
                    </Link>
                    <Link href="/train">
                        <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/20">
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Entrenar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards - Simplified */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Sesiones"
                    value={weeklyCompleted?.toString() || "0"}
                    label="Esta semana"
                    trend="neutral"
                    icon={Dumbbell}
                    color="red"
                />
                <StatCard
                    title="Volumen Semanal"
                    value={`${Math.round((activityData?.reduce((acc: number, cur: any) => acc + cur.total, 0) || 0) / 1000)}k`}
                    label="Kg levantados"
                    trend="neutral"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Tiempo"
                    value="0h"
                    label="Entrenando"
                    trend="neutral"
                    icon={Clock}
                />
                <StatCard
                    title="Récords"
                    value={prs?.length?.toString() || "0"}
                    label="Registrados"
                    trend="up"
                    trendValue="New"
                    icon={Activity}
                    color="blue"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Actividad Reciente</h3>
                            <p className="text-sm text-neutral-500">Volumen por sesión (Última semana)</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ActivityChart data={activityData} />
                    </div>
                </div>

                {/* Next Routine / Progress */}
                <div className="space-y-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Progreso Semanal</h3>
                        <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 text-black relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-xl">
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Próxima Sesión</p>
                            {routine ? (
                                <>
                                    <h3 className="text-2xl font-black mb-1">{(routine as any).name}</h3>
                                    <p className="text-sm text-neutral-600 mb-4">{(routine as any).exercises?.length || 0} Ejercicios</p>
                                    <Link href="/train">
                                        <Button className="w-full rounded-full bg-black text-white hover:bg-neutral-800">
                                            Iniciar Ahora
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-black mb-1">Sin rutina asignada</h3>
                                    <p className="text-sm text-neutral-600 mb-4">Contacta a tu entrenador.</p>
                                    <Button disabled className="w-full rounded-full bg-neutral-200 text-neutral-400">
                                        No disponible
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRs Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Récords Personales (PRs)</h3>
                </div>
                {prs && prs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {prs.map((pr: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-black rounded-2xl border border-neutral-800">
                                <div>
                                    <p className="text-white font-bold">{pr.exercise}</p>
                                    <p className="text-neutral-500 text-xs">{pr.date}</p>
                                </div>
                                <span className="text-xl font-black text-white">{pr.weight} kg</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-500 text-center py-8">Registra tus marcas para verlas aquí.</p>
                )}
            </div>

        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth();
    const role = session?.user?.role;

    if (role === "coach") {
        return <CoachDashboard />;
    }

    return <AthleteDashboard user={session?.user} />;
}
