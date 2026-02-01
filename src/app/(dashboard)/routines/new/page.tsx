import { RoutineEditor } from "@/components/routines/routine-editor";
import { auth } from "@/lib/auth";
import { getExercises } from "@/actions/exercise-actions";
import { redirect } from "next/navigation";

export default async function NewRoutinePage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    const { exercises } = await getExercises();

    return <RoutineEditor availableExercises={exercises || []} />;
}
