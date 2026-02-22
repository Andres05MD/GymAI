"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { updateUserRole } from "@/actions/user-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserRoleSelectProps {
    userId: string;
    currentRole: string;
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
    const [role, setRole] = useState(currentRole);
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleChange = async (newRole: string) => {
        if (newRole === role) return;

        setIsLoading(true);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                setRole(newRole);
                toast.success("Rol actualizado correctamente");
            } else {
                toast.error(result.error || "Error al actualizar el rol");
            }
        } catch (error) {
            toast.error("Error de red al actualizar el rol");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={role}
                onValueChange={handleRoleChange}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[180px] bg-neutral-900 border-neutral-800 text-white rounded-xl focus:ring-red-500">
                    <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                    <SelectItem value="athlete">Atleta</SelectItem>
                    <SelectItem value="advanced_athlete">Atleta Avanzado</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                </SelectContent>
            </Select>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-red-500" />}
        </div>
    );
}
