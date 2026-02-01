"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, AlertCircle, Lightbulb, Loader2 } from "lucide-react";
import { analyzeAthleteProgress } from "@/actions/analytics-actions";
import { cn } from "@/lib/utils";

interface CoachAIAnalysisProps {
    athleteId: string;
}

export function CoachAIAnalysis({ athleteId }: CoachAIAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<{ alerts: any[], suggestions: string[] } | null>(null);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await analyzeAthleteProgress(athleteId);
            if (res.success) {
                setAnalysis({ alerts: res.alerts, suggestions: res.suggestions });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-neutral-900 border-neutral-800 lg:col-span-3 overflow-hidden text-white">
            <CardHeader className="flex flex-row items-center justify-between bg-neutral-950/50 pb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    <div>
                        <CardTitle className="text-white">Análisis Inteligente</CardTitle>
                        <p className="text-sm text-neutral-400">Motor de detección de patrones y estancamiento.</p>
                    </div>
                </div>
                {!analysis && (
                    <Button onClick={runAnalysis} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Analizar Progreso
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
                            <p className="text-sm text-neutral-500 italic">No se detectaron problemas críticos.</p>
                        ) : (
                            <div className="grid gap-3">
                                {analysis.alerts.map((alert, i) => (
                                    <div key={i} className={cn(
                                        "p-4 rounded-xl border flex items-start gap-4",
                                        alert.severity === 'high' ? "bg-red-900/20 border-red-900/50 text-red-200" : "bg-yellow-900/20 border-yellow-900/50 text-yellow-200"
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0",
                                            alert.severity === 'high' ? "bg-red-500" : "bg-yellow-500"
                                        )} />
                                        <span>{alert.message}</span>
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
