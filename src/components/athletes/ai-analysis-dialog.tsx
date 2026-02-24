"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { BrainCircuit, Loader2 } from "lucide-react";
import { analyzeAthleteProgress } from "@/actions/analytics-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface AIAnalysisDialogProps {
    athleteId: string;
    athleteName: string;
}

export function AIAnalysisDialog({ athleteId, athleteName }: AIAnalysisDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);

        const result = await analyzeAthleteProgress(athleteId);

        if (result.success && result.analysis) {
            setAnalysis(result.analysis);
        } else {
            setError(result.error || "Error desconocido");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <BrainCircuit className="h-4 w-4" /> Analizar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Análisis IA: {athleteName}</DialogTitle>
                    <DialogDescription>
                        Evaluación de rendimiento basada en logs recientes.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!analysis && !loading && !error && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                Genera un reporte de progreso instantáneo usando los datos de entrenamiento.
                            </p>
                            <Button onClick={handleAnalyze}>
                                <BrainCircuit className="mr-2 h-4 w-4" /> Generar Informe
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Procesando historial...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {analysis && (
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                            <div className="prose prose-sm dark:prose-invert">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
