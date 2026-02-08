
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoutineEditor } from "@/components/routines/routine-editor";
import { getAthleteRoutine } from "@/actions/routine-actions";
import { getExercises } from "@/actions/exercise-actions";

export default async function AthleteRoutinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    const routine = await getAthleteRoutine(id);
    const availableExercises = await getExercises();

    return (
        <RoutineEditor
            initialData={routine}
            isEditing={!!routine}
            availableExercises={availableExercises.exercises || []}
            athleteId={id}
        />
    );
}
