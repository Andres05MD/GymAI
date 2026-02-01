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
import { generateSmartWarmup } from "@/actions/ai-actions";
import { Sparkles, Loader2, Play, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function WarmupGenerator() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);

    const handleGenerate = async () => {
        setLoading(true);
        // Reset plan
        setPlan(null);

        try {
            // Simulamos un pequeño delay para dar sensación de "pensando"
            await new Promise(r => setTimeout(r, 1500));

            const result = await generateSmartWarmup({});
            if (result.success) {
                setPlan(result.warmupPlan);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary mb-4 w-full">
                    <Sparkles className="h-4 w-4" />
                    Generar Calentamiento Inteligente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Coach Warm-up
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Generando una rutina de activación basada en tus lesiones y el entrenamiento de hoy.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {!plan && !loading && (
                        <div className="text-center py-8 space-y-4">
                            <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Sparkles className="h-10 w-10 text-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-zinc-300">
                                    Analizaremos tu perfil en busca de <strong>lesiones</strong> y adaptaremos el calentamiento para prevenir molestias.
                                </p>
                            </div>
                            <Button onClick={handleGenerate} className="bg-primary text-black font-bold">
                                Comenzar Análisis
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <p className="text-sm font-medium animate-pulse text-zinc-300">
                                Consultando base de datos de fisioterapia...
                            </p>
                        </div>
                    )}

                    {plan && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs text-primary font-medium flex items-start gap-2">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                    {plan.summary}
                                </p>
                            </div>

                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-3">
                                    {plan.exercises.map((ex: any, i: number) => (
                                        <Card key={i} className="bg-zinc-900/50 border-white/5 overflow-hidden">
                                            <div className="h-1 w-full bg-gradient-to-r from-primary/50 to-transparent" />
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                                                            {ex.focus}
                                                        </span>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-white/10 text-white font-mono">
                                                        {ex.duration || ex.sets}
                                                    </Badge>
                                                </div>
                                                <Separator className="bg-white/5 my-2" />
                                                <p className="text-xs text-zinc-400 italic">
                                                    "{ex.reason}"
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>

                            <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={() => setIsOpen(false)}>
                                <Play className="mr-2 h-4 w-4" /> Empezar Entrenamiento
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
