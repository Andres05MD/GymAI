"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";

export function DashboardHeader() {
    const { data: session } = useSession();
    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/5 bg-background/50 backdrop-blur-xl px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    {/* Mobile Sidebar */}
                    <DashboardSidebar className="mt-4" />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Search or Title placeholder */}
                <span className="font-semibold md:hidden">GymIA</span>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                        Cerrar Sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
