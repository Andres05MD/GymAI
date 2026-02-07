"use client";

import { useQuery } from "@tanstack/react-query";
import { getCoachStats, getRecentActivity } from "@/actions/coach-stats-actions";

/**
 * Hook centralizado para datos del Coach Dashboard.
 * Evita prop-drilling y llamadas duplicadas usando React Query.
 * 
 * Los datos se cachean por 1 minuto (sincronizado con unstable_cache del servidor).
 */
export function useCoachDashboard() {
    const statsQuery = useQuery({
        queryKey: ["coach-stats"],
        queryFn: async () => {
            const result = await getCoachStats();
            if (!result.success) throw new Error(result.error || "Error desconocido");
            return result.stats;
        },
        staleTime: 60 * 1000, // Sincronizado con server cache (60s)
    });

    const activityQuery = useQuery({
        queryKey: ["recent-activity"],
        queryFn: async () => {
            const result = await getRecentActivity();
            if (!result.success) throw new Error(result.error || "Error desconocido");
            return result.activities;
        },
        staleTime: 30 * 1000, // Sincronizado con server cache (30s)
    });

    return {
        stats: statsQuery.data,
        activities: activityQuery.data || [],
        isLoading: statsQuery.isLoading || activityQuery.isLoading,
        isError: statsQuery.isError || activityQuery.isError,
        error: statsQuery.error || activityQuery.error,
        refetch: () => {
            statsQuery.refetch();
            activityQuery.refetch();
        },
    };
}

/**
 * Hook para estadísticas del coach (solo stats, sin actividad).
 * Útil para componentes que solo necesitan los KPIs.
 */
export function useCoachStats() {
    return useQuery({
        queryKey: ["coach-stats"],
        queryFn: async () => {
            const result = await getCoachStats();
            if (!result.success) throw new Error(result.error || "Error desconocido");
            return result.stats;
        },
        staleTime: 60 * 1000,
    });
}
