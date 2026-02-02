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
        "brazos": "bg-orange-500/10 text-orange-500 border-orange-500/20",
        "piernas": "bg-green-500/10 text-green-500 border-green-500/20",
        "core": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        "cardio": "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };

    const getGroupColor = (group: string) => {
        const key = group.toLowerCase();
        return groupColors[key] || "bg-neutral-800 text-neutral-400 border-neutral-700";
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Buscar por nombre o músculo..."
                        className="pl-11 h-12 bg-neutral-900 border-neutral-800 rounded-full text-white focus-visible:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterGroup(null)}
                        className={cn(
                            "rounded-full h-10 px-5 font-bold border-2 transition-all",
                            !filterGroup
                                ? "bg-white text-black border-white hover:bg-neutral-200"
                                : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
                        )}
                    >
                        Todos
                    </Button>
                    {allGroups.map(group => (
                        <Button
                            key={group}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterGroup(group === filterGroup ? null : group)}
                            className={cn(
                                "rounded-full h-10 px-5 font-bold whitespace-nowrap border-2 transition-all",
                                filterGroup === group
                                    ? "bg-white text-black border-white hover:bg-neutral-200"
                                    : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white"
                            )}
                        >
                            {group}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExercises.map((exercise) => (
                    <div
                        key={exercise.id}
                        className="group bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center text-red-500 group-hover:from-red-600 group-hover:to-red-700 group-hover:text-white transition-all shadow-lg">
                                <Dumbbell className="h-6 w-6" />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <ExerciseFormDialog
                                            exercise={exercise}
                                            trigger={
                                                <div className="flex items-center w-full cursor-pointer">
                                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                                </div>
                                            }
                                        />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(exercise.id)}
                                        className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                    >
                                        <Trash className="h-4 w-4 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-red-500 transition-colors">
                            {exercise.name}
                        </h3>

                        {exercise.description && (
                            <p className="text-sm text-neutral-400 line-clamp-2 mb-4 min-h-[40px]">
                                {exercise.description}
                            </p>
                        )}

                        {/* Muscle Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {exercise.muscleGroups?.slice(0, 3).map((g: string) => (
                                <span
                                    key={g}
                                    className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border",
                                        getGroupColor(g)
                                    )}
                                >
                                    {g}
                                </span>
                            ))}
                            {(exercise.muscleGroups?.length || 0) > 3 && (
                                <span className="text-[10px] text-neutral-500 py-1 font-bold">
                                    +{exercise.muscleGroups.length - 3}
                                </span>
                            )}
                        </div>

                        {/* Video Link */}
                        {exercise.videoUrl && (
                            <a
                                href={exercise.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-red-500 hover:text-red-400 font-bold bg-red-500/10 px-3 py-2 rounded-full transition-colors"
                            >
                                <PlayCircle className="h-4 w-4" /> Ver Demostración
                                <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {filteredExercises.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
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
                )}
            </div>
        </div>
    );
}
