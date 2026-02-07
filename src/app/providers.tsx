"use strict";
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minuto antes de considerar datos como "stale"
                gcTime: 5 * 60 * 1000, // 5 minutos en caché antes de garbage collection
                refetchOnWindowFocus: false, // Evitar refetch innecesario al volver a la pestaña
                refetchOnReconnect: false, // Evitar refetch al reconectar
                retry: 1, // Solo 1 retry para reducir llamadas fallidas
            },
        },
    }));

    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
            >
                <QueryClientProvider client={queryClient}>
                    {children}
                    <Toaster />
                </QueryClientProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
