import { RoutineEditor } from "@/components/routines/routine-editor";
import { auth } from "@/lib/auth";
import { getRoutine, getRoutines } from "@/actions/routine-actions";
import { getExercises } from "@/actions/exercise-actions";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditRoutinePage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    const { routine, error } = await getRoutine(id);
    const { exercises } = await getExercises();
    const { routines: availableRoutines } = await getRoutines();

    if (error || !routine) {
        return <div>Error: {error || "Rutina no encontrada"}</div>;
    }

    return <RoutineEditor initialData={routine} isEditing availableExercises={exercises || []} availableRoutines={availableRoutines || []} />;
}
