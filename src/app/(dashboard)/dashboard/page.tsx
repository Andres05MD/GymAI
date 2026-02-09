import { auth } from "@/lib/auth";
import { Users, Dumbbell, CalendarDays, TrendingUp, Activity, PlayCircle, Clock, Plus, UserPlus, FileText, ChevronRight, Copy, Share2 } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { getPersonalRecords, getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getCoachStats, getRecentActivity } from "@/actions/coach-stats-actions";
import { getActiveRoutine } from "@/actions/athlete-actions";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar";
import type {
    DashboardUser,
    RecentActivity,
    ActivityDataPoint,
    PersonalRecord,
    SerializedRoutine
} from "@/types";

// Lazy loading de gráficos pesados (Recharts ~200KB)
const ActivityChart = dynamic(
    () => import("@/components/dashboard/activity-chart").then(mod => mod.ActivityChart),
    { loading: () => <Skeleton className="w-full h-[250px] rounded-xl bg-neutral-800" /> }
);

const ProgressChart = dynamic(
    () => import("@/components/dashboard/progress-chart").then(mod => mod.ProgressChart),
    { loading: () => <Skeleton className="w-full h-[200px] rounded-xl bg-neutral-800" /> }
);


async function CoachDashboard({ user }: { user: DashboardUser | undefined }) {
    const [statsResult, activityResult] = await Promise.all([
        getCoachStats(),
        getRecentActivity()
    ]);

    const stats = statsResult.success ? statsResult.stats : null;
    const activities = (activityResult.success && activityResult.activities) ? activityResult.activities : [];

    return (
        <div className="space-y-8 pb-24 md:pb-10">
            <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-tight">Dashboard Entrenador</h2>
                    <p className="text-xs sm:text-base text-neutral-400">Gestiona tus atletas y rutinas desde aquí.</p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto">
                    <Link href="/athletes" className="w-full md:w-auto">
                        <Button className="group relative w-full md:w-auto overflow-hidden rounded-full bg-linear-to-r from-red-600 to-red-500 px-6 py-4 md:px-8 md:py-6 text-sm md:text-base font-bold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-red-500/40 hover:from-red-500 hover:to-orange-500 border border-red-500/20 h-10 md:h-14">
                            <span className="relative z-10 flex items-center gap-2">
                                <Users className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
                                <span className="tracking-widest text-xs md:text-base">VER ATLETAS</span>
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        </Button>
                    </Link>

                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Charts & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Chart */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white">Actividad de Atletas</h3>
                            <p className="text-sm text-neutral-500">Volumen combinado semanal</p>
                        </div>
                        <ActivityChart data={stats?.weeklyChartData || []} />
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Últimas Actividades</h3>
                            <Link href="/progress" className="text-sm font-bold text-red-500 hover:text-red-400 flex items-center">
                                Ver Todo <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity: RecentActivity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={activity.athleteImage ?? undefined} />
                                                <AvatarFallback className="bg-neutral-800 text-neutral-400 font-bold">
                                                    {activity.athleteName?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-white text-sm">{activity.athleteName}</p>
                                                <p className="text-neutral-500 text-xs flex items-center gap-1">
                                                    <Dumbbell className="w-3 h-3" /> {activity.routineName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-black text-sm">{activity.volume} <span className="text-neutral-500 font-normal text-xs">kg</span></p>
                                            <p className="text-neutral-600 text-[10px] uppercase font-bold tracking-wider flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" /> {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-neutral-500">
                                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>No hay actividad reciente registrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Actions & Status */}
                <div className="space-y-6">
                    {/* Quick Actions Card */}
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 shadow-xl shadow-black/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-24 h-24 text-white" />
                        </div>
                        <h3 className="text-white text-xl font-black mb-1 relative z-10">Acciones Rápidas</h3>
                        <p className="text-neutral-500 text-sm mb-6 relative z-10">Gestión eficiente del gimnasio.</p>

                        <div className="space-y-3 relative z-10">
                            <Link href="/routines" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:text-white text-neutral-200 font-bold">
                                    <FileText className="w-4 h-4 mr-2" /> Nueva Rutina
                                </Button>
                            </Link>
                            <Link href="/exercises" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:text-white text-neutral-200 font-bold">
                                    <Plus className="w-4 h-4 mr-2 text-red-500" /> Agregar Ejercicio
                                </Button>
                            </Link>
                            <Link href="/athletes" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:text-white text-neutral-200 font-bold">
                                    <UserPlus className="w-4 h-4 mr-2" /> Gestionar Atletas
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Progress / Status */}


                    {/* Active Sessions Mini-List (Placeholder for MVP) */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-6">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">En este momento</h3>
                        <div className="flex items-center gap-3 text-neutral-500 text-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Sistema Activo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function AthleteDashboard({ user }: { user: DashboardUser | undefined }) {
    const userId = user?.id ?? "";
    const { prs } = await getPersonalRecords(userId);
    const { routine } = await getActiveRoutine();
    const { data: activityData } = await getWeeklyActivity(userId);
    const { completed: weeklyCompleted, target: weeklyTarget } = await getWeeklyProgress(userId);

    return (
        <div className="space-y-8 pb-24 md:pb-10">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h2>
                    <p className="text-neutral-400">Bienvenido de nuevo, {user?.name?.split(' ')[0]}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex md:gap-3">
                    <Link href="/history" className="w-full md:w-auto">
                        <Button variant="outline" className="w-full rounded-full border-neutral-700 hover:bg-neutral-800 text-white h-12 px-6">
                            Ver Historial
                        </Button>
                    </Link>
                    <Link href="/train" className="w-full md:w-auto">
                        <Button className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/20">
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Entrenar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards - Simplified */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    value={`${Math.round((activityData?.reduce((acc: number, cur: ActivityDataPoint) => acc + cur.total, 0) || 0) / 1000)}k`}
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

            {/* Schedule Section */}
            <ScheduleCalendar athleteId={userId} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-4xl p-8 flex flex-col">
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
                    <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-8">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">Objetivo Semanal</h3>
                            <p className="text-sm text-neutral-400">Mantén tu constancia de entrenamiento.</p>
                        </div>
                        <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-4xl overflow-hidden group hover:border-red-500/30 transition-all hover:-translate-y-1 duration-300 shadow-xl">
                        <div className="relative z-10 p-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Próxima Sesión</p>
                            {routine ? (
                                <>
                                    <h3 className="text-2xl font-black mb-1 text-white">{(routine as unknown as SerializedRoutine).name}</h3>
                                    <p className="text-sm text-neutral-400 mb-4">{((routine as unknown as SerializedRoutine).schedule?.length) || 0} Ejercicios</p>
                                    <Link href="/train">
                                        <Button className="w-full rounded-full bg-white text-black hover:bg-neutral-200 font-bold">
                                            Iniciar Ahora
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-black mb-1">Sin rutina asignada</h3>
                                    <p className="text-sm text-neutral-400 mb-4">Contacta a tu entrenador.</p>
                                    <Button disabled className="w-full rounded-full bg-neutral-800 text-neutral-500">
                                        No disponible
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRs Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-4xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Récords Personales (PRs)</h3>
                </div>
                {prs && prs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {prs.map((pr: PersonalRecord, i: number) => (
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
        return <CoachDashboard user={session?.user} />;
    }

    return <AthleteDashboard user={session?.user} />;
}
