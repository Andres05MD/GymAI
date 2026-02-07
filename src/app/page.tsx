"use client";

import { useState, useEffect } from "react";
import { AuthLoginForm } from "@/components/forms/auth-login-form";
import { AuthRegisterForm } from "@/components/forms/auth-register-form";
import { Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoggingPage() {
    const [isLogin, setIsLogin] = useState(true);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Dumbbell className="w-12 h-12 text-white animate-bounce" />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-black md:bg-white overflow-hidden">
            {/* Black Header Area (Top on Mobile, Left on Desktop) */}
            <div className={cn(
                "relative flex flex-col items-center justify-center bg-black p-4",
                "h-[20vh] w-full",
                "md:min-h-screen md:w-1/2 md:p-12 transition-all duration-500"
            )}>

                <motion.div
                    layout
                    className="bg-white p-3 rounded-2xl shadow-lg shadow-white/10 mb-2 md:mb-0 md:scale-150 transition-transform"
                >
                    <Dumbbell className="w-8 h-8 md:w-12 md:h-12 text-black" />
                </motion.div>

                {/* Desktop Welcome Text with transitions */}
                <div className="hidden md:flex flex-col items-center mt-12 text-white text-center space-y-4 max-w-lg h-32">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? "login-text" : "register-text"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center space-y-4"
                        >
                            <h2 className="text-4xl font-bold tracking-tight">
                                {isLogin ? "Bienvenido a GymIA" : "Únete al Club"}
                            </h2>
                            <p className="text-gray-400 text-lg mx-auto max-w-md">
                                {isLogin
                                    ? "Tu entrenador personal inteligente. Gestiona rutinas, seguimiento y más."
                                    : "Comienza tu viaje fitness hoy mismo. Registra tus progresos y alcanza tus metas."}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* White Content Area (Bottom on Mobile, Right on Desktop) */}
            <div className={cn(
                "flex-1 bg-white flex flex-col items-center justify-center w-full z-10",
                "rounded-t-[40px] -mt-8 px-6 pt-10 pb-8",
                "md:rounded-t-none md:rounded-l-[48px] md:-ml-12 md:mt-0 md:px-0"
            )}>

                {/* Centered Content Wrapper */}
                <div className="w-full max-w-md">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? "login-form" : "register-form"}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="w-full space-y-8"
                        >
                            <div className="text-center md:text-left space-y-2">
                                <h1 className="text-3xl font-bold text-black md:text-5xl">
                                    {isLogin ? "Iniciar Sesión" : "Regístrate"}
                                </h1>
                                <p className="text-gray-500 font-medium">
                                    {isLogin ? "Bienvenido de nuevo, ingresa tus datos." : "Crea tu cuenta en segundos."}
                                </p>
                            </div>

                            {isLogin ? <AuthLoginForm /> : <AuthRegisterForm />}

                            <div className="pt-2 text-center text-sm font-medium text-gray-500">
                                <p>
                                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-black font-bold hover:underline transition-colors focus:outline-none"
                                    >
                                        {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
