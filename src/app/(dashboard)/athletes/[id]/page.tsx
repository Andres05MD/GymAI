import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getPersonalRecords, getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getTrainingLogs } from "@/actions/training-actions";
import { getAthleteRoutine, getCoachRoutines } from "@/actions/routine-actions";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, TrendingUp, Trophy, Target, Calendar, Flame } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoachAIAnalysis } from "@/components/dashboard/coach-ai-analysis";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignRoutineModal } from "@/components/routines/assign-routine-modal";
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar";

interface Athlete {
    id: string;
    name?: string;
    image?: string;
    email?: string;
    coachId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt?: any; // Firestore Timestamp
    goal?: string;
}

interface ActivityData {
    total: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

interface RoutineData {
    id: string;
    name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schedule?: any[];
}

export default async function AthleteDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    // 1. Verify access & fetch basic user info
    const userDoc = await adminDb.collection("users").doc(id).get();
    if (!userDoc.exists) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <Target className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Atleta no encontrado</h1>
                <p className="text-neutral-400 mb-6">El perfil que buscas no existe.</p>
                <Link href="/athletes">
                    <Button variant="outline" className="rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Atletas
                    </Button>
                </Link>
            </div>
        );
    }

    // Check if assigned


    const athlete = { id: userDoc.id, ...userDoc.data() } as Athlete;

    // 2. Fetch Analytics
    const { prs } = await getPersonalRecords(id);
    const { data: activityData } = await getWeeklyActivity(id);
    const { completed: weeklyCompleted, target: weeklyTarget } = await getWeeklyProgress(id);
    const { logs } = await getTrainingLogs(id);
    const routine = (await getAthleteRoutine(id)) as unknown as RoutineData | null;

    // Fetch library routines for assignment model
    const { routines: coachRoutinesRaw } = await getCoachRoutines();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coachRoutines = Array.from(new Map((coachRoutinesRaw || []).map((r: any) => [r.id, r])).values());

    // Calculate total volume from activity data
    const weeklyVolume = activityData?.reduce((acc: number, cur: ActivityData) => acc + cur.total, 0) || 0;

    return (
        <div className="space-y-8 pb-32 md:pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/athletes">
                        <Button variant="ghost" size="icon" className="rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>

                    <Avatar className="h-16 w-16 border-2 border-neutral-800">
                        <AvatarImage src={athlete.image} />
                        <AvatarFallback className="bg-neutral-800 text-white font-bold text-xl">
                            {athlete.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
                                {athlete.name}
                            </h1>

                        </div>
                        <p className="text-neutral-500 text-sm">{athlete.email}</p>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-auto md:items-end gap-3">
                    {routine ? (
                        <Link href={`/athletes/${athlete.id}/routine`} className="group block">
                            <div className="bg-neutral-900 border border-neutral-800 hover:border-red-500/50 rounded-2xl flex items-center pr-6 pl-3 py-2 gap-4 transition-all hover:bg-neutral-800 cursor-pointer shadow-lg hover:shadow-red-900/10 h-14">
                                <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform bg-linear-to-br from-red-500 to-red-700">
                                    <Dumbbell className="text-white w-5 h-5" />
                                </div>
                                <div className="text-left flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1.5">Rutina Activa</p>
                                    <p className="text-white font-bold text-sm leading-none group-hover:text-red-400 transition-colors truncate max-w-[140px] md:max-w-[200px]">
                                        {routine.name || "Sin Nombre"}
                                    </p>
                                </div>
                                {routine.schedule && (
                                    <div className="hidden md:flex flex-col items-center border-l border-neutral-800 pl-4 h-8 justify-center min-w-12">
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase leading-none mb-0.5">Días</span>
                                        <span className="text-sm font-black text-white leading-none">{routine.schedule.length}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <AssignRoutineModal
                            athleteId={athlete.id}
                            athleteName={athlete.name || "Atleta"}
                            routines={coachRoutines || []}
                        />
                    )}

                    {/* Quick Info Pills */}
                    <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                        {athlete.goal && (
                            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-sm font-bold border border-red-500/20">
                                <Target className="w-4 h-4" />
                                {(() => {
                                    const map: Record<string, string> = {
                                        hypertrophy: "Hipertrofia",
                                        strength: "Fuerza",
                                        weight_loss: "Pérdida de Peso",
                                        endurance: "Resistencia",
                                        maintenance: "Mantenimiento"
                                    };
                                    return map[athlete.goal] || athlete.goal;
                                })()}
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-neutral-900 text-neutral-400 px-4 py-2 rounded-full text-sm font-bold border border-neutral-800">
                            <Calendar className="w-4 h-4" />
                            Desde {athlete.createdAt ? new Date(athlete.createdAt.toDate?.() || athlete.createdAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-2xl w-full sm:w-auto">
                    <TabsTrigger
                        value="overview"
                        className="flex-1 sm:flex-none rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-6"
                    >
                        Visión General
                    </TabsTrigger>
                    <TabsTrigger
                        value="schedule"
                        className="flex-1 sm:flex-none rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-6"
                    >
                        Calendario
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex-1 sm:flex-none rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg px-6"
                    >
                        Historial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* AI Analysis Section */}
                    <CoachAIAnalysis athleteId={athlete.id} />

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Sesiones"
                            value={weeklyCompleted?.toString() || "0"}
                            label="Esta semana"
                            trend="neutral"
                            icon={Dumbbell}
                            color="red"
                        />
                        <StatCard
                            title="Volumen"
                            value={`${Math.round(weeklyVolume / 1000)}k`}
                            label="Kg semanal"
                            trend="neutral"
                            icon={TrendingUp}
                        />
                        <StatCard
                            title="Récords"
                            value={prs?.length?.toString() || "0"}
                            label="Personales"
                            trend={(prs?.length || 0) > 0 ? "up" : "neutral"}
                            trendValue={(prs?.length || 0) > 0 ? "New" : undefined}
                            icon={Trophy}
                            color="yellow"
                        />
                        <StatCard
                            title="Racha"
                            value="—"
                            label="Días seguidos"
                            trend="neutral"
                            icon={Flame}
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Actividad Semanal</h3>
                                    <p className="text-sm text-neutral-500">Volumen de entrenamiento</p>
                                </div>
                            </div>
                            <div className="h-[280px]">
                                <ActivityChart data={activityData} />
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Cumplimiento</h3>
                            <p className="text-sm text-neutral-500 mb-6">Meta semanal de sesiones</p>
                            <div className="flex-1 flex items-center justify-center">
                                <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                            </div>
                        </div>
                    </div>

                    {/* PRs Preview */}
                    {prs && prs.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <h3 className="text-xl font-bold text-white">Records Personales</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {prs.slice(0, 3).map((pr: PersonalRecord, i: number) => (
                                    <div key={i} className="bg-black/40 border border-yellow-500/10 rounded-2xl p-4 flex items-center justify-between hover:border-yellow-500/30 transition-colors">
                                        <div>
                                            <p className="font-bold text-white">{pr.exercise}</p>
                                            <p className="text-xs text-neutral-500">{pr.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-yellow-500">{pr.weight}</p>
                                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">kg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="schedule">
                    <ScheduleCalendar athleteId={athlete.id} />
                </TabsContent>

                <TabsContent value="history">
                    <TrainingHistoryList logs={logs || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
