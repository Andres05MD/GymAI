"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Dumbbell, MoreVertical, Edit, Trash, PlayCircle, ExternalLink } from "lucide-react";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteExercise } from "@/actions/exercise-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ExerciseListProps {
    exercises: any[];
}

export function ExerciseList({ exercises }: ExerciseListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGroup, setFilterGroup] = useState<string | null>(null);
    const router = useRouter();

    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ex.specificMuscles?.some((m: string) => m.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = filterGroup ? ex.muscleGroups?.includes(filterGroup) : true;

        return matchesSearch && matchesFilter;
    });

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar este ejercicio?")) {
            const res = await deleteExercise(id);
            if (res.success) {
                toast.success("Ejercicio eliminado");
                router.refresh();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        }
    };

    // Extract unique muscle groups for filter tabs
    const allGroups = Array.from(new Set(exercises.flatMap(e => e.muscleGroups || [])));

    // Muscle group colors
    const groupColors: Record<string, string> = {
        "pecho": "bg-red-500/10 text-red-500 border-red-500/20",
        "espalda": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        "hombros": "bg-purple-500/10 text-purple-500 border-purple-500/20",
        "bíceps": "bg-orange-500/10 text-orange-500 border-orange-500/20",
        "tríceps": "bg-pink-500/10 text-pink-500 border-pink-500/20",
        "cuádriceps": "bg-green-500/10 text-green-500 border-green-500/20",
        "isquiotibiales": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        "glúteos": "bg-rose-500/10 text-rose-500 border-rose-500/20",
        "pantorrillas": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        "abdominales": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        "cardio": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        "full body": "bg-white/10 text-white border-white/20",
    };

    const getGroupColor = (group: string) => {
        const key = group.toLowerCase();
        return groupColors[key] || "bg-neutral-800 text-neutral-400 border-neutral-700";
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="sticky top-4 md:top-6 z-20 bg-black/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-2 shadow-2xl shadow-black/50">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                            placeholder="Buscar ejercicios..."
                            className="pl-12 h-14 bg-transparent border-transparent rounded-full text-white placeholder:text-neutral-500 focus-visible:ring-0 text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto items-center px-2 pb-2 md:pb-0 scrollbar-hide mask-fade-right">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterGroup(null)}
                            className={cn(
                                "rounded-full h-10 px-5 font-bold transition-all border",
                                !filterGroup
                                    ? "bg-white text-black border-white"
                                    : "bg-neutral-800/50 text-neutral-400 border-transparent hover:bg-neutral-800 hover:text-white"
                            )}
                        >
                            Todos
                        </Button>
                        {allGroups.map(group => (
                            <Button
                                key={group}
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilterGroup(group === filterGroup ? null : group)}
                                className={cn(
                                    "rounded-full h-10 px-5 font-bold whitespace-nowrap transition-all border",
                                    filterGroup === group
                                        ? "bg-white text-black border-white"
                                        : "bg-neutral-800/50 text-neutral-400 border-transparent hover:bg-neutral-800 hover:text-white"
                                )}
                            >
                                {group}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Grouped by Muscle */}
            <div className="space-y-10 pb-10">
                {(() => {
                    const groupsToDisplay = filterGroup
                        ? [filterGroup]
                        : Array.from(new Set(filteredExercises.flatMap(e => e.muscleGroups || []))).sort();

                    if (groupsToDisplay.length === 0 && filteredExercises.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
                                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                    <Dumbbell className="h-8 w-8 text-neutral-600" />
                                </div>
                                <p className="text-neutral-400 font-medium">No se encontraron ejercicios con esos filtros.</p>
                                <Button
                                    variant="link"
                                    onClick={() => { setSearchTerm(""); setFilterGroup(null); }}
                                    className="text-red-500 mt-2"
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        );
                    }

                    return groupsToDisplay.map(group => {
                        const groupExercises = filteredExercises.filter(ex => ex.muscleGroups?.includes(group));

                        if (groupExercises.length === 0) return null;

                        return (
                            <div key={group} className="space-y-4">
                                {/* Section Header */}
                                <div className="flex items-center gap-3 ml-2">
                                    <div className={cn("h-3 w-3 rounded-full", getGroupColor(group).split(" ")[0].replace("/10", ""))}></div>
                                    <h2 className="text-2xl font-bold text-white capitalize tracking-tight">{group}</h2>
                                    <span className="text-xs font-bold text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
                                        {groupExercises.length}
                                    </span>
                                </div>

                                {/* Exercises Grid for this Group */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {groupExercises.map(exercise => (
                                        <div
                                            key={`${group}-${exercise.id}`}
                                            className="group flex flex-col bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-[2rem] p-5 hover:border-red-500/30 transition-all duration-300 relative overflow-hidden h-full"
                                        >
                                            {/* Gradient Blob */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-red-600/10 transition-colors"></div>

                                            {/* Content Wrapper */}
                                            <div className="flex-1 flex flex-col">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                    <div className="h-12 w-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-lg border border-neutral-800">
                                                        <Dumbbell className="h-6 w-6" />
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-500 hover:text-white hover:bg-black/40">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-neutral-900/90 backdrop-blur-xl border-neutral-800 text-white rounded-xl shadow-xl">
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-neutral-800 focus:text-white cursor-pointer p-2 rounded-lg">
                                                                <ExerciseFormDialog
                                                                    exercise={exercise}
                                                                    trigger={
                                                                        <div className="flex items-center w-full">
                                                                            <Edit className="h-4 w-4 mr-2" /> Editar
                                                                        </div>
                                                                    }
                                                                />
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(exercise.id)}
                                                                className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-red-950/30 cursor-pointer p-2 rounded-lg mt-1"
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Title */}
                                                <div className="relative z-10 mb-3">
                                                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-red-500 transition-colors tracking-tight line-clamp-2">
                                                        {exercise.name}
                                                    </h3>
                                                </div>

                                                {/* Muscle Tags */}
                                                <div className="flex flex-wrap gap-1.5 mb-2 relative z-10 mt-auto">
                                                    {exercise.muscleGroups?.slice(0, 3).map((g: string) => (
                                                        <span
                                                            key={g}
                                                            className={cn(
                                                                "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border shadow-sm",
                                                                getGroupColor(g)
                                                            )}
                                                        >
                                                            {g}
                                                        </span>
                                                    ))}
                                                    {(exercise.muscleGroups?.length || 0) > 3 && (
                                                        <span className="text-[10px] text-neutral-500 py-1 px-2 font-bold bg-neutral-900 rounded-lg border border-neutral-800">
                                                            +{exercise.muscleGroups.length - 3}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Specific Muscles */}
                                                {exercise.specificMuscles && exercise.specificMuscles.length > 0 && (
                                                    <p className="text-[11px] text-neutral-500 line-clamp-1 mb-4 relative z-10 font-medium">
                                                        {exercise.specificMuscles.join(", ")}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Video Button */}
                                            <div className="relative z-10 w-full mt-4">
                                                {exercise.videoUrl ? (
                                                    <a
                                                        href={exercise.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between text-xs text-white font-bold bg-neutral-800 hover:bg-red-600 px-4 py-3 rounded-xl transition-all w-full group/btn border border-white/5 hover:border-transparent"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <PlayCircle className="h-4 w-4 text-red-500 group-hover/btn:text-white transition-colors" />
                                                            <span>Por ejemplo</span>
                                                        </div>
                                                        <ExternalLink className="h-3 w-3 opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 font-bold bg-neutral-900/50 px-4 py-3 rounded-xl w-full border border-neutral-800 border-dashed cursor-not-allowed">
                                                        <PlayCircle className="h-4 w-4 opacity-20" />
                                                        <span>Sin Video</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}
