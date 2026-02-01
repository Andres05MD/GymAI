"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
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

export function ProfileForm({ user }: { user: any }) {
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
            toast.success("Perfil actualizad");
            router.refresh();
        } else {
            toast.error(res.error || "Algo salió mal");
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-neutral-800">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="text-2xl font-bold bg-neutral-800">
                        {user.name?.[0]?.toUpperCase() || <User />}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                    <p className="text-neutral-500">{user.email}</p>
                    <p className="text-neutral-500 text-sm mt-1 capitalize">{user.role}</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tu nombre" {...field} />
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
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="+56 9 ..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Altura (cm)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="175" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Peso (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="70" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200">
                        Guardar Cambios
                    </Button>
                </form>
            </Form>
        </div>
    );
}
