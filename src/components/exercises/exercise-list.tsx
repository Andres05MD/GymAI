"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Dumbbell, MoreVertical, Edit, Trash, PlayCircle } from "lucide-react";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteExercise } from "@/actions/exercise-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Buscar por nombre o músculo..."
                        className="pl-10 bg-black/50 border-neutral-800 rounded-xl text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Simple Horizontal Scrollable Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide mask-fade-right">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterGroup(null)}
                        className={`rounded-full border-neutral-800 ${!filterGroup ? "bg-white text-black" : "bg-transparent text-neutral-400"}`}
                    >
                        Todos
                    </Button>
                    {allGroups.map(group => (
                        <Button
                            key={group}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterGroup(group === filterGroup ? null : group)}
                            className={`rounded-full border-neutral-800 whitespace-nowrap ${filterGroup === group ? "bg-white text-black" : "bg-transparent text-neutral-400"}`}
                        >
                            {group}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((exercise) => (
                    <Card key={exercise.id} className="glass-card border-neutral-800 group hover:border-neutral-700 transition-all">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="h-10 w-10 bg-neutral-900 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white">
                                        <DropdownMenuItem
                                            // Trigger opens the edit dialog logic (handled by parent logic or integrated dialog)
                                            // For simplicity, we wrap the Item in the Dialog logic or pass state
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <ExerciseFormDialog
                                                exercise={exercise}
                                                trigger={
                                                    <div className="flex items-center w-full cursor-pointer">
                                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                                    </div>
                                                }
                                            />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(exercise.id)} className="text-red-500 hover:text-red-400 focus:text-red-400">
                                            <Trash className="h-4 w-4 mr-2" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">{exercise.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {exercise.muscleGroups?.slice(0, 2).map((g: string) => (
                                    <span key={g} className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-900 px-2 py-1 rounded">
                                        {g}
                                    </span>
                                ))}
                                {(exercise.muscleGroups?.length || 0) > 2 && (
                                    <span className="text-[10px] text-neutral-500 py-1">+{exercise.muscleGroups.length - 2}</span>
                                )}
                            </div>

                            {exercise.description && (
                                <p className="text-sm text-neutral-400 line-clamp-2 mb-4 h-10">
                                    {exercise.description}
                                </p>
                            )}

                            {exercise.videoUrl && (
                                <a
                                    href={exercise.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-red-500 hover:text-red-400 font-medium"
                                >
                                    <PlayCircle className="h-3 w-3 mr-1" /> Ver Video
                                </a>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {filteredExercises.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500">
                        <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No se encontraron ejercicios con esos filtros.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
