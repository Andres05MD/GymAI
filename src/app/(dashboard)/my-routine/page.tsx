import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Dumbbell, Play } from "lucide-react";
import Link from "next/link";

export default async function MyRoutinePage() {
    const session = await auth();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Mi Rutina Actual</h2>
                    <p className="text-neutral-400">Plan de entrenamiento asignado.</p>
                </div>
                <Link href="/train">
                    <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/20 gap-2">
                        <Play className="h-5 w-5 fill-current" />
                        Iniciar Sesión
                    </Button>
                </Link>
            </div>

            {/* Info Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xl">3</div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Frecuencia</p>
                        <p className="text-white font-bold">Días / Semana</p>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xl">16</div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Volumen</p>
                        <p className="text-white font-bold">Ejercicios Totales</p>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center font-bold text-xl">W4</div>
                    <div>
                        <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider">Progreso</p>
                        <p className="text-white font-bold">Semana 4</p>
                    </div>
                </div>
            </div>

            {/* Rutina Activa */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-white">Hipertrofia - Fase 1</h3>
                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                                Activa
                            </span>
                        </div>
                        <p className="text-neutral-400 text-sm">Asignada por <span className="text-white font-medium">Coach Demo</span></p>
                    </div>
                </div>

                <div className="divide-y divide-neutral-800">
                    {[
                        { name: "Día 1 - Pecho y Tríceps", exercises: 5, duration: "45-60 min" },
                        { name: "Día 2 - Espalda y Bíceps", exercises: 6, duration: "50-65 min" },
                        { name: "Día 3 - Piernas", exercises: 5, duration: "55-70 min" },
                    ].map((day, index) => (
                        <div
                            key={index}
                            className="p-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 bg-black border border-neutral-800 rounded-2xl flex items-center justify-center font-black text-neutral-500 group-hover:border-red-500 group-hover:text-white transition-all">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">{day.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                                        <span className="flex items-center gap-1.5">
                                            <Dumbbell className="h-3.5 w-3.5" /> {day.exercises} ejercicios
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> {day.duration}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" className="rounded-full hover:bg-white hover:text-black">
                                Ver Detalles
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
