import { getActiveRoutine } from "@/actions/athlete-actions";
import { WorkoutSession } from "@/components/training/workout-session";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TrainPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { routine, error } = await getActiveRoutine();

    if (error || !routine) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-16 w-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-white">Sin entrenamiento activo</h1>
                <p className="text-neutral-400 max-w-md">
                    No tienes una rutina asignada actualmente. Contacta a tu coach para comenzar.
                </p>
                <Link href="/">
                    <Button variant="outline" className="rounded-full border-neutral-700 text-white hover:bg-neutral-800">
                        Volver al inicio
                    </Button>
                </Link>
            </div>
        );
    }

    return <WorkoutSession routine={routine} />;
}
