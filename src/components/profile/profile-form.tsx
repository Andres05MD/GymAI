"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateProfile } from "@/actions/user-actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

const profileSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    phone: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
});

interface ProfileFormProps {
    user: {
        name?: string;
        email?: string;
        image?: string;
        phone?: string;
        height?: number;
        weight?: number;
        role?: string;
        onboardingCompleted?: boolean;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();

    // 1. Define your form.
    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            phone: user?.phone || "",
            height: user?.height?.toString() || "",
            weight: user?.weight?.toString() || "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof profileSchema>) {
        const res = await updateProfile(values);
        if (res.success) {
            toast.success("Perfil actualizado");
            router.refresh();
        } else {
            toast.error(res.error || "Algo salió mal");
        }
    }

    const height = form.watch("height");
    const weight = form.watch("weight");

    const calculateBMI = (h?: string, w?: string) => {
        const heightVal = parseFloat(h || "0");
        const weightVal = parseFloat(w || "0");

        if (!heightVal || !weightVal) return null;

        const bmiVal = weightVal / ((heightVal / 100) * (heightVal / 100));
        const rounded = bmiVal.toFixed(1);

        if (bmiVal < 18.5) return { value: rounded, label: "Bajo Peso", color: "border-blue-500 text-blue-500" };
        if (bmiVal < 25) return { value: rounded, label: "Peso Normal", color: "border-green-500 text-green-500" };
        if (bmiVal < 30) return { value: rounded, label: "Sobrepeso", color: "border-yellow-500 text-yellow-500" };
        return { value: rounded, label: "Obesidad", color: "border-red-500 text-red-500" };
    };

    const bmi = calculateBMI(height, weight);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-neutral-800">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-red-600 to-red-900 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Avatar className="h-28 w-28 border-4 border-black relative z-10">
                        <AvatarImage src={user.image} className="object-cover" />
                        <AvatarFallback className="text-3xl font-black bg-neutral-900 text-neutral-400">
                            {user.name?.[0]?.toUpperCase() || <User />}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="text-center md:text-left space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
                    <p className="text-neutral-400 font-medium">{user.email}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                            {user.role === 'coach' ? 'Entrenador' : 'Atleta'}
                        </span>
                        {user.onboardingCompleted && (
                            <span className="px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-full text-xs font-bold uppercase tracking-wider text-green-500">
                                Verificado
                            </span>
                        )}
                    </div>
                </div>

                {user.role !== 'coach' && bmi && (
                    <div className={`md:ml-auto p-4 rounded-2xl border ${bmi.color.split(' ')[0]} bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center min-w-[140px] shadow-lg`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">IMC Actual</span>
                        <span className={`text-3xl font-black ${bmi.color.split(' ')[1]} leading-none mb-1`}>{bmi.value}</span>
                        <span className="text-[10px] font-bold uppercase text-neutral-500 bg-black/40 px-2 py-0.5 rounded-full">{bmi.label}</span>
                    </div>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-neutral-500 ml-1">Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Tu nombre"
                                            {...field}
                                            className="bg-neutral-950/50 border-neutral-800 focus:border-red-500 transition-all h-12 rounded-xl text-white placeholder:text-neutral-600"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-neutral-500 ml-1">Teléfono</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+56 9 ..."
                                            {...field}
                                            className="bg-neutral-950/50 border-neutral-800 focus:border-red-500 transition-all h-12 rounded-xl text-white placeholder:text-neutral-600"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {user.role !== 'coach' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="uppercase text-xs font-bold tracking-widest text-neutral-500 ml-1">Altura (cm)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="175"
                                                    className="bg-neutral-950/50 border-neutral-800 focus:border-red-500 transition-all h-12 rounded-xl text-white placeholder:text-neutral-600"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="uppercase text-xs font-bold tracking-widest text-neutral-500 ml-1">Peso (kg)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder="70"
                                                        className="bg-neutral-950/50 border-neutral-800 focus:border-red-500 transition-all h-12 rounded-xl text-white placeholder:text-neutral-600"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            className="w-full md:w-auto px-8 bg-red-600 hover:bg-red-700 text-white h-12 rounded-full font-bold shadow-lg shadow-red-900/20 transition-all hover:scale-105"
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </Form>
        </div >
    );
}
