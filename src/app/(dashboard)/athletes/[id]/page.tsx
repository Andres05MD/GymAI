import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getPersonalRecords, getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getTrainingLogs } from "@/actions/training-actions";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, TrendingUp, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoachAIAnalysis } from "@/components/dashboard/coach-ai-analysis";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AthleteDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    // 1. Verify access & fetch basic user info
    const userDoc = await adminDb.collection("users").doc(id).get();
    if (!userDoc.exists || userDoc.data()?.coachId !== session.user.id) {
        return <div>No autorizado o atleta no encontrado.</div>;
    }

    const athlete = { id: userDoc.id, ...userDoc.data() } as any;

    // 2. Fetch Analytics
    const { prs } = await getPersonalRecords(id);
    const { data: activityData } = await getWeeklyActivity(id);
    const { completed: weeklyCompleted, target: weeklyTarget } = await getWeeklyProgress(id);
    const { logs } = await getTrainingLogs(id);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/athletes">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">{athlete.name}</h1>
                    <p className="text-neutral-400 text-sm">Perfil del Atleta • {athlete.email}</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-neutral-900 border border-neutral-800">
                    <TabsTrigger value="overview">Visión General</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* AI Analysis Section */}
                    <div className="grid grid-cols-1">
                        <CoachAIAnalysis athleteId={athlete.id} />
                    </div>

                    {/* KPIs */}
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
                            title="Récords"
                            value={prs?.length?.toString() || "0"}
                            label="Registrados"
                            trend="up"
                            trendValue="New"
                            icon={Activity}
                            color="blue"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                            <h3 className="text-xl font-bold text-white mb-6">Actividad</h3>
                            <div className="h-[300px]">
                                <ActivityChart data={activityData} />
                            </div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-8">
                            <h3 className="text-xl font-bold text-white mb-6">Cumplimiento</h3>
                            <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <TrainingHistoryList logs={logs || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
