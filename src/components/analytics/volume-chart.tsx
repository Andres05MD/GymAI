"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface VolumeChartProps {
    data: { name: string; value: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="glass-card border-white/10 opacity-50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm text-zinc-400 uppercase tracking-wider">Volumen Semanal</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-xs text-zinc-600">
                    No hay suficientes datos recientes.
                </CardContent>
            </Card>
        );
    }

    const max = Math.max(...data.map(d => d.value));

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm text-zinc-400 uppercase tracking-wider font-bold">Volumen Semanal (Sets)</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                {data.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-white font-medium">{item.name}</span>
                            <span className="text-zinc-500">{item.value} sets</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 group-hover:bg-red-400"
                                style={{ width: `${(item.value / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
