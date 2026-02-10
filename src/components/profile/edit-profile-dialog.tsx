"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "@/actions/profile-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface UserProfile {
    name: string;
    image?: string;
    goal?: string;
    level?: string;
}

export function EditProfileDialog({ user }: { user: UserProfile }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [name, setName] = useState(user.name);
    const [image, setImage] = useState(user.image || "");
    const [goal, setGoal] = useState(user.goal || "Hipertrofia");

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await updateProfile({ name, image, goal });
            if (result.success) {
                toast.success("Perfil actualizado");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error("Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                    <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-neutral-900 border-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>URL de Avatar (Opcional)</Label>
                        <Input
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://..."
                            className="bg-neutral-900 border-neutral-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Objetivo Principal</Label>
                        <Select value={goal} onValueChange={setGoal}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                <SelectItem value="Fuerza">Fuerza</SelectItem>
                                <SelectItem value="Resistencia">Resistencia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-primary text-black font-bold">
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
