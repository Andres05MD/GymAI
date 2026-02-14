import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 bg-neutral-800" />
                    <Skeleton className="h-4 w-48 bg-neutral-900" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-full bg-neutral-800" />
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-3xl bg-neutral-900" />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-80 rounded-3xl bg-neutral-900" />
                <div className="space-y-6">
                    <Skeleton className="h-48 rounded-3xl bg-neutral-900" />
                    <Skeleton className="h-32 rounded-3xl bg-neutral-900" />
                </div>
            </div>
        </div>
    );
}
