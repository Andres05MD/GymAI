"use strict";
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

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
