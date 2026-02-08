import { getAllAthletes } from "@/actions/coach-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search, Users, Target, Calendar, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function AthletesPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        redirect("/dashboard");
    }

    const { athletes } = await getAllAthletes();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-6">
                <div>
                    <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight">Mis Atletas</h1>
                    <p className="text-xs sm:text-base text-neutral-400">Gestiona y supervisa el progreso de cada miembro.</p>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-72 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Buscar atleta..."
                        className="pl-11 h-12 bg-neutral-900 border-neutral-800 text-white rounded-full focus-visible:ring-red-500"
                    />
                </div>
            </div>

            {/* Athletes Grid */}
            {!athletes || athletes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800">
                    <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-neutral-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sin atletas registrados</h3>
                    <p className="text-neutral-500 max-w-md mb-6">
                        Cuando los atletas se registren con tu código de coach, aparecerán aquí automáticamente.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {athletes.map((athlete: any) => (
                        <Link
                            key={athlete.id}
                            href={`/athletes/${athlete.id}`}
                            className="group"
                        >
                            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 hover:-translate-y-1">
                                {/* Header with Avatar */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14 border-2 border-neutral-800 group-hover:border-red-600/50 transition-colors">
                                            <AvatarImage src={athlete.image} />
                                            <AvatarFallback className="bg-neutral-800 text-white font-bold text-lg">
                                                {athlete.name?.[0]?.toUpperCase() || "A"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-white text-lg group-hover:text-red-500 transition-colors">
                                                {athlete.name}
                                            </h3>
                                            <p className="text-neutral-500 text-xs truncate max-w-[150px]">
                                                {athlete.email}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/5">
                                        <Target className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Objetivo</p>
                                        <p className="text-xs text-white font-bold truncate">
                                            {athlete.goal || "—"}
                                        </p>
                                    </div>
                                    <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/5">
                                        <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Miembro</p>
                                        <p className="text-xs text-white font-bold">
                                            {athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString('es', { month: 'short', year: '2-digit' }) : "—"}
                                        </p>
                                    </div>
                                    <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/5">
                                        <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Estado</p>
                                        <p className="text-xs text-green-500 font-bold">Activo</p>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="pt-4 border-t border-neutral-800">
                                    <Button
                                        variant="ghost"
                                        className="w-full h-10 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 font-bold text-sm"
                                    >
                                        Ver Perfil Completo
                                    </Button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
