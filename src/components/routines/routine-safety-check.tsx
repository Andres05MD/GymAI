"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle, Info } from "lucide-react";
import { analyzeRoutineSafety } from "@/actions/ai-actions";
import { cn } from "@/lib/utils";

export function RoutineSafetyCheck({ routine, athleteId }: { routine: any, athleteId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await analyzeRoutineSafety(routine, athleteId);
            if (res.success) {
                setAnalysis(res.analysis);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-yellow-600/30 text-yellow-500 hover:bg-yellow-950/20 bg-transparent">
                    <ShieldAlert className="w-4 h-4" />
                    Check Seguridad IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-neutral-900 border-neutral-800 text-white w-[95vw] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                        Análisis de Seguridad IA
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Validación de riesgos contra el historial clínico.
                    </DialogDescription>
                </DialogHeader>

                {!analysis ? (
                    <div className="py-8 text-center space-y-6">
                        <div className="bg-neutral-800/50 p-4 rounded-xl text-sm text-neutral-300 border border-neutral-800">
                            <p>La IA analizará:</p>
                            <ul className="list-disc list-inside mt-2 text-left space-y-1 text-neutral-400">
                                <li>Volumen excesivo para lesiones</li>
                                <li>Ejercicios contraindicados</li>
                                <li>Desequilibrios musculares</li>
                            </ul>
                        </div>
                        <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                            {loading ? "Analizando..." : "Ejecutar Análisis de Seguridad"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Score */}
                        <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                            <span className="font-bold text-neutral-300 text-sm uppercase tracking-wider">Nivel de Seguridad</span>
                            <div className={cn("text-3xl font-black",
                                analysis.score > 80 ? "text-green-500" : analysis.score > 60 ? "text-yellow-500" : "text-red-500"
                            )}>
                                {analysis.score}<span className="text-sm text-neutral-600">/100</span>
                            </div>
                        </div>

                        {/* Warnings */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider mb-2">Hallazgos</h4>
                            {(!analysis.warnings || analysis.warnings.length === 0) ? (
                                <div className="text-green-500 flex items-center gap-3 text-sm bg-green-900/10 p-4 rounded-xl border border-green-900/30">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="font-medium">No se detectaron riesgos graves.</span>
                                </div>
                            ) : (
                                analysis.warnings.map((w: any, i: number) => (
                                    <div key={i} className={cn("p-4 rounded-xl border text-sm",
                                        w.severity === 'high' ? "bg-red-900/10 border-red-900/30 text-red-200" : "bg-yellow-900/10 border-yellow-900/30 text-yellow-200"
                                    )}>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold mb-1">{w.title}</p>
                                                <p className="opacity-80 leading-relaxed text-xs">{w.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Recommendation */}
                        {analysis.recommendation && (
                            <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 text-sm">
                                <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-2 uppercase text-xs tracking-wider">
                                    <Info className="w-4 h-4" /> Recomendación IA
                                </h4>
                                <p className="text-blue-100/80 leading-relaxed">{analysis.recommendation}</p>
                            </div>
                        )}

                        <Button onClick={() => setAnalysis(null)} variant="ghost" className="w-full text-neutral-500 hover:text-white hover:bg-white/5">
                            Realizar nuevo análisis
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
