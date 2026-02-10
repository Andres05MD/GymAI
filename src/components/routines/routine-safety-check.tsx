"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle, Info, CheckCircle2, Activity } from "lucide-react";
import { analyzeRoutineSafety } from "@/actions/ai-actions";
import { cn } from "@/lib/utils";

export function RoutineSafetyCheck({ routine, athleteId }: { routine: any, athleteId?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await analyzeRoutineSafety(routine, athleteId || "");
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
                <Button variant="outline" className="h-10 sm:h-12 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white gap-1 sm:gap-2 transition-all group px-3 sm:px-4 rounded-full">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all" />
                    <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">AUDITORÍA IA</span>
                    <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider">IA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-neutral-950 border-neutral-800 text-white w-[95vw] rounded-3xl p-0 overflow-hidden shadow-2xl shadow-black/50">
                <div className="p-6 border-b border-neutral-800 bg-neutral-900/30">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            Auditoría de Seguridad
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Análisis biomecánico y de volumen vs. Lesiones.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    {!analysis ? (
                        <div className="text-center space-y-6">
                            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-dashed border-neutral-800">
                                <Activity className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
                                <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
                                    La IA cruzará esta rutina con el historial clínico del atleta para detectar:
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {["Sobrecarga Articular", "Volumen Excesivo", "Ejercicios Contraindicados"].map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-bold bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md border border-neutral-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                                {loading ? "Analizando Rutina..." : "Ejecutar Análisis"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Score Card */}
                            <div className="relative overflow-hidden bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-neutral-400 text-xs uppercase tracking-widest">Safety Score</span>
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase",
                                        analysis.score > 80 ? "bg-emerald-500/10 text-emerald-500" : analysis.score > 60 ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"
                                    )}>
                                        {analysis.score > 80 ? "Excelente" : analysis.score > 60 ? "Aceptable" : "Riesgo Alto"}
                                    </span>
                                </div>
                                <div className="flex items-end gap-1 mb-3">
                                    <span className={cn("text-5xl font-black tracking-tighter leading-none",
                                        analysis.score > 80 ? "text-white" : analysis.score > 60 ? "text-yellow-400" : "text-red-400"
                                    )}>{analysis.score}</span>
                                    <span className="text-lg font-bold text-neutral-600 mb-1">/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000 ease-out rounded-full",
                                            analysis.score > 80 ? "bg-emerald-500" : analysis.score > 60 ? "bg-yellow-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${analysis.score}%` }}
                                    />
                                </div>
                            </div>

                            {/* Warnings List */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider pl-1">Reporte de Riesgos</h4>
                                {(!analysis.warnings || analysis.warnings.length === 0) ? (
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-linear-to-br from-emerald-950/30 to-emerald-900/10 border border-emerald-900/50">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-emerald-100 text-sm">Rutina Segura</h5>
                                            <p className="text-emerald-200/60 text-xs mt-1 leading-relaxed">
                                                No se han detectado conflictos con las lesiones reportadas ni volúmenes excesivos.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    analysis.warnings.map((w: any, i: number) => (
                                        <div key={i} className={cn("flex gap-4 p-4 rounded-2xl border transition-all",
                                            w.severity === 'high' ? "bg-red-950/20 border-red-900/50 hover:bg-red-950/30" : "bg-yellow-950/20 border-yellow-900/50 hover:bg-yellow-950/30"
                                        )}>
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                                                w.severity === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                            )}>
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h5 className={cn("font-bold text-sm", w.severity === 'high' ? "text-red-200" : "text-yellow-200")}>{w.title}</h5>
                                                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{w.description}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Recommendation */}
                            {analysis.recommendation && (
                                <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 text-sm flex gap-3">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                    <p className="text-blue-100/80 text-xs leading-relaxed">{analysis.recommendation}</p>
                                </div>
                            )}

                            <Button onClick={() => setAnalysis(null)} variant="ghost" className="w-full text-neutral-500 hover:text-white hover:bg-white/5 text-xs h-8">
                                Nueva Auditoría
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
