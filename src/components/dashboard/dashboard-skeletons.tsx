import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton para las tarjetas de estadísticas del dashboard.
 * Muestra 3 placeholders animados mientras cargan los datos.
 */
export function StatsCardsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <Skeleton
                    key={i}
                    className="h-40 rounded-4xl bg-neutral-800"
                />
            ))}
        </div>
    );
}

/**
 * Skeleton para la sección de actividad reciente.
 * Muestra 5 filas de placeholder mientras cargan los datos.
 */
export function RecentActivitySkeleton() {
    return (
        <div className="p-6 rounded-4xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-40 bg-neutral-800" />
                <Skeleton className="h-4 w-24 bg-neutral-800" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 bg-neutral-800" />
                            <Skeleton className="h-3 w-24 bg-neutral-800" />
                        </div>
                        <Skeleton className="h-4 w-16 bg-neutral-800" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton para gráficos de actividad.
 */
export function ChartSkeleton() {
    return (
        <div className="p-6 rounded-4xl bg-neutral-900 border border-neutral-800">
            <Skeleton className="h-6 w-40 bg-neutral-800 mb-4" />
            <Skeleton className="h-[250px] w-full bg-neutral-800 rounded-xl" />
        </div>
    );
}

/**
 * Skeleton para la tarjeta de rutina activa del atleta.
 */
export function ActiveRoutineSkeleton() {
    return (
        <div className="p-6 rounded-4xl bg-neutral-900 border border-neutral-800">
            <Skeleton className="h-6 w-48 bg-neutral-800 mb-4" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-neutral-800" />
                <Skeleton className="h-4 w-3/4 bg-neutral-800" />
                <Skeleton className="h-12 w-full bg-neutral-800 rounded-full mt-4" />
            </div>
        </div>
    );
}
