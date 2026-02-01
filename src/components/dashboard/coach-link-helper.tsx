"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { linkWithCoach, unlinkCoach } from "@/actions/user-actions";
import { Badge } from "@/components/ui/badge";

interface CoachLinkHelperProps {
    currentCoachId?: string | null;
    currentCoachName?: string | null;
}

export function CoachLinkHelper({ currentCoachId, currentCoachName }: CoachLinkHelperProps) {
    const [coachCode, setCoachCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLink = async () => {
        if (!coachCode) return;
        setIsLoading(true);
        try {
            const result = await linkWithCoach(coachCode);
            if (result.success) {
                toast.success(`Vinculado con éxito a ${result.coachName}`);
                setCoachCode("");
                // Reload or revalidate handled by server action
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al vincular");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirm("¿Seguro que quieres desvincularte de tu coach?")) return;
        setIsLoading(true);
        try {
            const result = await unlinkCoach();
            if (result.success) {
                toast.success("Desvinculado correctamente");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al desvincular");
        } finally {
            setIsLoading(false);
        }
    };

    if (currentCoachId) {
        return (
            <Card className="glass-card border-white/10">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Link className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-bold text-white">Tu Coach</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {currentCoachName?.charAt(0) || "C"}
                            </div>
                            <div>
                                <p className="font-bold text-white">{currentCoachName || "Coach"}</p>
                                <p className="text-xs text-zinc-500">Coach Asignado</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">Activo</Badge>
                    </div>

                    <Button
                        variant="destructive"
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                        onClick={handleUnlink}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                        Desvincular
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-white/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-zinc-400" />
                    <CardTitle className="text-lg font-bold text-white">Vincular Coach</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-zinc-400">
                    Ingresa el código único proporcionado por tu entrenador para conectar tu cuenta y recibir rutinas.
                </p>
                <div className="flex gap-2">
                    <Input
                        placeholder="Ingresa el Código del Coach"
                        value={coachCode}
                        onChange={(e) => setCoachCode(e.target.value)}
                        className="bg-zinc-950 border-white/10"
                    />
                    <Button onClick={handleLink} disabled={isLoading || !coachCode}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
