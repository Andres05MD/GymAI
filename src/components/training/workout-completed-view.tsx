"use client";

import { Trophy, CheckCircle2, ArrowLeft, Calendar, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function WorkoutCompletedView() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 text-center animate-in fade-in zoom-in duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative space-y-8 max-w-lg w-full">
                {/* Icon Circle */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-neutral-900 border border-neutral-800 rounded-full shadow-2xl" />
                    <div className="absolute inset-2 border border-green-500/20 rounded-full border-dashed animate-[spin_15s_linear_infinite]" />
                    <Trophy className="w-12 h-12 text-amber-400 relative z-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-[0.2em]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sesión Finalizada
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        ¡Gran <span className="text-green-400">Trabajo</span>!
                    </h1>

                    <p className="text-neutral-400 text-lg md:text-xl font-medium leading-relaxed max-w-sm mx-auto">
                        Has completado tu rutina de hoy. Es momento de descansar y permitir que tus músculos se recuperen hasta mañana.
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-lg shadow-xl shadow-white/5 transition-transform active:scale-95">
                            <LayoutDashboard className="w-5 h-5 mr-2" />
                            VOLVER AL PANEL
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        onClick={() => router.push('/history')}
                        className="text-neutral-500 hover:text-white font-bold"
                    >
                        Ver mi historial de hoy
                    </Button>
                </div>
            </div>
        </div>
    );
}
