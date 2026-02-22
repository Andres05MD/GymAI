import { auth } from "@/lib/auth";
import { getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getCoachStats, getRecentActivity } from "@/actions/coach-stats-actions";
import { getActiveRoutine } from "@/actions/athlete-actions";
import { AthleteDashboardUI, CoachDashboardUI } from "@/components/dashboard/dashboard-ui-shell";
import type { DashboardUser } from "@/types";

async function AthleteDashboard({ user }: { user: DashboardUser | undefined }) {
    const userId = user?.id ?? "";
    const [routineRes, activityRes, progressRes] = await Promise.all([
        getActiveRoutine(),
        getWeeklyActivity(userId),
        getWeeklyProgress(userId)
    ]);

    const { routine } = routineRes;
    const { data: activityData } = activityRes;
    const { completed: weeklyCompleted = 0, target: weeklyTarget = 0 } = progressRes;

    return (
        <AthleteDashboardUI
            user={user}
            activityData={activityData}
            weeklyCompleted={weeklyCompleted}
            weeklyTarget={weeklyTarget}
            routine={routine}
        />
    );
}

async function CoachDashboard({ user }: { user: DashboardUser | undefined }) {
    const [statsResult, activityResult] = await Promise.all([
        getCoachStats(),
        getRecentActivity()
    ]);

    const stats = statsResult.success ? statsResult.stats : null;
    const activities = (activityResult.success && activityResult.activities) ? activityResult.activities : [];

    return (
        <CoachDashboardUI
            user={user}
            stats={stats}
            activities={activities}
        />
    );
}

export default async function DashboardPage() {
    const session = await auth();
    const role = session?.user?.role;

    if (role === "coach") {
        return <CoachDashboard user={session?.user} />;
    }
    return <AthleteDashboard user={session?.user} />;
}
