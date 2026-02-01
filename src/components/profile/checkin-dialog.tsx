"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Ruler, Save, Plus } from "lucide-react";
import { logMeasurement } from "@/actions/measurement-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CheckinDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [weight, setWeight] = useState("");
    const [waist, setWaist] = useState("");
    const [biceps, setBiceps] = useState("");

    const handleSubmit = async () => {
        if (!weight) {
            toast.error("El peso es obligatorio");
            return;
        }

        setLoading(true);
        try {
            const result = await logMeasurement({
                weight: parseFloat(weight),
                waist: waist ? parseFloat(waist) : undefined,
                biceps: biceps ? parseFloat(biceps) : undefined
            });

            if (result.success) {
                toast.success("Progreso registrado");
                setIsOpen(false);
                setWeight("");
                setWaist("");
                setBiceps("");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <Plus className="mr-2 h-4 w-4" /> Check-in Semanal
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registro de Progreso</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Peso (kg)</Label>
                        <div className="col-span-3 relative">
                            <Scale className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                type="number" step="0.1"
                                className="pl-9 bg-zinc-900 border-zinc-800"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Cintura (cm)</Label>
                        <div className="col-span-3 relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                type="number"
                                className="pl-9 bg-zinc-900 border-zinc-800"
                                value={waist}
                                onChange={e => setWaist(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Bíceps (cm)</Label>
                        <div className="col-span-3 relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                type="number"
                                className="pl-9 bg-zinc-900 border-zinc-800"
                                value={biceps}
                                onChange={e => setBiceps(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-black font-bold">
                    {loading ? "Guardando..." : "Guardar Registro"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
