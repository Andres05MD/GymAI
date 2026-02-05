import { Skeleton } from "@/components/ui/skeleton";

export default function ExercisesLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 bg-neutral-800" />
                    <Skeleton className="h-4 w-72 bg-neutral-900" />
                </div>
                <Skeleton className="h-10 w-40 rounded-full bg-neutral-800" />
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl bg-neutral-900" />
                ))}
            </div>
        </div>
    );
}
