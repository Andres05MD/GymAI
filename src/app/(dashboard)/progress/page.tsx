import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Scale, TrendingUp, Trophy, Ruler } from "lucide-react";

export default async function ProgressPage() {
    const session = await auth();

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Progreso</h1>
                <p className="text-muted-foreground">Análisis de tu evolución física y rendimiento.</p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Scale className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-3xl font-black text-white">72.5</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Peso (kg)</p>
                        <p className="text-xs text-green-500 mt-1">-2.5 kg desde inicio</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Flame className="h-8 w-8 text-orange-500 mb-2" />
                        <p className="text-3xl font-black text-white">18%</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Grasa Est.</p>
                        <p className="text-xs text-green-500 mt-1">-3% desde inicio</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                        <p className="text-3xl font-black text-white">7</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">PRs Este Mes</p>
                        <p className="text-xs text-primary mt-1">¡Récord personal!</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-3xl font-black text-white">+15%</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Volumen</p>
                        <p className="text-xs text-green-500 mt-1">vs mes anterior</p>
                    </CardContent>
                </Card>
            </div>

            {/* Medidas Corporales */}
            <Card className="glass-card border-white/10">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-bold text-white">Medidas Corporales</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: "Pecho", value: "102", change: "+2" },
                            { label: "Cintura", value: "82", change: "-3" },
                            { label: "Cadera", value: "98", change: "0" },
                            { label: "Bíceps", value: "38", change: "+1.5" },
                            { label: "Cuádriceps", value: "58", change: "+2" },
                            { label: "Pantorrillas", value: "38", change: "+0.5" },
                            { label: "Hombros", value: "118", change: "+1" },
                            { label: "Antebrazos", value: "30", change: "+0.5" },
                        ].map((m) => (
                            <div key={m.label} className="text-center p-4 bg-zinc-900/50 rounded-xl">
                                <p className="text-2xl font-black text-white">{m.value}<span className="text-sm text-zinc-500">cm</span></p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
                                <p className={`text-xs mt-1 ${parseFloat(m.change) > 0 ? 'text-green-500' : parseFloat(m.change) < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                                    {parseFloat(m.change) > 0 ? '+' : ''}{m.change} cm
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Records Personales */}
            <Card className="glass-card border-white/10">
                <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg font-bold text-white">Records Personales (PRs)</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {[
                        { exercise: "Press de Banca", weight: "100 kg", reps: "1RM", date: "28 Ene" },
                        { exercise: "Sentadilla", weight: "140 kg", reps: "1RM", date: "26 Ene" },
                        { exercise: "Peso Muerto", weight: "160 kg", reps: "1RM", date: "22 Ene" },
                        { exercise: "Press Militar", weight: "60 kg", reps: "1RM", date: "20 Ene" },
                    ].map((pr, i) => (
                        <div key={i} className="p-4 flex items-center justify-between border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{pr.exercise}</h4>
                                    <p className="text-xs text-zinc-500">{pr.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl text-primary">{pr.weight}</p>
                                <p className="text-xs text-zinc-500">{pr.reps}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
