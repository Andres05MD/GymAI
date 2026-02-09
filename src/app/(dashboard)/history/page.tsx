import { getTrainingLogs } from "@/actions/training-actions";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Dumbbell, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Tipos locales para cálculos
interface TrainingSet {
    weight?: number;
    reps?: number;
    completed?: boolean;
}

interface TrainingExercise {
    exerciseName: string;
    sets?: TrainingSet[];
}

interface TrainingLog {
    id: string;
    date: string;
    exercises?: TrainingExercise[];
}

export default async function HistoryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { logs, error } = await getTrainingLogs(session.user.id);

    // Calculate some stats for the header
    const typedLogs = logs as TrainingLog[] | undefined;
    const totalSessions = typedLogs?.length || 0;
    const totalVolume = typedLogs?.reduce((acc: number, log: TrainingLog) => {
        return acc + (log.exercises?.reduce((exAcc: number, ex: TrainingExercise) => {
            return exAcc + (ex.sets?.reduce((setAcc: number, s: TrainingSet) => setAcc + ((s.weight || 0) * (s.reps || 0)), 0) || 0);
        }, 0) || 0);
    }, 0) || 0;

    const thisMonthLogs = typedLogs?.filter((log: TrainingLog) => {
        const logDate = new Date(log.date);
        const now = new Date();
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }) || [];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                        Historial de Entrenamientos
                    </h1>
                    <p className="text-neutral-400 text-sm">Registro completo de todas tus sesiones.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-red-600/20 transition-colors"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-110 transition-transform duration-300">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter mb-1">{totalSessions}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Total Sesiones</p>
                    </div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-600/20 transition-colors"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-110 transition-transform duration-300">
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter mb-1">{Math.round(totalVolume / 1000)}k</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Kg Totales</p>
                    </div>
                </div>
                <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-4xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-600/20 transition-colors"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-neutral-800 group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-white tracking-tighter mb-1">{thisMonthLogs.length}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Este Mes</p>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            {error ? (
                <div className="text-red-500 bg-red-900/10 p-6 rounded-2xl border border-red-900/20 text-center">
                    <p className="font-bold mb-1">Error al cargar historial</p>
                    <p className="text-sm opacity-70">{error}</p>
                </div>
            ) : (
                <TrainingHistoryList logs={logs || []} />
            )}
        </div>
    );
}
