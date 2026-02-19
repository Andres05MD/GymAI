"use client";

import { useMemo } from "react";
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
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: format(new Date(item.date), "d MMM", { locale: es })
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Card className="bg-neutral-900/50 backdrop-blur-sm border-neutral-800 rounded-4xl shadow-xl overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 px-6 pt-6">
                    <CardTitle className="text-white text-xl font-black uppercase tracking-tight">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] flex items-center justify-center text-neutral-500 font-bold uppercase text-xs tracking-widest">
                    No hay datos suficientes
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
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                        <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#404040"
                                fontSize={10}
                                fontWeight={700}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#404040"
                                fontSize={10}
                                fontWeight={700}
                                tickLine={false}
                                axisLine={false}
                                dx={-5}
                                domain={['auto', 'auto']}
                                hide={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(10, 10, 10, 0.95)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "16px",
                                    backdropFilter: "blur(12px)",
                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
                                }}
                                itemStyle={{ fontSize: "11px", fontWeight: "700", padding: "2px 0" }}
                                labelStyle={{ color: "#737373", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}
                                cursor={{ stroke: '#404040', strokeWidth: 1 }}
                            />
                            {metrics.map(m => (
                                <Line
                                    key={m.key}
                                    type="monotone"
                                    dataKey={m.key}
                                    stroke={m.color}
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: m.color, stroke: "#0a0a0a", strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: m.color, stroke: "#fff", strokeWidth: 2 }}
                                    name={m.label}
                                    animationDuration={1000}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
