import { getTrainingLogs } from "@/actions/training-actions";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HistoryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { logs, error } = await getTrainingLogs(session.user.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase">Historial de Entrenamiento</h1>
                    <p className="text-neutral-400 text-sm">Registro detallado de tus sesiones.</p>
                </div>
            </div>

            {error ? (
                <div className="text-red-500 bg-red-900/10 p-4 rounded-lg border border-red-900/20">
                    {error}
                </div>
            ) : (
                <TrainingHistoryList logs={logs || []} />
            )}
        </div>
    );
}
