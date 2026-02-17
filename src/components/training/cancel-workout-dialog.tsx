"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CancelWorkoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function CancelWorkoutDialog({ open, onOpenChange, onConfirm }: CancelWorkoutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-950 text-white sm:max-w-[400px] w-[95vw] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border border-white/5 gap-0">
                <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center space-y-6">
                    {/* Visual Icon Header */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="absolute -inset-4 bg-red-500/5 blur-2xl rounded-full -z-10 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <DialogHeader>
                            <DialogTitle className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white text-center">
                                ¿Abandonar Sesión?
                            </DialogTitle>
                            <DialogDescription className="text-neutral-400 text-center text-sm md:text-base leading-relaxed max-w-[280px] mx-auto">
                                Estás a punto de cancelar tu rutina. Todo el progreso registrado <span className="text-red-500 font-bold uppercase">se borrará permanentemente</span>.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="p-4 bg-neutral-900/30 border-t border-white/5 flex flex-col gap-3">
                    <Button
                        onClick={onConfirm}
                        className="w-full h-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black italic text-lg shadow-lg shadow-red-900/40 transition-all active:scale-[0.98] group"
                    >
                        <XCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                        SÍ, CANCELAR RUTINA
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full h-12 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-colors"
                    >
                        CONTINUAR ENTRENANDO
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
