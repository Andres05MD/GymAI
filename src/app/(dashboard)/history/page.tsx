import { getTrainingLogs } from "@/actions/training-actions";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Dumbbell, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HistoryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { logs, error } = await getTrainingLogs(session.user.id);

    // Calculate some stats for the header
    const totalSessions = logs?.length || 0;
    const totalVolume = logs?.reduce((acc: number, log: any) => {
        return acc + (log.exercises?.reduce((exAcc: number, ex: any) => {
            return exAcc + (ex.sets?.reduce((setAcc: number, s: any) => setAcc + ((s.weight || 0) * (s.reps || 0)), 0) || 0);
        }, 0) || 0);
    }, 0) || 0;

    const thisMonthLogs = logs?.filter((log: any) => {
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
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Dumbbell className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-black text-white">{totalSessions}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Total Sesiones</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black text-white">{Math.round(totalVolume / 1000)}k</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Kg Totales</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-black text-white">{thisMonthLogs.length}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Este Mes</p>
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
