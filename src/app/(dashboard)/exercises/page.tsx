import { auth } from "@/lib/auth";
import { getExercises } from "@/actions/exercise-actions";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { ExerciseFormDialog } from "@/components/exercises/exercise-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ExercisesPage() {
    const session = await auth();

    // Auth Check
    if (!session?.user?.id) redirect("/login");

    // Access Check: Coaches and Advanced Athletes can manage their library
    const role = session.user.role as string;
    if (role !== "coach" && role !== "advanced_athlete") {
        redirect("/dashboard");
    }

    const { exercises, error } = await getExercises();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">Biblioteca de Ejercicios</h1>
                    <p className="text-xs sm:text-base text-neutral-400">Gestiona tu repertorio técnico para asignarlo a rutinas.</p>
                </div>

                <ExerciseFormDialog
                    trigger={
                        <Button className="h-9 px-4 text-xs md:h-11 md:px-6 md:text-sm bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-900/20">
                            <Plus className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-2" /> Nuevo Ejercicio
                        </Button>
                    }
                />
            </div>

            {error ? (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-500">
                    {error}
                </div>
            ) : (
                <ExerciseList exercises={exercises || []} />
            )}
        </div>
    );
}
