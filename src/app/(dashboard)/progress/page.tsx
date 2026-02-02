import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Scale, TrendingUp, Trophy, Ruler, AlertCircle } from "lucide-react";
import { getPersonalRecords } from "@/actions/analytics-actions";
import { adminDb } from "@/lib/firebase-admin";

async function getLatestBodyMetrics(userId: string) {
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();

        // Intentar obtener medidas del historial (si existiera colección separada) o del perfil actual
        // Por simplicidad, usaremos el perfil actual + snapshots si los implementamos luego.
        // Aquí asumimos metrics plano en user.
        return {
            weight: userData?.weight || 0,
            bodyFat: userData?.bodyFat || 0, // Campo hipotético
            measurements: userData?.measurements || {},
            startWeight: userData?.startWeight || userData?.weight || 0, // Guardado al registrarse
        };
    } catch (e) {
        return null;
    }
}

export default async function ProgressPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const [prsResult, metrics] = await Promise.all([
        getPersonalRecords(session.user.id),
        getLatestBodyMetrics(session.user.id)
    ]);

    const prs = prsResult.success ? prsResult.prs : [];
    const weightChange = metrics ? (metrics.weight - metrics.startWeight).toFixed(1) : "0";
    const isWeightLoss = parseFloat(weightChange) < 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Progreso</h1>
                <p className="text-muted-foreground">Análisis de tu evolución física y rendimiento.</p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Scale className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-3xl font-black text-white">{metrics?.weight || "—"}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Peso (kg)</p>
                        <p className={`text-xs mt-1 ${isWeightLoss ? 'text-green-500' : 'text-zinc-500'}`}>
                            {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg desde inicio
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Flame className="h-8 w-8 text-orange-500 mb-2" />
                        <p className="text-3xl font-black text-white">{metrics?.bodyFat ? `${metrics.bodyFat}%` : "—"}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Grasa Est.</p>
                        <p className="text-xs text-zinc-500 mt-1">N/A</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                        <p className="text-3xl font-black text-white">{prs?.length || 0}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">PRs Recientes</p>
                        <p className="text-xs text-zinc-500 mt-1">Últimos 20 entrenos</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-3xl font-black text-white">—</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Volumen</p>
                        <p className="text-xs text-zinc-500 mt-1">Próximamente</p>
                    </CardContent>
                </Card>
            </div>

            {/* Medidas Corporales */}
            <Card className="glass-card border-white/10">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-bold text-white">Medidas Corporales</CardTitle>
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

                                    // Legacy / Fallbacks
                                    biceps: "Bíceps",
                                    quads: "Cuádriceps",
                                    calves: "Pantorrillas",
                                    forearms: "Antebrazos",

                                    // Extremidades
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
                                    <div key={key} className="text-center p-4 bg-zinc-900/50 rounded-xl">
                                        <p className="text-2xl font-black text-white">{value as number}<span className="text-sm text-zinc-500">cm</span></p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{labels[key.toLowerCase()] || key}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                            <Ruler className="h-10 w-10 opacity-20" />
                            <p>No has registrado medidas corporales aún.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Records Personales */}
            <Card className="glass-card border-white/10">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg font-bold text-white">Records Personales (PRs)</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {prs && prs.length > 0 ? (
                        prs.map((pr: any, i: number) => (
                            <div key={i} className="p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{pr.exercise}</h4>
                                        <p className="text-xs text-zinc-500">{pr.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-primary">{pr.weight} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                                    <p className="text-xs text-zinc-500">Mejor Serie</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                            <Trophy className="h-12 w-12 opacity-20" />
                            <p>Aún no tenemos suficientes datos para calcular tus PRs.</p>
                            <p className="text-xs">Completa entrenamientos registrando pesos para ver tu progreso.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
