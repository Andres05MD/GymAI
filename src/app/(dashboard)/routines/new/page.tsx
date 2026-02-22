import { RoutineEditor } from "@/components/routines/routine-editor";
import { auth } from "@/lib/auth";
import { getExercises } from "@/actions/exercise-actions";
import { getRoutines } from "@/actions/routine-actions";
import { redirect } from "next/navigation";

export default async function NewRoutinePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const role = session.user.role as string;
    if (role !== "coach" && role !== "advanced_athlete") {
        redirect("/dashboard");
    }

    const { exercises } = await getExercises();
    const { routines: availableRoutines } = await getRoutines();

    return <RoutineEditor availableExercises={exercises || []} availableRoutines={availableRoutines || []} />;
}
