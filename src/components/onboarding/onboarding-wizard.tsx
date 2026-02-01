"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { OnboardingInputSchema } from "@/lib/schemas";
import { completeOnboarding } from "@/actions/auth-actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Check, Activity, HeartPulse, User, Ruler, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Step = "bio" | "goals" | "health" | "measurements";

const steps: { id: Step; label: string; icon: any }[] = [
    { id: "bio", label: "Biometría", icon: User },
    { id: "goals", label: "Objetivos", icon: Target },
    { id: "health", label: "Salud", icon: HeartPulse },
    { id: "measurements", label: "Medidas", icon: Ruler },
];

export function OnboardingWizard() {
    const [currentStep, setCurrentStep] = useState<Step>("bio");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { update } = useSession();

    const form = useForm<z.infer<typeof OnboardingInputSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(OnboardingInputSchema) as any,
        defaultValues: {
            age: 25,
            gender: "male",
            weight: 70,
            height: 170,
            experienceLevel: "beginner",
            goal: "hypertrophy",
            availableDays: 3,
            injuries: [],
            medicalConditions: [],
            measurements: {},
        },
    });

    const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = form;
    const formData = watch();

    const nextStep = async () => {
        let isValid = false;

        // Validar paso actual antes de avanzar
        if (currentStep === "bio") {
            isValid = await trigger(["age", "weight", "height", "gender"]);
            if (isValid) setCurrentStep("goals");
        } else if (currentStep === "goals") {
            isValid = await trigger(["experienceLevel", "goal", "availableDays"]);
            if (isValid) setCurrentStep("health");
        } else if (currentStep === "health") {
            isValid = await trigger(["injuries", "medicalConditions"]);
            if (isValid) setCurrentStep("measurements");
        }
    };

    const prevStep = () => {
        if (currentStep === "goals") setCurrentStep("bio");
        if (currentStep === "health") setCurrentStep("goals");
        if (currentStep === "measurements") setCurrentStep("health");
    };

    const onSubmit = async (data: z.infer<typeof OnboardingInputSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await completeOnboarding(data);
            if (result.success) {
                // Actualizar sesión del lado del cliente
                await update({ onboardingCompleted: true });

                toast.success("¡Perfil completado con éxito!");
                router.refresh();
                router.push("/"); // Redirigir al Dashboard
            } else {
                toast.error(result.error || "Hubo un error al guardar los datos.");
            }
        } catch (error) {
            toast.error("Error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Body Map Helper for Injuries (Simplificado)
    const toggleInjury = (injury: string) => {
        const currentInjuries = formData.injuries || [];
        if (currentInjuries.includes(injury)) {
            setValue("injuries", currentInjuries.filter((i) => i !== injury));
        } else {
            setValue("injuries", [...currentInjuries, injury]);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {steps.map((step, index) => {
                        const stepIndex = steps.findIndex(s => s.id === currentStep);
                        const isCompleted = steps.findIndex(s => s.id === step.id) < stepIndex;
                        const isActive = step.id === currentStep;

                        return (
                            <div key={step.id} className={cn("flex flex-col items-center gap-2 relative z-10 w-full",
                                index === 0 ? "items-start" : index === steps.length - 1 ? "items-end" : "items-center"
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isActive ? "bg-red-600 border-red-600 text-white scale-110" :
                                        isCompleted ? "bg-neutral-800 border-red-600 text-red-500" : "bg-black border-neutral-800 text-neutral-600"
                                )}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                </div>
                                <span className={cn("text-xs font-bold uppercase tracking-wider hidden md:block", isActive ? "text-white" : "text-neutral-500")}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Progress Line Background would go here if needed */}
            </div>

            <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="p-8 md:p-12 min-h-[500px] flex flex-col">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 space-y-8"
                            >
                                {/* STEP 1: BIO */}
                                {currentStep === "bio" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Comencemos por lo básico</h2>
                                            <p className="text-neutral-400">Estos datos nos ayudan a calcular tus necesidades calóricas y de carga.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Edad</Label>
                                                <Input
                                                    type="number"
                                                    {...register("age")}
                                                    className="bg-black/50 border-neutral-800 h-12 rounded-xl text-lg text-white focus:ring-red-500/50"
                                                />
                                                {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Género</Label>
                                                <Select onValueChange={(v: string) => setValue("gender", v as any)} defaultValue={formData.gender}>
                                                    <SelectTrigger className="bg-black/50 border-neutral-800 h-12 rounded-xl text-white">
                                                        <SelectValue placeholder="Selecciona" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                                        <SelectItem value="male">Hombre</SelectItem>
                                                        <SelectItem value="female">Mujer</SelectItem>
                                                        <SelectItem value="other">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Peso (kg)</Label>
                                                <Input
                                                    type="number"
                                                    {...register("weight")}
                                                    className="bg-black/50 border-neutral-800 h-12 rounded-xl text-lg text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Altura (cm)</Label>
                                                <Input
                                                    type="number"
                                                    {...register("height")}
                                                    className="bg-black/50 border-neutral-800 h-12 rounded-xl text-lg text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: GOALS & XP */}
                                {currentStep === "goals" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Tu Experiencia y Metas</h2>
                                            <p className="text-neutral-400">Personalizaremos la intensidad y el volumen según esto.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Nivel de Experiencia</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                                                        <div
                                                            key={level}
                                                            onClick={() => setValue("experienceLevel", level as any)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-neutral-800",
                                                                formData.experienceLevel === level
                                                                    ? "border-red-600 bg-red-600/10 text-white"
                                                                    : "border-neutral-800 bg-black/40 text-neutral-400"
                                                            )}
                                                        >
                                                            <span className="capitalize font-bold text-lg mb-1">
                                                                {level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                                            </span>
                                                            <span className="text-xs text-center opacity-70 font-normal">
                                                                {level === 'beginner' ? '< 6 meses entrenando' : level === 'intermediate' ? '6 meses - 2 años' : '> 2 años constancia'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Objetivo Principal</Label>
                                                <Select onValueChange={(v: string) => setValue("goal", v)} defaultValue={formData.goal}>
                                                    <SelectTrigger className="bg-black/50 border-neutral-800 h-14 rounded-xl text-white text-lg">
                                                        <SelectValue placeholder="Selecciona tu meta" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                                        <SelectItem value="hypertrophy">Hipertrofia (Ganar Músculo)</SelectItem>
                                                        <SelectItem value="strength">Fuerza Pura</SelectItem>
                                                        <SelectItem value="weight_loss">Pérdida de Peso / Definición</SelectItem>
                                                        <SelectItem value="endurance">Resistencia Condicional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500 flex justify-between">
                                                    <span>Días Disponibles por Semana</span>
                                                    <span className="text-red-500 text-lg font-black">{formData.availableDays} días</span>
                                                </Label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="7"
                                                    step="1"
                                                    value={formData.availableDays || 3}
                                                    onChange={(e) => setValue("availableDays", parseInt(e.target.value))}
                                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: HEALTH */}
                                {currentStep === "health" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Perfil de Salud</h2>
                                            <p className="text-neutral-400">Crucial para que la IA prevenga ejercicios peligrosos.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-neutral-500">Lesiones / Molestias Activas</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    "Hombros", "Rodillas", "Espalda Baja", "Espalda Alta",
                                                    "Muñecas", "Codos", "Tobillos", "Cadera", "Cuello"
                                                ].map((part) => {
                                                    const isSelected = formData.injuries?.includes(part);
                                                    return (
                                                        <div
                                                            key={part}
                                                            onClick={() => toggleInjury(part)}
                                                            className={cn(
                                                                "p-3 rounded-xl border border-neutral-800 cursor-pointer text-center text-sm font-medium transition-all",
                                                                isSelected
                                                                    ? "bg-red-900/40 border-red-500 text-white"
                                                                    : "bg-black/40 text-neutral-400 hover:bg-neutral-800"
                                                            )}
                                                        >
                                                            {part}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-4">
                                                <Label className="uppercase text-xs font-bold text-neutral-500 mb-2 block">Otras condiciones médicas (Opcional)</Label>
                                                <Input
                                                    placeholder="Ej: Asma, Hipertensión..."
                                                    className="bg-black/50 border-neutral-800 rounded-xl text-white"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.currentTarget as HTMLInputElement).value;
                                                            if (val) {
                                                                setValue("medicalConditions", [...(formData.medicalConditions || []), val]);
                                                                (e.currentTarget as HTMLInputElement).value = "";
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.medicalConditions?.map((cond, i) => (
                                                        <span key={i} className="bg-neutral-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                                            {cond}
                                                            <button
                                                                type="button"
                                                                onClick={() => setValue("medicalConditions", formData.medicalConditions?.filter((_, idx) => idx !== i) || [])}
                                                                className="hover:text-red-500"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: MEASUREMENTS */}
                                {currentStep === "measurements" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Medidas Iniciales</h2>
                                            <p className="text-neutral-400">Opcional. Registra tus medidas base para ver tu progreso real.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: "measurements.chest", label: "Pecho" },
                                                { id: "measurements.waist", label: "Cintura" },
                                                { id: "measurements.hips", label: "Cadera" },
                                                { id: "measurements.biceps", label: "Bíceps" },
                                                { id: "measurements.quads", label: "Cuádriceps" },
                                                { id: "measurements.calves", label: "Pantorrillas" },
                                            ].map((m) => (
                                                <div key={m.id} className="space-y-2">
                                                    <Label className="uppercase text-xs font-bold text-neutral-500">{m.label} (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        {...register(m.id as any)}
                                                        placeholder="0"
                                                        className="bg-black/50 border-neutral-800 h-12 rounded-xl text-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Footer Controls */}
                        <div className="mt-auto pt-8 flex justify-between items-center border-t border-neutral-800/50">
                            {currentStep !== "bio" ? (
                                <Button
                                    type="button"
                                    onClick={prevStep}
                                    variant="ghost"
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
                                </Button>
                            ) : (
                                <div></div> // Spacer
                            )}

                            {currentStep === "measurements" ? (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-red-900/20"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Finalizar Setup
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 h-12 font-bold"
                                >
                                    Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
