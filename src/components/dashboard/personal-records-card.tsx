"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Dumbbell } from "lucide-react";

interface PersonalRecordsCardProps {
    prs: { exercise: string; weight: number; date: string }[];
}

export function PersonalRecordsCard({ prs }: PersonalRecordsCardProps) {
    if (!prs || prs.length === 0) {
        return (
            <Card className="glass-card border-white/10 opacity-60">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Mejores Marcas</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center">Registra entrenamientos para ver tus récords.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Mejores Marcas</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {prs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/50 border border-white/5 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Dumbbell className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{pr.exercise}</p>
                                <p className="text-[10px] text-neutral-500 mt-1">{pr.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-primary leading-none">{pr.weight} <span className="text-[10px] font-normal text-neutral-400">kg</span></p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
