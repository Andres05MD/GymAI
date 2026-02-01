"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, ArrowRightLeft, Check, Loader2 } from "lucide-react";
import { suggestAlternativeExercise } from "@/actions/ai-actions";
import { Card, CardContent } from "@/components/ui/card";

interface ExerciseSwapDialogProps {
    currentExerciseName: string;
    onSwap: (newName: string) => void;
}

export function ExerciseSwapDialog({ currentExerciseName, onSwap }: ExerciseSwapDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleOpen = async (open: boolean) => {
        setIsOpen(open);
        if (open && alternatives.length === 0) {
            setLoading(true);
            try {
                const result = await suggestAlternativeExercise(currentExerciseName, "busy");
                if (result.success) {
                    setAlternatives(result.data || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="Máquina ocupada? Busca alternativa">
                    <ArrowRightLeft className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        Alternativas IA
                    </DialogTitle>
                    <p className="text-sm text-zinc-400">
                        ¿Máquina ocupada? Reemplaza <strong>{currentExerciseName}</strong> con una variante biomecánicamente similar.
                    </p>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {loading ? (
                        <div className="py-8 text-center space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-xs text-zinc-500 animate-pulse">Analizando vectores de fuerza...</p>
                        </div>
                    ) : alternatives.length > 0 ? (
                        alternatives.map((alt, idx) => (
                            <Card
                                key={idx}
                                className="bg-zinc-900 border-white/5 hover:border-primary/50 cursor-pointer transition-colors group"
                                onClick={() => {
                                    onSwap(alt.name);
                                    setIsOpen(false);
                                }}
                            >
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{alt.name}</h4>
                                        <p className="text-xs text-zinc-500">{alt.reason}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                                        <Check className="h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-zinc-500 py-4">No se encontraron alternativas directas.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
