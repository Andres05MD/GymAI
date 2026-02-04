"use client";

import { Bell, Mail, LayoutDashboard, Users, ClipboardList, Dumbbell, BarChart2, History, UserCircle, LogOut, Target } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface HeaderProps {
    user?: any;
}

export function Header({ user }: HeaderProps) {
    const pathname = usePathname();
    const role = user?.role;

    // Items arrays kept for reference if needed, but not used in Header anymore
    // mobile-nav handles the menu items now.

    return (
        <header className="flex h-20 items-center justify-between gap-4 px-6 py-4 bg-transparent w-full">
            {/* Logo for mobile only since Sidebar is hidden */}
            <div className="md:hidden flex items-center gap-2">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-black" />
                </div>
                <span className="text-xl font-bold tracking-tighter text-white">GymIA</span>
            </div>



            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">

                <NotificationBell role={role} />

                <div className="h-8 w-[1px] bg-neutral-800 mx-2 hidden sm:block" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 sm:pl-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-white leading-none">{user?.name || "Usuario"}</p>
                                <p className="text-xs text-neutral-400 mt-1 capitalize">{user?.role || "Atleta"}</p>
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-neutral-800">
                                <AvatarImage src={user?.image} />
                                <AvatarFallback className="bg-neutral-800 text-white font-bold">
                                    {user?.name?.[0]?.toUpperCase() || <UserCircle className="w-6 h-6" />}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-neutral-950 border-neutral-800 text-white rounded-xl shadow-xl shadow-black/50">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name || "Mi Cuenta"}</p>
                                <p className="text-xs leading-none text-neutral-400">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-800" />
                        <Link href="/profile">
                            <DropdownMenuItem className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white rounded-lg my-1">
                                <UserCircle className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator className="bg-neutral-800" />
                        <DropdownMenuItem className="cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 text-red-500 focus:text-red-500 rounded-lg my-1" onClick={() => signOut({ redirectTo: "/" })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
