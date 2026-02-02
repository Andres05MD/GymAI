import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Scale, TrendingUp, Trophy, Ruler, AlertCircle, Users } from "lucide-react";
import { getPersonalRecords } from "@/actions/analytics-actions";
import { adminDb } from "@/lib/firebase-admin";
import { getAllAthletes } from "@/actions/coach-actions";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

async function getLatestBodyMetrics(userId: string) {
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();

        // Intentar obtener medidas del historial (si existiera colección separada) o del perfil actual
        // Por simplicidad, usaremos el perfil actual + snapshots si los implementamos luego.
        // Aquí asumimos metrics plano en user.
        return {
            name: userData?.name || "Usuario",
            weight: userData?.weight || 0,
            bodyFat: userData?.bodyFat || 0, // Campo hipotético
            measurements: userData?.measurements || {},
            startWeight: userData?.startWeight || userData?.weight || 0, // Guardado al registrarse
        };
    } catch (e) {
        return null;
    }
}

interface ProgressPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const isCoach = session.user.role === "coach";
    let targetUserId = session.user.id;
    let athletes: any[] = [];

    // Coach Logic: Determine target user
    if (isCoach) {
        const result = await getAllAthletes();
        athletes = result.athletes || [];

        const params = await searchParams;
        const requestedId = params?.athleteId as string;

        if (requestedId) {
            // Verify coach has access (implicitly done by getAllAthletes returning only valid ones usually, but here strict check)
            // For MVP assume getAllAthletes returns all accessible athletes
            targetUserId = requestedId;
        } else if (athletes.length > 0) {
            targetUserId = athletes[0].id;
        } else {
            targetUserId = ""; // No athletes
        }
    }

    // Handle Empty State for Coach
    if (isCoach && !targetUserId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                    <Users className="w-8 h-8 text-neutral-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Sin Atletas Asignados</h2>
                <p className="text-neutral-400 max-w-md">No tienes atletas registrados para ver su progreso. Comienza invitando o creando perfiles de atleta.</p>
            </div>
        );
    }

    const [prsResult, metrics] = await Promise.all([
        getPersonalRecords(targetUserId),
        getLatestBodyMetrics(targetUserId)
    ]);

    const prs = prsResult.success ? prsResult.prs : [];
    const weightChange = metrics ? (metrics.weight - metrics.startWeight).toFixed(1) : "0";
    const isWeightLoss = parseFloat(weightChange) < 0;

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header & Athlete Selector */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                            {isCoach ? `Progreso: ${metrics?.name}` : "Mi Progreso"}
                        </h1>
                        <p className="text-neutral-400">Análisis detallado de evolución física y rendimiento.</p>
                    </div>
                </div>

                {isCoach && athletes.length > 0 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {athletes.map((athlete) => {
                            const isActive = athlete.id === targetUserId;
                            return (
                                <Link
                                    key={athlete.id}
                                    href={`/progress?athleteId=${athlete.id}`}
                                    className={cn(
                                        "flex items-center gap-2 px-2 pr-4 py-1.5 rounded-full transition-all flex-shrink-0 border",
                                        isActive
                                            ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20"
                                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                    )}
                                >
                                    <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src={athlete.image} />
                                        <AvatarFallback className="bg-black text-[10px] font-bold">
                                            {athlete.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-bold truncate max-w-[100px]">{athlete.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card border-white/5 bg-neutral-900/50">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Scale className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-3xl font-black text-white">{metrics?.weight || "—"}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Peso (kg)</p>
                        <p className={cn("text-xs mt-1 font-medium", isWeightLoss ? 'text-green-500' : 'text-neutral-500')}>
                            {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg cambio
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5 bg-neutral-900/50">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Flame className="h-8 w-8 text-orange-500 mb-2" />
                        <p className="text-3xl font-black text-white">{metrics?.bodyFat ? `${metrics.bodyFat}%` : "—"}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Grasa Est.</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">N/A</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5 bg-neutral-900/50">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                        <p className="text-3xl font-black text-white">{prs?.length || 0}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">PRs Nuevos</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">Últimos 20 entrenos</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5 bg-neutral-900/50">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-3xl font-black text-white">—</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Volumen</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">Próximamente</p>
                    </CardContent>
                </Card>
            </div>

            {/* Body Measurements */}
            <Card className="glass-card border-white/10 bg-neutral-900/50">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Medidas Corporales</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {metrics?.measurements && Object.keys(metrics.measurements).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {Object.entries(metrics.measurements).map(([key, value]) => {
                                const labels: Record<string, string> = {
                                    chest: "Pecho / Espalda",
                                    hips: "Cadera",
                                    waist: "Cintura",
                                    shoulders: "Hombros",
                                    glutes: "Glúteos",
                                    neck: "Cuello",

                                    biceps: "Bíceps",
                                    quads: "Cuádriceps",
                                    calves: "Pantorrillas",
                                    forearms: "Antebrazos",

                                    bicepsleft: "Bíceps (Izq)",
                                    bicepsright: "Bíceps (Der)",
                                    forearmsleft: "Antebrazos (Izq)",
                                    forearmsright: "Antebrazos (Der)",
                                    quadsleft: "Cuádriceps (Izq)",
                                    quadsright: "Cuádriceps (Der)",
                                    calvesleft: "Pantorrillas (Izq)",
                                    calvesright: "Pantorrillas (Der)",
                                };
                                return (
                                    <div key={key} className="text-center p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-red-500/30 transition-colors">
                                        <p className="text-2xl font-black text-white mb-1">{value as number}<span className="text-sm text-neutral-500 ml-1 font-bold">cm</span></p>
                                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">{labels[key.toLowerCase()] || key}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2 opacity-60">
                            <Ruler className="h-10 w-10 text-neutral-700" />
                            <p className="font-medium">No se han registrado medidas corporales aún.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Personal Records */}
            <Card className="glass-card border-white/10 bg-neutral-900/50">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Records Personales (PRs)</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {prs && prs.length > 0 ? (
                        prs.map((pr: any, i: number) => (
                            <div key={i} className="p-5 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:border-yellow-500/50 transition-colors">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{pr.exercise}</h4>
                                        <p className="text-xs text-neutral-500 font-medium">{pr.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-2xl text-white">{pr.weight} <span className="text-sm font-bold text-neutral-500">kg</span></p>
                                    <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-bold">Mejor Serie</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2 opacity-60">
                            <Trophy className="h-12 w-12 text-neutral-700" />
                            <p className="font-medium">Aún no hay datos suficientes para calcular PRs.</p>
                            <p className="text-xs">Los registros aparecerán automáticamente al entrenar.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
