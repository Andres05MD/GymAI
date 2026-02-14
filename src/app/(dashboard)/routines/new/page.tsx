import { RoutineEditor } from "@/components/routines/routine-editor";
import { auth } from "@/lib/auth";
import { getExercises } from "@/actions/exercise-actions";
import { getRoutines } from "@/actions/routine-actions";
import { redirect } from "next/navigation";

export default async function NewRoutinePage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    const { exercises } = await getExercises();
    const { routines: availableRoutines } = await getRoutines();

    return <RoutineEditor availableExercises={exercises || []} availableRoutines={availableRoutines || []} />;
}
