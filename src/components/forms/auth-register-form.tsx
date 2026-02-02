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
import { Eye, EyeOff } from "lucide-react";

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
                    <Label htmlFor="name" className="ml-1 text-xs font-bold uppercase tracking-widest text-black">Nombre Completo</Label>
                    <Input
                        id="name"
                        placeholder="Juan Pérez"
                        {...register("name")}
                        className="bg-white border border-neutral-200 h-14 rounded-xl px-4 text-base font-medium text-neutral-900 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black placeholder:text-neutral-400"
                    />
                    {errors.name && <p className="ml-1 text-sm text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="ml-1 text-xs font-bold uppercase tracking-widest text-black">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ejemplo@gymia.com"
                        {...register("email")}
                        className="bg-white border border-neutral-200 h-14 rounded-xl px-4 text-base font-medium text-neutral-900 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black placeholder:text-neutral-400"
                    />
                    {errors.email && <p className="ml-1 text-sm text-red-500 font-medium">{errors.email.message}</p>}
                </div>

                {/* Role selection removed - defaulting to athlete */}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="ml-1 text-xs font-bold uppercase tracking-widest text-black">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="bg-white border border-neutral-200 h-14 rounded-xl pl-4 pr-10 text-base font-medium text-neutral-900 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black placeholder:text-neutral-400"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neutral-400 hover:text-neutral-900 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.password && <p className="ml-1 text-sm text-red-500 font-medium">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="ml-1 text-xs font-bold uppercase tracking-widest text-black">Confirmar</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                                className="bg-white border border-neutral-200 h-14 rounded-xl pl-4 pr-10 text-base font-medium text-neutral-900 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-black placeholder:text-neutral-400"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neutral-400 hover:text-neutral-900 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.confirmPassword && <p className="ml-1 text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                    </div>
                </div>

                <Button type="submit" className="w-full h-14 rounded-xl bg-red-600 text-white hover:bg-red-700 text-base font-bold tracking-widest uppercase shadow-xl shadow-red-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 mt-4" disabled={loading}>
                    {loading ? "Registrando..." : "Crear Cuenta"}
                </Button>
            </form>
        </div>
    );
}
