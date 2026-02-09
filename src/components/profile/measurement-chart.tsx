"use client";

import { useMemo, useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MeasurementData {
    date: Date;
    [key: string]: any;
}

interface MeasurementChartProps {
    data: MeasurementData[];
    metrics: { key: string; label: string; color: string }[];
    title: string;
}

export function MeasurementChart({ data, metrics, title }: MeasurementChartProps) {
    // Prevenir problemas de hidratación SSR con Recharts
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: format(new Date(item.date), "d MMM", { locale: es })
        }));
    }, [data]);

    // Mostrar loading mientras se monta el componente
    if (!mounted) {
        return (
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="w-full h-full bg-neutral-800/50 animate-pulse rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-neutral-500">
                    No hay datos suficientes para graficar.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral-900/50 backdrop-blur-sm border-neutral-800 rounded-4xl shadow-xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 px-6 pt-6">
                <CardTitle className="text-white text-xl font-black uppercase tracking-tight">{title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                    {metrics.map(m => (
                        <Badge
                            key={m.key}
                            style={{ backgroundColor: m.color + "15", color: m.color, borderColor: m.color + "30" }}
                            variant="outline"
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                        >
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: m.color }}></span>
                            {m.label}
                        </Badge>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-6">
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#525252"
                                fontSize={11}
                                fontWeight={600}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#525252"
                                fontSize={11}
                                fontWeight={600}
                                tickLine={false}
                                axisLine={false}
                                dx={-5}
                                domain={['auto', 'auto']}
                                hide={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(10, 10, 10, 0.9)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "16px",
                                    backdropFilter: "blur(10px)",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                                }}
                                itemStyle={{ fontSize: "12px", fontWeight: "700" }}
                                labelStyle={{ color: "#737373", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}
                            />
                            {metrics.map(m => (
                                <Line
                                    key={m.key}
                                    type="monotone"
                                    dataKey={m.key}
                                    stroke={m.color}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: m.color, stroke: "#0a0a0a", strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: m.color, stroke: "#fff", strokeWidth: 2 }}
                                    name={m.label}
                                    animationDuration={1500}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
