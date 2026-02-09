"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, AlertCircle, Lightbulb, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { analyzeAthleteProgress } from "@/actions/analytics-actions";
import { cn } from "@/lib/utils";

interface CoachAIAnalysisProps {
    athleteId: string;
}

interface AlertItem {
    type: string;
    message: string;
    severity: "high" | "medium" | "low";
}

interface AnalysisResult {
    alerts: AlertItem[];
    suggestions: string[];
}

export function CoachAIAnalysis({ athleteId }: CoachAIAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await analyzeAthleteProgress(athleteId);
            if (res.success) {
                // Validación básica de tipos al recibir respuesta
                const alerts = (res.alerts || []) as AlertItem[];
                const suggestions = (res.suggestions || []) as string[];
                setAnalysis({ alerts, suggestions });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-neutral-900 border-neutral-800 lg:col-span-3 overflow-hidden text-white">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between bg-neutral-950/50 pb-4 gap-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500 shrink-0" />
                    <div>
                        <CardTitle className="text-white">Análisis Inteligente</CardTitle>
                        <p className="text-sm text-neutral-400">Motor de detección de patrones y estancamiento.</p>
                    </div>
                </div>
                {!analysis && (
                    <Button onClick={runAnalysis} disabled={loading} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-900/20">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? "Analizando..." : "Analizar Progreso"}
                    </Button>
                )}
            </CardHeader>

            {analysis && (
                <CardContent className="space-y-6 pt-6 animate-in slide-in-from-top-4 fade-in duration-500">
                    {/* Alerts Section */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-400 uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4" /> Alertas
                        </h4>
                        {analysis.alerts.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-400 bg-green-900/10 p-4 rounded-xl border border-green-900/20">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">Todo en orden. No se detectan estancamientos críticos.</span>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {analysis.alerts.map((alert, i) => (
                                    <div key={i} className={cn(
                                        "p-4 rounded-xl border flex items-start gap-4 transition-all hover:scale-[1.01]",
                                        alert.severity === 'high' ? "bg-red-950/30 border-red-500/30 text-red-200 shadow-md shadow-red-900/10" : "bg-yellow-950/30 border-yellow-500/30 text-yellow-200"
                                    )}>
                                        <div className={cn("mt-1 shrink-0 p-1 rounded-full",
                                            alert.severity === 'high' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                                        )}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm leading-none">{alert.type === 'stagnation' ? 'Estancamiento Detectado' : 'Alerta'}</p>
                                            <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-neutral-800" />

                    {/* Suggestions Section */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-400 uppercase tracking-wider">
                            <Lightbulb className="w-4 h-4" /> Sugerencias
                        </h4>
                        <div className="grid gap-2">
                            {analysis.suggestions.map((sug, i) => (
                                <div key={i} className="bg-neutral-800/50 p-3 rounded-lg text-sm text-neutral-300 border border-neutral-800">
                                    {sug}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)} className="text-neutral-500 hover:text-white">
                            Cerrar Análisis
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
