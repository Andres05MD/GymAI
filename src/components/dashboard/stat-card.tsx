import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    label?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    color?: "red" | "green" | "blue" | "yellow" | "neutral";
    className?: string;
}

export function StatCard({
    title,
    value,
    label,
    icon: Icon,
    trend = "neutral",
    trendValue,
    color = "neutral",
    className
}: StatCardProps) {

    const colorStyles = {
        red: "bg-red-500/10 text-red-500",
        green: "bg-emerald-500/10 text-emerald-500",
        blue: "bg-blue-500/10 text-blue-500",
        yellow: "bg-yellow-500/10 text-yellow-500",
        neutral: "bg-neutral-800 text-white",
    };

    const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-neutral-500";
    const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;

    return (
        <div className={cn("p-6 rounded-4xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between h-40 group hover:border-neutral-700 transition-all", className)}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-neutral-400 font-medium text-sm mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", colorStyles[color])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
                {TrendIcon && (
                    <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-full bg-neutral-950", trendColor)}>
                        <TrendIcon className="w-3 h-3 mr-1" />
                        {trendValue}
                    </div>
                )}
                {label && <span className="text-xs text-neutral-500 font-medium">{label}</span>}
            </div>
        </div>
    );
}
