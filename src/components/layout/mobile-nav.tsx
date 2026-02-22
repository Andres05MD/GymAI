"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, ClipboardList, Dumbbell, BarChart2, History, UserCircle, Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileNavProps {
    role?: string;
}

export function MobileNav({ role }: MobileNavProps) {
    const pathname = usePathname();
    if (pathname === "/train") return null;

    const commonItems = [
        { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    ];

    const coachItems = [
        ...commonItems,
        { label: "Atletas", href: "/athletes", icon: Users },
        { label: "Rutinas", href: "/routines", icon: ClipboardList },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell },
        { label: "Progreso", href: "/progress", icon: BarChart2 },
    ];

    // For coach, limit to 4 items in main bar, maybe put Analytics in "More"?
    // Let's stick to 4 main + More for Coach if needed, or 5.
    // Coach: Home, Athletes, Routines, Exercises, Stats. That's 5. Fits.

    const athleteItems = [
        ...commonItems,
        { label: "Rutina", href: "/my-routine", icon: ClipboardList },
        { label: "Entrenar", href: "/train", icon: Dumbbell },
        { label: "Actividad", href: "/history", icon: History },
        { label: "Avance", href: "/progress", icon: BarChart2 },
        { label: "Perfil", href: "/profile", icon: UserCircle },
    ];

    const advancedAthleteItems = [
        ...athleteItems,
        { label: "Rutinas", href: "/routines", icon: ClipboardList },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell },
    ];

    const items = role === "coach"
        ? [...coachItems, { label: "Usuarios", href: "/users", icon: Users }, { label: "Perfil", href: "/profile", icon: UserCircle }]
        : role === "advanced_athlete"
            ? advancedAthleteItems
            : athleteItems;

    // Use up to 6 items for mobile bar if needed
    const displayItems = items.slice(0, 6);

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-lg border border-neutral-800 rounded-3xl shadow-2xl z-50 h-16 flex items-center justify-between px-1">
            {displayItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all min-w-0 px-0.5",
                            isActive ? "text-red-500" : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        <div className={cn(
                            "p-1 rounded-full transition-all",
                            isActive && "bg-red-500/10"
                        )}>
                            <Icon className={cn("w-[18px] h-[18px]", isActive && "fill-current")} />
                        </div>
                        <span className="text-[8px] xs:text-[9px] font-medium truncate w-full text-center">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
