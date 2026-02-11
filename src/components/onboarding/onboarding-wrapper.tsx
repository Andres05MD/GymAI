"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Carga dinámica sin SSR para evitar hydration mismatch de Radix UI Select
const OnboardingWizard = dynamic(
    () => import("@/components/onboarding/onboarding-wizard").then((mod) => mod.OnboardingWizard),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        ),
    }
);

interface OnboardingWrapperProps {
    authProvider: "google" | "password";
}

export function OnboardingWrapper({ authProvider }: OnboardingWrapperProps) {
    return <OnboardingWizard authProvider={authProvider} />;
}
