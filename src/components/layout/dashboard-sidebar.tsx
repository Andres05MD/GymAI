"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Dumbbell,
    CalendarDays,
    Users,
    Settings,
    Play,
    History,
    User,
    Activity,
} from "lucide-react";

// Navegación para Coaches (Gestión completa)
const coachSidebarItems = [
    {
        title: "Inicio",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Ejercicios",
        href: "/exercises",
        icon: Dumbbell,
    },
    {
        title: "Rutinas",
        href: "/routines",
        icon: CalendarDays,
    },
    {
        title: "Atletas",
        href: "/athletes",
        icon: Users,
    },
];

// Navegación para Atletas (Vista limitada según Planteamiento.txt)
const athleteSidebarItems = [
    {
        title: "Inicio",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Mi Rutina",
        href: "/my-routine",
        icon: CalendarDays,
    },
    {
        title: "Entrenar",
        href: "/train",
        icon: Play,
    },
    {
        title: "Historial",
        href: "/history",
        icon: History,
    },
    {
        title: "Mi Progreso",
        href: "/progress",
        icon: Activity,
    },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const role = session?.user?.role;
    const isCoach = role === "coach";

    const sidebarItems = isCoach ? coachSidebarItems : athleteSidebarItems;
    const sidebarTitle = isCoach ? "GymIA Coach" : "GymIA Atleta";

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        {sidebarTitle}
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors",
                                    pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                        Cuenta
                    </h2>
                    <div className="space-y-1">
                        <Link
                            href="/profile"
                            className={cn(
                                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === "/profile" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Mi Perfil
                        </Link>
                        <Link
                            href="/settings"
                            className={cn(
                                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                pathname === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Ajustes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
