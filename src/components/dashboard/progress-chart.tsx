"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

export function ProgressChart({ completed = 0, target = 3 }: { completed?: number, target?: number }) {
    const percentage = Math.min(Math.round((completed / target) * 100), 100);
    const data = [
        { name: "Completado", value: percentage, color: "#ef4444" },
        { name: "Restante", value: 100 - percentage, color: "#262626" },
    ];

    return (
        <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={10}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label
                            value={`${percentage}%`}
                            position="center"
                            fill="white"
                            style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                fontFamily: 'var(--font-geist-sans)',
                            }}
                        />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 text-xs font-medium text-neutral-400 text-center">
                Objetivo Semanal ({completed}/{target})
            </div>
        </div>
    );
}
