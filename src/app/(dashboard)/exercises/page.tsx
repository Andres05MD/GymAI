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

    // Access Check: Only coaches can manage the library
    // Athletes might have a read-only view in the future, but for now this is the management console
    if (session.user.role !== "coach") {
        redirect("/");
    }

    const { exercises, error } = await getExercises();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Biblioteca de Ejercicios</h1>
                    <p className="text-neutral-400">Gestiona tu repertorio técnico para asignarlo a rutinas.</p>
                </div>

                <ExerciseFormDialog
                    trigger={
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-900/20">
                            <Plus className="w-5 h-5 mr-2" /> Nuevo Ejercicio
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
