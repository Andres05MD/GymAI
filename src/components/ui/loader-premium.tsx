"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoaderPremiumProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    fullPage?: boolean;
}

export function LoaderPremium({ className, size = "md", text, fullPage }: LoaderPremiumProps) {
    const sizeClasses = {
        sm: "w-6 h-6 border-2",
        md: "w-10 h-10 border-3",
        lg: "w-16 h-16 border-4",
        xl: "w-24 h-24 border-4",
    };

    const loaderContent = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative">
                {/* Outer pulsing ring */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className={cn(
                        "absolute inset-0 rounded-full bg-red-600 blur-xl",
                        sizeClasses[size].split(" ")[0],
                        sizeClasses[size].split(" ")[1]
                    )}
                />

                {/* Main rotating gradient ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className={cn(
                        "rounded-full border-t-red-600 border-r-transparent border-b-neutral-800 border-l-transparent shadow-[0_0_15px_rgba(220,38,38,0.3)]",
                        sizeClasses[size]
                    )}
                />

                {/* Inner decorative circle */}
                <div className={cn(
                    "absolute inset-1 rounded-full border border-white/5 bg-black/20 backdrop-blur-sm shadow-inner",
                )} />
            </div>

            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                <div className="absolute inset-0 bg-linear-to-b from-red-600/5 to-transparent pointer-events-none" />
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}
