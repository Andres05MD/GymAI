"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLoginForm } from "@/components/forms/auth-login-form";
import { AuthRegisterForm } from "@/components/forms/auth-register-form";
import { Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Client Component para la página de login/registro
 * La verificación de sesión se hace en el Server Component padre
 */
export function LoginPageClient() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-black overflow-hidden relative">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/5 rounded-full blur-[120px]" />
            </div>

            {/* Tactical Sidebar (Left) */}
            <div className={cn(
                "relative flex flex-col items-center justify-center p-8 transition-all duration-700 delay-100",
                "h-[30vh] w-full border-b border-white/5",
                "md:min-h-screen md:w-[45%] md:p-12 md:border-b-0 md:border-r border-white/5"
            )}>
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <Link href="/dashboard">
                    <motion.div
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative z-10 bg-linear-to-b from-white to-neutral-400 p-4 rounded-4xl shadow-[0_0_50px_-12px_rgba(255,255,255,0.3)] mb-6 md:scale-125 lg:scale-150 transition-transform cursor-pointer"
                    >
                        <Dumbbell className="w-10 h-10 text-black shrink-0" />
                    </motion.div>
                </Link>

                <div className="z-10 text-center space-y-4 max-w-sm mt-8 hidden md:block">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? "login-text" : "register-text"}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="space-y-4"
                        >
                            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                                {isLogin ? "System\nCheck" : "Access\nGranted"}
                            </h2>
                            <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">
                                {isLogin
                                    ? "Inicia sesión para comenzar tu entrenamiento."
                                    : "Regístrate para comenzar la transformación técnica."}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Area (Right) */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? "login-form" : "register-form"}
                            initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-10"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-px flex-1 bg-linear-to-r from-red-600/50 to-transparent" />
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] italic">Auth Security</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                                    {isLogin ? "Iniciar" : "Crear"} <span className="text-neutral-500">{isLogin ? "Sesión" : "Cuenta"}</span>
                                </h1>
                            </div>

                            <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />
                                <div className="relative z-10">
                                    {isLogin ? <AuthLoginForm /> : <AuthRegisterForm />}
                                </div>
                            </div>

                            <div className="text-center group">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-4 transition-colors group-hover:text-neutral-400">
                                    {isLogin ? "¿Nuevo en el programa?" : "¿Ya tienes credenciales?"}
                                </p>
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="relative h-12 px-8 rounded-full border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-white font-black uppercase italic tracking-widest text-[10px] transition-all overflow-hidden"
                                >
                                    <span className="relative z-10">
                                        {isLogin ? "Registrar nueva cuenta" : "Volver al acceso"}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
