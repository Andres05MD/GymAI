import { auth } from "@/lib/auth";
import { Activity, Flame, Scale, TrendingUp, Trophy, Ruler, Users, ArrowLeft, Dumbbell } from "lucide-react";
import { getPersonalRecords, getStrengthProgress } from "@/actions/analytics-actions";
import { adminDb } from "@/lib/firebase-admin";
import { getAllAthletes } from "@/actions/coach-actions";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogMeasurementDialog } from "@/components/profile/log-measurement-dialog";

interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
    reps?: number;
}

interface Athlete {
    id: string;
    name?: string;
    image?: string;
    email?: string;
    [key: string]: unknown;
}

async function getLatestBodyMetrics(userId: string) {
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();

        // Limpiar measurements para asegurar que solo pasamos números al cliente
        const rawMeasurements = userData?.measurements || {};
        const cleanMeasurements: Record<string, number> = {};

        Object.entries(rawMeasurements).forEach(([key, value]) => {
            if (typeof value === 'number') {
                cleanMeasurements[key] = value;
            }
        });

        // TRAYECTORIA DE CÁLCULO: Priorizar campo directo, si no, intentar calcular
        let bodyFat = userData?.bodyFat;

        if (!bodyFat && userData?.height && cleanMeasurements.waist && cleanMeasurements.neck) {
            const h = userData.height;
            const w = cleanMeasurements.waist;
            const n = cleanMeasurements.neck;
            const gender = userData?.gender || "male";
            const log10 = Math.log10;

            if (gender === "male" || gender !== "female") {
                const diff = w - n;
                if (diff > 0) {
                    const denom = 1.0324 - 0.19077 * log10(diff) + 0.15456 * log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            } else if (gender === "female" && cleanMeasurements.hips) {
                const hip = cleanMeasurements.hips;
                const diff = (w + hip) - n;
                if (diff > 0) {
                    const denom = 1.29579 - 0.35004 * log10(diff) + 0.22100 * log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            }

            if (bodyFat !== undefined && !isNaN(bodyFat)) {
                bodyFat = Math.max(2, Math.min(60, bodyFat));
                bodyFat = parseFloat(bodyFat.toFixed(1));
            }
        }

        return {
            name: userData?.name || "Usuario",
            weight: userData?.weight || 0,
            bodyFat: bodyFat || null,
            height: userData?.height || 0,
            measurements: cleanMeasurements,
            startWeight: userData?.startWeight || userData?.weight || 0,
        };
    } catch (e) {
        console.error("Error in getLatestBodyMetrics:", e);
        return null;
    }
}

interface ProgressPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
    // ... logic (session, coach, metrics, etc)
    const session = await auth();
    if (!session?.user?.id) return null;

    const isCoach = session.user.role === "coach";
    let targetUserId = session.user.id;
    let athletes: Athlete[] = [];

    // Coach Logic: Determine target user
    if (isCoach) {
        const result = await getAllAthletes();
        athletes = (result.athletes as unknown as Athlete[]) || [];

        const params = await searchParams;
        const requestedId = params?.athleteId as string;

        if (requestedId) {
            targetUserId = requestedId;
        } else if (athletes.length > 0) {
            targetUserId = athletes[0].id;
        } else {
            targetUserId = "";
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

    const [prsResult, metrics, strengthResult] = await Promise.all([
        getPersonalRecords(targetUserId),
        getLatestBodyMetrics(targetUserId),
        getStrengthProgress(targetUserId)
    ]);

    const prs = prsResult.success ? prsResult.prs : [];
    const strengthProgress = strengthResult.success && strengthResult.progress ? strengthResult.progress : 0;
    const isStrengthPositive = strengthProgress >= 0;
    const weightChange = metrics ? (metrics.weight - metrics.startWeight).toFixed(1) : "0";
    const isWeightLoss = parseFloat(weightChange) < 0;

    return (
        <div className="flex flex-col gap-8 pb-32">
            {/* Header & Athlete Selector */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                                {isCoach ? `Progreso: ${metrics?.name}` : "Mi Progreso"}
                            </h1>
                            <p className="text-neutral-400 text-sm">Análisis detallado de evolución física y rendimiento.</p>
                        </div>
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
                                        "flex items-center gap-2 px-2 pr-4 py-1.5 rounded-full transition-all shrink-0 border",
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {/* Peso Card con Modal - Solo para el propio usuario o coach */}
                <LogMeasurementDialog
                    initialWeight={metrics?.weight}
                    initialData={metrics?.measurements}
                    targetUserId={targetUserId}
                >
                    <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-3xl md:rounded-4xl p-4 md:p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-600/20 transition-colors"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-105 transition-transform duration-300">
                                <Scale className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-1">{metrics?.weight || "—"}</p>
                            <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Peso (kg)</p>
                        </div>
                    </div>
                </LogMeasurementDialog>

                <Link href="#measurements-section" className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-3xl md:rounded-4xl p-4 md:p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-600/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-105 transition-transform duration-300">
                            <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-1">{metrics?.bodyFat ? `${metrics.bodyFat}%` : "—"}</p>
                        <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Grasa Est.</p>
                        <p className="text-[10px] md:text-xs text-neutral-600 font-medium group-hover:text-orange-500 transition-colors shrink-0">Ver Medidas</p>
                    </div>
                </Link>

                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-3xl md:rounded-4xl p-4 md:p-6 relative overflow-hidden group hover:border-green-500/30 transition-all h-full flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-600/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-105 transition-transform duration-300">
                            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-1 flex items-center gap-1">
                            {isStrengthPositive ? "+" : ""}{strengthProgress}%
                        </p>
                        <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Progreso Fuerza</p>
                        <p className="text-[10px] md:text-xs text-neutral-600 font-medium shrink-0">vs Entrenos prev.</p>
                    </div>
                </div>
            </div>

            {/* Body Measurements */}
            <div id="measurements-section" className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl overflow-hidden scroll-mt-24">
                <div className="border-b border-neutral-800/50 p-6 flex items-center gap-4 bg-black/20">
                    <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-500/10 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                        <Ruler className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Medidas Corporales</h3>
                        <p className="text-xs text-neutral-500 font-medium">Seguimiento de circunferencia (cm)</p>
                    </div>
                </div>
                <div className="p-6">
                    {metrics?.measurements && Object.keys(metrics.measurements).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(() => {
                                // Combinar medidas con la altura para mostrarla en el grid
                                const allDisplayMeasurements = { ...metrics.measurements };
                                if (metrics.height) {
                                    allDisplayMeasurements.height = metrics.height;
                                }

                                return Object.entries(allDisplayMeasurements)
                                    .filter(([key]) => !["weight", "bodyfat"].includes(key.toLowerCase()))
                                    .sort(([a], [b]) => {
                                        const order = [
                                            "height", "neck", "shoulders", "chest", "waist", "hips", "glutes",
                                            "bicepsleft", "bicepsright", "forearmsleft", "forearmsright",
                                            "quadsleft", "quadsright", "calvesleft", "calvesright"
                                        ];
                                        const indexA = order.indexOf(a.toLowerCase());
                                        const indexB = order.indexOf(b.toLowerCase());
                                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                        if (indexA === -1) return 1;
                                        if (indexB === -1) return -1;
                                        return indexA - indexB;
                                    })
                                    .map(([key, value]) => {
                                        const labels: Record<string, string> = {
                                            height: "Altura",
                                            chest: "Pecho",
                                            hips: "Cadera",
                                            waist: "Cintura",
                                            shoulders: "Hombros",
                                            glutes: "Glúteos",
                                            neck: "Cuello",
                                            bicepsleft: "Bíceps (Izq)",
                                            bicepsright: "Bíceps (Der)",
                                            forearmsleft: "Antebrazos (Izq)",
                                            forearmsright: "Antebrazos (Der)",
                                            quadsleft: "Cuádriceps (Izq)",
                                            quadsright: "Cuádriceps (Der)",
                                            calvesleft: "Pantorrillas (Izq)",
                                            calvesright: "Pantorrillas (Der)",
                                        };

                                        const isHeight = key.toLowerCase() === "height";
                                        const unit = "cm";

                                        return (
                                            <div
                                                key={key}
                                                className={cn(
                                                    "text-center p-5 bg-neutral-900/50 border border-neutral-800 rounded-3xl hover:border-red-500/30 transition-all hover:bg-neutral-800/50 group",
                                                    isHeight && "col-span-2"
                                                )}
                                            >
                                                <p className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-bottom">
                                                    {value as number}
                                                    <span className="text-sm text-neutral-500 ml-1 font-bold">{unit}</span>
                                                </p>
                                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold group-hover:text-red-400 transition-colors">
                                                    {labels[key.toLowerCase()] || key}
                                                </p>
                                            </div>
                                        );
                                    });
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-500 flex flex-col items-center gap-4">
                            <div className="bg-neutral-800/50 p-4 rounded-full">
                                <Ruler className="h-8 w-8 text-neutral-600" />
                            </div>
                            <p className="font-medium">No se han registrado medidas corporales aún.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Peso de Ejercicios */}
            <div id="exercises-weight-section" className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl overflow-hidden scroll-mt-24">
                <div className="border-b border-neutral-800/50 p-6 flex items-center gap-4 bg-black/20">
                    <div className="w-12 h-12 bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <Dumbbell className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Pesos por Ejercicio</h3>
                        <p className="text-xs text-neutral-500 font-medium">Máximos pesos registrados por cada ejercicio</p>
                    </div>
                </div>

                {prs && prs.length > 0 ? (
                    <div className="divide-y divide-neutral-800">
                        {prs.map((pr: PersonalRecord, i: number) => (
                            <div key={i} className="p-6 flex items-center justify-between hover:bg-neutral-800/30 transition-colors group">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className="h-14 w-14 bg-red-500/5 rounded-2xl shrink-0 flex items-center justify-center border border-neutral-800 group-hover:border-red-500/30 transition-colors">
                                        <Dumbbell className="h-6 w-6 text-neutral-600 group-hover:text-red-500 transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-lg mb-0.5">{pr.exercise}</h4>
                                        <p className="text-xs text-neutral-500 font-medium font-mono">{pr.date}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="font-black text-3xl text-white tracking-tighter whitespace-nowrap">
                                        {pr.weight} <span className="text-base font-bold text-neutral-600">kg</span>
                                    </p>
                                    <p className="text-[9px] uppercase tracking-widest text-red-500/70 font-bold whitespace-nowrap">Máximo Peso</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-neutral-500 flex flex-col items-center gap-4">
                        <div className="bg-neutral-800/50 p-4 rounded-full">
                            <Dumbbell className="h-8 w-8 text-neutral-600" />
                        </div>
                        <div>
                            <p className="font-medium">Aún no hay datos suficientes para mostrar pesos máximos.</p>
                            <p className="text-sm mt-1">Sigue entrenando duro.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
