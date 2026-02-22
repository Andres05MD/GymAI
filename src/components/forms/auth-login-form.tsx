"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";

const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export function AuthLoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Credenciales incorrectas");
            } else {
                toast.success("Bienvenido de nuevo");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const idToken = await userCredential.user.getIdToken();

            // Iniciar sesión en NextAuth usando el token de Firebase
            const result = await signIn("credentials", {
                idToken,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Error iniciando sesión con Google en el servidor");
            } else {
                toast.success("Acceso concedido con Google");
                router.push("/dashboard");
                router.refresh();
            }

        } catch (error: any) {
            console.error("Google Login Error:", error);
            // Ignore common popup errors that are not critical failures
            if (
                error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/popup-blocked' ||
                error.code === 'auth/cancelled-popup-request'
            ) {
                setLoading(false);
                return;
            }
            toast.error("Error al iniciar sesión con Google: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Identificador / Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="OPERATOR@GYMIA.COM"
                        {...register("email")}
                        className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl px-4 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700 uppercase"
                    />
                    {errors.email && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Código de Acceso</Label>
                    <div className="relative group">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("password")}
                            className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl pl-4 pr-12 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white hover:bg-transparent transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                    </div>
                    {errors.password && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.password.message}</p>}
                </div>

                <Button
                    type="submit"
                    className="group relative w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-xs font-black tracking-[0.2em] uppercase italic transition-all duration-500 shadow-[0_0_30px_-5px_var(--color-red-600)] hover:shadow-[0_0_50px_-5px_var(--color-red-500)]"
                    disabled={loading}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? "Sincronizando..." : "Iniciar Protocolo"}
                        {!loading && <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </Button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
                    <span className="bg-transparent px-4 text-neutral-600 italic">External Auth</span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                className="w-full h-14 rounded-2xl border border-white/5 bg-white/5 text-white hover:bg-white/10 hover:border-white/10 font-black uppercase italic tracking-widest text-[10px] transition-all flex items-center justify-center gap-4 group"
                disabled={loading}
                onClick={handleGoogleLogin}
            >
                <div className="p-1.5 bg-white rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="#000" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                </div>
                Continuar con Google
            </Button>
        </div>
    );
}
