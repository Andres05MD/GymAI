"use client";

import { useState, useEffect } from "react";
import { Bell, Brain, ExternalLink, AlertCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getCoachNotifications, getAthleteNotifications } from "@/actions/notification-actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function NotificationBell({ role }: { role?: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            let res;
            if (role === "coach") {
                res = await getCoachNotifications();
            } else {
                res = await getAthleteNotifications();
            }

            if (res.success && res.notifications) {
                setNotifications(res.notifications);
                setHasUnread(res.notifications.length > 0);
            }
        };
        fetchNotifications();
    }, [role]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-900 animate-pulse"></span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-neutral-950 border-neutral-800 text-white rounded-2xl shadow-2xl p-0 overflow-hidden z-50">
                <div className="p-4 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
                    <DropdownMenuLabel className="font-bold text-base p-0 flex items-center gap-2">
                        {role === 'coach' ? <Brain className="w-4 h-4 text-purple-500" /> : <Bell className="w-4 h-4 text-red-500" />}
                        Notificaciones
                    </DropdownMenuLabel>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                        Recientes
                    </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                    {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                            <Bell className="w-8 h-8 text-neutral-700 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-neutral-500">No hay alertas nuevas</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="p-4 border-b border-neutral-900 hover:bg-neutral-900/50 transition-colors group relative">
                                <Link
                                    href={notif.link || (role === 'coach' ? `/athletes/${notif.athleteId}` : '#')}
                                    className={`absolute inset-0 z-10 ${!notif.link && role !== 'coach' ? 'pointer-events-none' : ''}`}
                                />
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${notif.type === 'alert' ? 'bg-red-500' : 'bg-purple-500'}`} />
                                        {notif.title}
                                    </h4>
                                    <span className="text-[10px] text-neutral-500">
                                        {formatDistanceToNow(new Date(notif.time), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                                    {notif.message}
                                </p>
                                {notif.link && (
                                    <span className="text-[10px] font-bold text-red-400 group-hover:text-red-300 flex items-center gap-1 transition-colors uppercase tracking-wider">
                                        Tomar Acción <ExternalLink className="w-3 h-3" />
                                    </span>
                                )}
                                {!notif.link && role === 'coach' && (
                                    <span className="text-[10px] font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1 transition-colors uppercase tracking-wider">
                                        Ver Atleta <ExternalLink className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="bg-neutral-800 m-0" />
                <div className="p-2">
                    <Button variant="ghost" className="w-full text-xs text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-xl">
                        Marcar todas como leídas
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
