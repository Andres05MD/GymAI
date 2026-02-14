import { Skeleton } from "@/components/ui/skeleton";

export default function AthletesLoading() {
    return (
        <div className="space-y-8 ">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-neutral-800" />
                    <Skeleton className="h-4 w-64 bg-neutral-900" />
                </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-56 rounded-3xl bg-neutral-900" />
                ))}
            </div>
        </div>
    );
}
