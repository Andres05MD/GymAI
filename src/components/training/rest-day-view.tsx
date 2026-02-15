"use client";

import { Moon, Coffee, Heart, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RestDayViewProps {
    dayName: string;
}

export function RestDayView({ dayName }: RestDayViewProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 text-center animate-in fade-in zoom-in duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative space-y-8 max-w-lg w-full">
                {/* Icon Circle */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-neutral-900 border border-neutral-800 rounded-full shadow-2xl" />
                    <div className="absolute inset-2 border border-neutral-800/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                    <Moon className="w-12 h-12 text-blue-400 relative z-10 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
                        <Calendar className="w-3.5 h-3.5" />
                        Día de Descanso
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        Hoy es <span className="text-blue-400">{dayName}</span>
                    </h1>

                    <p className="text-neutral-400 text-lg md:text-xl font-medium leading-relaxed max-w-sm mx-auto">
                        Tu cuerpo necesita recuperarse para rendir al máximo. Disfruta de tu descanso, guerrero.
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-3xl backdrop-blur-sm group hover:border-neutral-700 transition-colors">
                        <Coffee className="w-6 h-6 text-neutral-500 mb-3 mx-auto group-hover:text-amber-400 transition-colors" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Recarga</h3>
                        <p className="text-neutral-500 text-xs mt-1">Hidratación y nutrición óptima</p>
                    </div>
                    <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-3xl backdrop-blur-sm group hover:border-neutral-700 transition-colors">
                        <Heart className="w-6 h-6 text-neutral-500 mb-3 mx-auto group-hover:text-red-500 transition-colors" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Salud</h3>
                        <p className="text-neutral-500 text-xs mt-1">Descansa al menos 8 horas</p>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <Link href="/dashboard">
                        <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-lg shadow-xl shadow-white/5 transition-transform active:scale-95">
                            VOLVER AL PANEL
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        onClick={() => router.push('/train/log')}
                        className="text-neutral-500 hover:text-white font-bold"
                    >
                        ¿Entrenaste algo más? Registrar manualmente
                    </Button>
                </div>
            </div>
        </div>
    );
}
