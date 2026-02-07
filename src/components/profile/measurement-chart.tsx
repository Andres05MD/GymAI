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
        <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
                <div className="flex gap-2">
                    {metrics.map(m => (
                        <Badge key={m.key} style={{ backgroundColor: m.color + "20", color: m.color }} variant="outline" className="border-0">
                            {m.label}
                        </Badge>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#666"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#666"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Legend />
                            {metrics.map(m => (
                                <Line
                                    key={m.key}
                                    type="monotone"
                                    dataKey={m.key}
                                    stroke={m.color}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#000", strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                    name={m.label}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
