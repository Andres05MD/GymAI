"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

const defaultData = [
    { name: "Lun", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Mié", total: 0 },
    { name: "Jue", total: 0 },
    { name: "Vie", total: 0 },
    { name: "Sáb", total: 0 },
    { name: "Dom", total: 0 },
];

export function ActivityChart({ data = defaultData }: { data?: any[] }) {
    return (
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data}>
                    <Tooltip
                        cursor={{ fill: '#262626', opacity: 0.4, radius: 8 }}
                        contentStyle={{
                            backgroundColor: '#171717',
                            border: '1px solid #404040',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                    />
                    <XAxis
                        dataKey="name"
                        stroke="#525252"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.total > 0 ? "#ef4444" : "#262626"}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
