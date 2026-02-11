import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.onboardingCompleted) {
        redirect("/dashboard");
    }

    // Obtener el proveedor de autenticación de la sesión para decidir si la contraseña es obligatoria
    const authProvider = session.user.authProvider || "password";

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Background Mood */}
            <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-4xl z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                        Configura tu <span className="text-red-600">Perfil Atlético</span>
                    </h1>
                    <p className="text-neutral-400">
                        Ayúdanos a personalizar tu experiencia y calibrar la IA.
                    </p>
                </div>

                <OnboardingWizard authProvider={authProvider} />
            </div>
        </div>
    );
}

