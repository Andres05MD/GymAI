"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Dumbbell,
    BarChart2,
    Users,
    LogOut,
    Target,
    UserCircle,
    ClipboardList,
    History
} from "lucide-react";

interface SidebarProps {
    role?: string;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    const commonItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, prefetch: true },
    ];

    const coachItems = [
        ...commonItems,
        { label: "Atletas", href: "/athletes", icon: Users, prefetch: true },
        { label: "Rutinas", href: "/routines", icon: ClipboardList, prefetch: true },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell, prefetch: false },
        { label: "Progreso", href: "/progress", icon: BarChart2, prefetch: false },
    ];

    const athleteItems = [
        ...commonItems,
        { label: "Rutina Hoy", href: "/train", icon: Dumbbell, prefetch: true },
        { label: "Rutina Semanal", href: "/my-routine", icon: ClipboardList, prefetch: true },
        { label: "Historial", href: "/history", icon: History, prefetch: false },
        { label: "Progreso", href: "/progress", icon: BarChart2, prefetch: false },
    ];

    const advancedAthleteItems = [
        ...athleteItems,
        { label: "Rutinas", href: "/routines", icon: ClipboardList, prefetch: true },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell, prefetch: false },
    ];

    const menuItems = role === "coach"
        ? [...coachItems, { label: "Usuarios", href: "/users", icon: Users, prefetch: true }]
        : role === "advanced_athlete"
            ? advancedAthleteItems
            : athleteItems;

    const generalItems = [
        { label: "Perfil", href: "/profile", icon: UserCircle, prefetch: false },
    ];

    return (
        <div className="hidden md:flex h-screen w-72 flex-col bg-black p-6 border-r border-neutral-900">
            <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-10 hover:opacity-80 transition-opacity">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tighter">GymIA</span>
            </Link>

            <div className="space-y-8 flex-1">
                <div>
                    <h3 className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Menú
                    </h3>
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={item.prefetch}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-medium",
                                        isActive
                                            ? "bg-neutral-800 text-white shadow-lg shadow-neutral-900/50"
                                            : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-red-500" : "text-neutral-500 group-hover:text-white")} />
                                    {item.label}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <h3 className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                        General
                    </h3>
                    <nav className="space-y-2">
                        {generalItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={item.prefetch}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-medium",
                                        isActive
                                            ? "bg-neutral-800 text-white"
                                            : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-red-500" : "text-neutral-500 group-hover:text-white")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 font-medium group text-left mt-2"
                        >
                            <LogOut className="h-5 w-5 text-neutral-500 group-hover:text-red-500" />
                            Cerrar Sesión
                        </button>
                    </nav>
                </div>
            </div>



        </div>
    );
}
