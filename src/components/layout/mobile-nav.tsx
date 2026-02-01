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

    const commonItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    const coachItems = [
        ...commonItems,
        { label: "Atletas", href: "/athletes", icon: Users },
        { label: "Rutinas", href: "/routines", icon: ClipboardList },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell },
    ];

    // For coach, limit to 4 items in main bar, maybe put Analytics in "More"?
    // Let's stick to 4 main + More for Coach if needed, or 5.
    // Coach: Home, Athletes, Routines, Exercises, Stats. That's 5. Fits.

    const athleteItems = [
        ...commonItems,
        { label: "Entrenar", href: "/train", icon: Dumbbell },
        { label: "Historial", href: "/history", icon: History },
        { label: "Progreso", href: "/progress", icon: BarChart2 },
        // 5th item: Profile? or More?
        // Let's use Profile as the 5th item directly since it's common.
        { label: "Perfil", href: "/profile", icon: UserCircle },
    ];

    const items = role === "coach" ? [...coachItems, { label: "Perfil", href: "/profile", icon: UserCircle }] : athleteItems;

    // Use only top 5 items for mobile bar to avoid overcrowding
    const displayItems = items.slice(0, 5);

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-lg border border-neutral-800 rounded-3xl shadow-2xl z-50 h-16 flex items-center justify-around px-2">
            {displayItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-14 h-full gap-1 transition-all",
                            isActive ? "text-red-500" : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-all",
                            isActive && "bg-red-500/10"
                        )}>
                            <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
