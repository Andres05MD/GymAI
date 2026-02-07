"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedAvatarProps {
    src?: string | null;
    alt?: string;
    size?: number;
    priority?: boolean;
    fallback?: React.ReactNode;
    className?: string;
}

/**
 * Avatar optimizado usando next/image para mejor rendimiento (LCP, caching, lazy loading).
 * Usa este componente para avatares críticos (header, perfil principal).
 */
export function OptimizedAvatar({
    src,
    alt = "Avatar",
    size = 40,
    priority = false,
    fallback,
    className,
}: OptimizedAvatarProps) {
    const [hasError, setHasError] = React.useState(false);

    // Si no hay src o hubo error, mostrar fallback
    if (!src || hasError) {
        return (
            <div
                className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-full bg-neutral-800 items-center justify-center",
                    className
                )}
                style={{ width: size, height: size }}
            >
                {fallback || (
                    <span className="text-neutral-400 font-bold text-sm">
                        {alt?.[0]?.toUpperCase() || "?"}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full bg-neutral-800",
                className
            )}
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={alt}
                width={size}
                height={size}
                priority={priority}
                sizes={`${size}px`}
                className="object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
}
