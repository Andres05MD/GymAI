"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, Calendar, Scale, AlignLeft, Info } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MeasurementHistoryItem {
    id: string;
    date: string;
    weight?: number;
    notes?: string;
    [key: string]: any;
}

interface MeasurementHistorySheetProps {
    history: MeasurementHistoryItem[];
}

export function MeasurementHistorySheet({ history }: MeasurementHistorySheetProps) {
    const [open, setOpen] = useState(false);

    // Filter out only the keys that represent actual measurements
    const measurementKeys = [
        "chest", "waist", "hips", "shoulders", "glutes", "neck",
        "bicepsLeft", "bicepsRight", "forearmsLeft", "forearmsRight",
        "quadsLeft", "quadsRight", "calvesLeft", "calvesRight"
    ];

    const labels: Record<string, string> = {
        chest: "Torso", hips: "Cadera", waist: "Cintura", shoulders: "Hombros", glutes: "Glúteos", neck: "Cuello",
        bicepsLeft: "Bíceps (I)", bicepsRight: "Bíceps (D)", forearmsLeft: "Antebrazo (I)", forearmsRight: "Antebrazo (D)",
        quadsLeft: "Muslo (I)", quadsRight: "Muslo (D)", calvesLeft: "Gemelo (I)", calvesRight: "Gemelo (D)",
    };

    // Sort history by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="h-10 px-4 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest italic group shrink-0">
                    <History className="w-4 h-4 mr-2 text-red-500 group-hover:-rotate-12 transition-transform" />
                    Historial
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-screen sm:max-w-md bg-black border-l border-white/10 p-0 overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-neutral-950 -z-10" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[80px] pointer-events-none -z-10" />

                <SheetHeader className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shrink-0">
                            <History className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-black text-white tracking-tighter uppercase italic text-left">
                                Bitácora Biométrica
                            </SheetTitle>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                                Registro histórico de cambios
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {sortedHistory.length > 0 ? (
                        <div className="relative border-l-2 border-white/5 ml-4 space-y-10 pb-12">
                            {sortedHistory.map((item, index) => {
                                const itemDate = new Date(item.date);
                                // Determine which measurements were actually logged in this entry
                                const loggedMeasurements = measurementKeys.filter(key => item[key] !== undefined && item[key] !== null);

                                return (
                                    <div key={item.id} className="relative pl-6">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-red-500 rounded-full" />
                                        
                                        <div className="flex flex-col gap-4">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-red-500" />
                                                <span className="text-sm font-black text-red-500 uppercase tracking-widest italic">
                                                    {format(itemDate, "d 'de' MMMM, yyyy", { locale: es })}
                                                </span>
                                            </div>

                                            <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                                
                                                {/* Weight Section */}
                                                {item.weight && (
                                                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                                        <div className="flex items-center gap-2">
                                                            <Scale className="w-4 h-4 text-neutral-500" />
                                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Peso / Masa Corporal</span>
                                                        </div>
                                                        <span className="font-black text-white text-xl italic tracking-tighter">
                                                            {item.weight} <span className="text-[10px] text-neutral-600">KG</span>
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Measurements Grid */}
                                                {loggedMeasurements.length > 0 && (
                                                    <div className="p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <AlignLeft className="w-4 h-4 text-neutral-500" />
                                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Perímetros (CM)</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {loggedMeasurements.map(key => (
                                                                <div key={key} className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center group">
                                                                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">{labels[key] || key}</span>
                                                                    <span className="text-sm font-black text-white italic group-hover:text-red-500 transition-colors uppercase">{item[key]}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notes Section */}
                                                {item.notes && (
                                                    <div className="p-4 bg-red-600/5 border-t border-red-500/10">
                                                        <div className="flex items-start gap-2">
                                                            <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                            <p className="text-xs text-neutral-400 font-bold leading-relaxed">{item.notes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {!item.weight && loggedMeasurements.length === 0 && !item.notes && (
                                                     <div className="p-4 flex items-center gap-2">
                                                         <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Entrada vacía</span>
                                                     </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                            <History className="w-12 h-12 text-neutral-600" />
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Sin registros históricos</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
