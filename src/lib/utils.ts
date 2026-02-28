import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
export function calculateRealTimeAdjustment(weight: number, rpe: number, targetRpe?: number) {
    const threshold = targetRpe || 8;

    if (rpe <= threshold - 2) {
        return {
            adjustment: 2.5,
            message: `¡Carga ligera detectada (RPE ${rpe})! Prueba subir +2.5kg en la próxima serie.`
        };
    } else if (rpe >= threshold + 1) {
        return {
            adjustment: 0,
            message: `Esfuerzo alto (RPE ${rpe}). Mantén el peso y enfócate en la técnica.`
        };
    }

    return null;
}
