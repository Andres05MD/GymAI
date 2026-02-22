"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerUser } from "@/actions/auth-actions"; // Importar Server Action
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles } from "lucide-react";

const RegisterSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),

}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export function AuthRegisterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {

        }
    });
    // ... (onSubmit igual) ...
    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        try {
            const result = await registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
                // confirmPassword no se envía al backend
                role: "athlete",
            });

            if (result.success) {
                toast.success("Cuenta creada exitosamente");

                // Iniciar sesión automáticamente
                await signIn("credentials", {
                    email: data.email,
                    password: data.password,
                    redirect: false,
                });

                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "Error al registrar");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Nombre del Operador</Label>
                    <Input
                        id="name"
                        placeholder="NOMBRE COMPLETO"
                        {...register("name")}
                        className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl px-4 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700 uppercase"
                    />
                    {errors.name && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Canal de Comunicación / Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="OPERATOR@GYMIA.COM"
                        {...register("email")}
                        className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl px-4 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700 uppercase"
                    />
                    {errors.email && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Nueva Clave</Label>
                        <div className="relative group">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl pl-4 pr-10 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neutral-600 hover:text-white hover:bg-transparent transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.password && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Validar Clave</Label>
                        <div className="relative group">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                                className="bg-neutral-950/50 border border-white/5 h-14 rounded-2xl pl-4 pr-10 text-sm font-bold text-white shadow-inner transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 placeholder:text-neutral-700"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neutral-600 hover:text-white hover:bg-transparent transition-colors"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.confirmPassword && <p className="ml-1 text-[10px] font-black uppercase text-red-500 italic tracking-widest">{errors.confirmPassword.message}</p>}
                    </div>
                </div>

                <Button
                    type="submit"
                    className="group relative w-full h-14 rounded-2xl bg-white text-black hover:bg-neutral-200 text-xs font-black tracking-[0.2em] uppercase italic transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    disabled={loading}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? "Generando..." : "Finalizar Registro"}
                        {!loading && <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                    </span>
                </Button>
            </form>
        </div>
    );
}
